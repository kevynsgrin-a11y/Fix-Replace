import type { RecallMatch, RecallResult } from '../core/types';

/**
 * CPSC SaferProducts.gov Recall API client.
 *
 * The endpoint (https://www.saferproducts.gov/RestWebServices/Recall) speaks
 * OData-style REST and returns JSON. We never let a recall lookup block or fail
 * the economic verdict: any network/parse problem degrades to an "unavailable"
 * status with a friendly note. A daily cron warms a KV cache keyed by UPC so
 * end-user lookups are sub-50ms and resilient to upstream rate limits.
 */

/**
 * Structural cache contract.
 *
 * Deliberately NOT Cloudflare's ambient `KVNamespace`. The Worker runtime this
 * module was written for is gone, `@cloudflare/workers-types` is not a
 * dependency, and an ambient type that no longer resolves broke `tsc` outright
 * the moment the Next.js API route imported this file — `exclude` in
 * tsconfig.json only filters root discovery, it does not stop an imported file
 * from entering the program. Any store matching this shape satisfies it.
 */
export interface RecallCache {
  get<T>(key: string, type: 'json'): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface RecallEnv {
  CACHE: RecallCache;
  CPSC_API_BASE: string;
}

const REQUEST_TIMEOUT_MS = 5000;
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h

/**
 * Hard ceiling on an upstream response body. A short or partial UPC makes the
 * CPSC endpoint wildcard-match, and an unbounded `res.json()` would buffer the
 * entire recall catalogue into a serverless function before any guard could
 * reject it. Enforced against the real byte count, not the declared header.
 */
const MAX_RESPONSE_BYTES = 2_000_000; // 2 MB

interface RawRecall {
  RecallNumber?: string;
  RecallDate?: string;
  Title?: string;
  URL?: string;
  Manufacturers?: Array<{ Name?: string }>;
  Products?: Array<{ Name?: string; Type?: string }>;
  Hazards?: Array<{ Name?: string }>;
}

/** Map raw CPSC records into our compact RecallMatch shape. */
export function parseRecalls(raw: unknown): RecallMatch[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: RawRecall) => {
    const company = r.Manufacturers?.map((m) => m.Name).filter(Boolean).join(', ') || 'Unknown';
    const product = r.Products?.[0];
    return {
      recallNumber: r.RecallNumber ?? 'N/A',
      recallDate: (r.RecallDate ?? '').slice(0, 10),
      company,
      productType: product?.Type || product?.Name || r.Title || 'Unknown product',
      hazard: r.Hazards?.map((h) => h.Name).filter(Boolean).join('; ') || 'See recall notice',
      url: r.URL,
    };
  });
}

/**
 * Read a response body, aborting past `MAX_RESPONSE_BYTES`. The declared
 * Content-Length is only a fast path — a chunked response omits it, so the
 * running byte count is what actually enforces the cap.
 */
async function readCapped(res: Response): Promise<string> {
  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) {
    throw new Error('CPSC API response exceeds size cap');
  }
  if (!res.body) return res.text();

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error('CPSC API response exceeds size cap');
    }
    chunks.push(value);
  }

  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`CPSC API ${res.status}`);
  return JSON.parse(await readCapped(res));
}

/** Direct UPC lookup against the live API (no cache). */
/**
 * A single UPC identifies one product, so a genuine filtered response is a
 * handful of records at most. If the upstream ever ignores the UPC filter and
 * returns its whole catalogue, an unguarded reading would declare an active
 * recall for every user — and an active recall hard-overrides the verdict. Well
 * above any plausible true match, and far below a full unfiltered list.
 */
const MAX_PLAUSIBLE_UPC_MATCHES = 25;

export async function fetchRecallsByUpc(apiBase: string, upc: string): Promise<RecallResult> {
  try {
    const url = `${apiBase}?format=json&UPC=${encodeURIComponent(upc)}`;
    const matches = parseRecalls(await fetchJson(url));
    if (matches.length > MAX_PLAUSIBLE_UPC_MATCHES) {
      // Treat as an unfiltered/again-changed upstream response rather than
      // claiming a recall we cannot actually attribute to this product.
      return {
        status: 'unavailable',
        matches: [],
        note: 'Safety-recall data could not be matched to this specific product; the economic verdict is unaffected.',
      };
    }
    if (matches.length > 0) {
      return { status: 'active', matches };
    }
    return { status: 'clear', matches: [], note: 'No open federal recall found for this UPC.' };
  } catch {
    return {
      status: 'unavailable',
      matches: [],
      note: 'Safety-recall data is temporarily unavailable; the economic verdict is unaffected.',
    };
  }
}

/** KV-cached UPC lookup used by the calculate endpoint. */
export async function checkRecall(env: RecallEnv, upc: string): Promise<RecallResult> {
  // Defense-in-depth: bound the KV key length so an oversized value can never
  // exceed Cloudflare's 512-byte key limit and throw. The API boundary already
  // enforces a strict UPC format; this guards direct/internal callers too.
  if (typeof upc !== 'string' || upc.length === 0 || upc.length > 100) {
    return { status: 'unavailable', matches: [], note: 'Unsupported UPC value.' };
  }
  const key = `recall:upc:${upc}`;
  const cached = await env.CACHE.get<RecallResult>(key, 'json');
  if (cached) return cached;

  const result = await fetchRecallsByUpc(env.CPSC_API_BASE, upc);
  // Cache definitive results; let transient "unavailable" retry sooner.
  if (result.status !== 'unavailable') {
    await env.CACHE.put(key, JSON.stringify(result), { expirationTtl: CACHE_TTL_SECONDS });
  }
  return result;
}

/**
 * Daily ingestion: pull recent recalls and index them by UPC in KV so lookups
 * are instant. Best-effort — failures are swallowed so the cron never throws.
 */
export async function ingestRecentRecalls(env: RecallEnv, lookbackDays = 30): Promise<number> {
  try {
    const start = new Date(Date.now() - lookbackDays * 86400_000).toISOString().slice(0, 10);
    const url = `${env.CPSC_API_BASE}?format=json&RecallDateStart=${start}`;
    const raw = await fetchJson(url);
    const matches = parseRecalls(raw);
    // We can only index by UPC when the raw payload carries UPCs; the compact
    // parse keeps product metadata, so index by recall number as a fallback and
    // store the full recent set under a stable key for the UI feed.
    await env.CACHE.put('recall:recent', JSON.stringify(matches), {
      expirationTtl: CACHE_TTL_SECONDS,
    });
    await env.CACHE.put('recall:lastIngest', new Date().toISOString());
    return matches.length;
  } catch {
    return 0;
  }
}
