import { calculateDecision } from '../core/decision.js';
import { getCatalog } from '../core/catalog.js';
import type { ApplianceCategory, CalculationInput } from '../core/types.js';
import { APPLIANCES } from '../data/appliances.js';
import { getComponent } from '../data/partCosts.js';
import { checkRecall, fetchRecallsByUpc, ingestRecentRecalls } from '../recalls/cpsc.js';

/**
 * RepairOrReplace edge Worker.
 *
 * A single Worker serves the static frontend (via the ASSETS binding) and the
 * /api/* compute layer that runs the NPC + Weibull algorithms and the CPSC
 * recall lookups. Static, editorial content is delivered straight from the
 * asset store; only genuine computation touches the Worker.
 */

export interface Env {
  ASSETS: Fetcher;
  /** Optional — Phase 2 (accounts + inventories). Absent until provisioned. */
  DB?: D1Database;
  /** Optional — enables result sharing, recall caching, and the daily cron. */
  CACHE?: KVNamespace;
  /** Optional — Phase 3 (generated PDF reports). */
  REPORTS?: R2Bucket;
  DISCOUNT_RATE: string;
  CPSC_API_BASE: string;
}

/** Recall lookup that uses the KV cache when provisioned, else hits CPSC directly. */
function recallLookup(env: Env, upc: string) {
  if (env.CACHE) {
    return checkRecall({ CACHE: env.CACHE, CPSC_API_BASE: env.CPSC_API_BASE }, upc);
  }
  return fetchRecallsByUpc(env.CPSC_API_BASE, upc);
}

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...SECURITY_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

const VALID_CATEGORIES = new Set(Object.keys(APPLIANCES));
const VALID_VERDICTS = new Set(['repair', 'replace', 'uncertain']);
const VALID_TIERS = new Set(['budget', 'mid', 'premium']);
const VALID_FUELS = new Set(['gas', 'electric']);
const UPC_RE = /^[0-9]{8,14}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REPORT_BYTES = 32 * 1024;

/**
 * Validate and lightly sanitize the calculation request. Every field that
 * reaches the math is checked: an invalid brandTier or a non-finite ageYears
 * would otherwise propagate NaN into the model and be served as a 200. A
 * faultComponent that does not belong to the submitted category is dropped so
 * repair bands, DIY links, and hazard evaluation stay consistent with the
 * appliance instead of keying off an impossible part.
 */
function validateInput(body: unknown): { ok: true; value: CalculationInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Request body must be a JSON object.' };
  const b = body as Record<string, unknown>;

  if (typeof b.category !== 'string' || !VALID_CATEGORIES.has(b.category)) {
    return { ok: false, error: 'A valid appliance "category" is required.' };
  }
  if (typeof b.repairQuote !== 'number' || !Number.isFinite(b.repairQuote) || b.repairQuote < 0 || b.repairQuote > 1e9) {
    return { ok: false, error: 'A non-negative numeric "repairQuote" is required.' };
  }
  if (b.brandTier !== undefined && (typeof b.brandTier !== 'string' || !VALID_TIERS.has(b.brandTier))) {
    return { ok: false, error: '"brandTier" must be one of budget, mid, or premium.' };
  }
  if (
    b.ageYears !== undefined &&
    (typeof b.ageYears !== 'number' || !Number.isFinite(b.ageYears) || b.ageYears < 0 || b.ageYears > 200)
  ) {
    return { ok: false, error: '"ageYears" must be a finite number between 0 and 200.' };
  }
  if (
    b.newUnitPrice !== undefined &&
    (typeof b.newUnitPrice !== 'number' || !Number.isFinite(b.newUnitPrice) || b.newUnitPrice <= 0 || b.newUnitPrice > 1e9)
  ) {
    return { ok: false, error: '"newUnitPrice" must be a positive number.' };
  }
  if (b.fuelType !== undefined && (typeof b.fuelType !== 'string' || !VALID_FUELS.has(b.fuelType))) {
    return { ok: false, error: '"fuelType" must be "gas" or "electric".' };
  }
  if (b.upc !== undefined && (typeof b.upc !== 'string' || !UPC_RE.test(b.upc))) {
    return { ok: false, error: '"upc" must be 8–14 digits.' };
  }
  if (b.underWarranty !== undefined && typeof b.underWarranty !== 'boolean') {
    return { ok: false, error: '"underWarranty" must be a boolean.' };
  }
  if (b.energyStarReplacement !== undefined && typeof b.energyStarReplacement !== 'boolean') {
    return { ok: false, error: '"energyStarReplacement" must be a boolean.' };
  }
  if (b.location !== undefined) {
    if (typeof b.location !== 'object' || b.location === null || Array.isArray(b.location)) {
      return { ok: false, error: '"location" must be an object.' };
    }
    const loc = b.location as Record<string, unknown>;
    for (const k of ['zip', 'metro', 'state'] as const) {
      if (loc[k] !== undefined && typeof loc[k] !== 'string') delete loc[k];
    }
  }

  if (b.faultComponent !== undefined) {
    const comp = typeof b.faultComponent === 'string' ? getComponent(b.faultComponent) : null;
    if (!comp || !comp.categories.includes(b.category as ApplianceCategory)) {
      delete b.faultComponent;
    }
  }

  return { ok: true, value: b as unknown as CalculationInput };
}

async function handleCalculate(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const parsed = validateInput(body);
  if (!parsed.ok) return json({ error: parsed.error }, { status: 400 });

  const discountRate = Number.parseFloat(env.DISCOUNT_RATE);
  const result = await calculateDecision(parsed.value, {
    discountRate: Number.isFinite(discountRate) ? discountRate : undefined,
    recallLookup: (upc) => recallLookup(env, upc),
  });
  return json(result);
}

async function handleRecall(url: URL, env: Env): Promise<Response> {
  const upc = url.searchParams.get('upc');
  if (!upc || !UPC_RE.test(upc)) {
    return json({ error: 'A valid "upc" (8–14 digits) query parameter is required.' }, { status: 400 });
  }
  const result = await recallLookup(env, upc);
  return json(result);
}

async function handleReportSave(request: Request, env: Env): Promise<Response> {
  if (!env.CACHE) {
    return json({ error: 'Sharing is temporarily unavailable on this deployment.' }, { status: 503 });
  }
  // Bound the payload before touching KV: the endpoint is unauthenticated, so a
  // size cap + shape check keep it from being abused to flood the namespace.
  const declared = Number(request.headers.get('content-length') ?? '');
  if (Number.isFinite(declared) && declared > MAX_REPORT_BYTES) {
    return json({ error: 'Report payload too large.' }, { status: 413 });
  }
  const text = await request.text();
  if (text.length > MAX_REPORT_BYTES) {
    return json({ error: 'Report payload too large.' }, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null) {
    return json({ error: 'Body must be a calculation result.' }, { status: 400 });
  }
  const rec = body as Record<string, unknown>;
  if (!VALID_VERDICTS.has(rec.verdict as string)) {
    return json({ error: 'Body must be a calculation result.' }, { status: 400 });
  }
  // The client coerces numeric fields on render, but reject an obviously-tampered
  // gaugePosition here too so no HTML-bearing value is ever stored.
  if (rec.gaugePosition !== undefined && rec.gaugePosition !== null && typeof rec.gaugePosition !== 'number') {
    return json({ error: 'Invalid result payload.' }, { status: 400 });
  }
  const id = crypto.randomUUID();
  await env.CACHE.put(`report:${id}`, JSON.stringify(body), { expirationTtl: 60 * 60 * 24 * 7 });
  return json({ id, url: `/r?id=${id}` }, { status: 201 });
}

async function handleReportGet(url: URL, env: Env): Promise<Response> {
  if (!env.CACHE) {
    return json({ error: 'Sharing is temporarily unavailable on this deployment.' }, { status: 503 });
  }
  const id = url.searchParams.get('id');
  if (!id || !UUID_RE.test(id)) return json({ error: 'A valid report "id" is required.' }, { status: 400 });
  const stored = await env.CACHE.get(`report:${id}`);
  if (!stored) return json({ error: 'Report not found or expired.' }, { status: 404 });
  return new Response(stored, {
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS },
  });
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;

  if (path === '/api/health') return json({ ok: true, service: 'repair-or-replace' });
  if (path === '/api/catalog') {
    return json(getCatalog(), {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  }
  if (path === '/api/calculate' && request.method === 'POST') return handleCalculate(request, env);
  if (path === '/api/recalls' && request.method === 'GET') return handleRecall(url, env);
  if (path === '/api/report' && request.method === 'POST') return handleReportSave(request, env);
  if (path === '/api/report' && request.method === 'GET') return handleReportGet(url, env);

  return json({ error: 'Not found.' }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        // Log server-side (captured by observability) but never leak internals.
        console.error('api_error', err);
        return json({ error: 'Internal error' }, { status: 500 });
      }
    }
    // Everything else is a static asset (frontend + editorial content).
    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    // Recall ingestion needs the KV cache; no-op until it is provisioned.
    if (!env.CACHE) return;
    ctx.waitUntil(ingestRecentRecalls({ CACHE: env.CACHE, CPSC_API_BASE: env.CPSC_API_BASE }));
  },
};
