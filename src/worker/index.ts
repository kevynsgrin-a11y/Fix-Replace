import { calculateDecision } from '../core/decision.js';
import { getCatalog } from '../core/catalog.js';
import type { CalculationInput } from '../core/types.js';
import { APPLIANCES } from '../data/appliances.js';
import { checkRecall, ingestRecentRecalls } from '../recalls/cpsc.js';

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
  DB: D1Database;
  CACHE: KVNamespace;
  REPORTS: R2Bucket;
  DISCOUNT_RATE: string;
  CPSC_API_BASE: string;
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

function validateInput(body: unknown): { ok: true; value: CalculationInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Request body must be a JSON object.' };
  const b = body as Record<string, unknown>;
  if (typeof b.category !== 'string' || !VALID_CATEGORIES.has(b.category)) {
    return { ok: false, error: 'A valid appliance "category" is required.' };
  }
  if (typeof b.repairQuote !== 'number' || !Number.isFinite(b.repairQuote) || b.repairQuote < 0) {
    return { ok: false, error: 'A non-negative numeric "repairQuote" is required.' };
  }
  if (b.ageYears !== undefined && (typeof b.ageYears !== 'number' || b.ageYears < 0)) {
    return { ok: false, error: '"ageYears" must be a non-negative number.' };
  }
  return { ok: true, value: body as CalculationInput };
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
    recallLookup: (upc) => checkRecall(env, upc),
  });
  return json(result);
}

async function handleRecall(url: URL, env: Env): Promise<Response> {
  const upc = url.searchParams.get('upc');
  if (!upc) return json({ error: 'A "upc" query parameter is required.' }, { status: 400 });
  const result = await checkRecall(env, upc);
  return json(result);
}

async function handleReportSave(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const id = crypto.randomUUID();
  await env.CACHE.put(`report:${id}`, JSON.stringify(body), { expirationTtl: 60 * 60 * 24 * 30 });
  return json({ id, url: `/r?id=${id}` }, { status: 201 });
}

async function handleReportGet(url: URL, env: Env): Promise<Response> {
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'An "id" query parameter is required.' }, { status: 400 });
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
        return json({ error: 'Internal error', detail: String(err) }, { status: 500 });
      }
    }
    // Everything else is a static asset (frontend + editorial content).
    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(ingestRecentRecalls(env));
  },
};
