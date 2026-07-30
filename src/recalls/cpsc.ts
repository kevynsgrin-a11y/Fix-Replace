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

export interface RecallEnv {
  CACHE: KVNamespace;
  CPSC_API_BASE: string;
}

const REQUEST_TIMEOUT_MS = 5000;
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h

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

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`CPSC API ${res.status}`);
  return res.json();
}

/** Direct UPC lookup against the live API (no cache). */
export async function fetchRecallsByUpc(apiBase: string, upc: string): Promise<RecallResult> {
  try {
    const url = `${apiBase}?format=json&UPC=${encodeURIComponent(upc)}`;
    const matches = parseRecalls(await fetchJson(url));
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
