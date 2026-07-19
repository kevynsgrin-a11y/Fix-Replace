import { describe, it, expect } from 'vitest';
import worker from '../src/worker/index.js';

/** Minimal in-memory KV stub. */
function makeKV(overrides: Partial<{ get: unknown; put: unknown }> = {}) {
  const store = new Map<string, string>();
  return {
    store,
    get: overrides.get ?? (async (k: string) => (store.has(k) ? store.get(k)! : null)),
    put: overrides.put ?? (async (k: string, v: string) => { store.set(k, v); }),
  };
}

function makeEnv(cache = makeKV()): any {
  return {
    ASSETS: { fetch: async () => new Response('static-asset', { status: 200 }) },
    DB: {},
    CACHE: cache,
    REPORTS: {},
    DISCOUNT_RATE: '0.05',
    CPSC_API_BASE: 'https://api.test/Recall',
  };
}

function req(path: string, init: RequestInit = {}) {
  return new Request('https://ror.test' + path, init);
}
function postJson(path: string, body: unknown, raw?: string) {
  return req(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw !== undefined ? raw : JSON.stringify(body),
  });
}

const base = { category: 'dryer', brandTier: 'mid', ageYears: 8, faultComponent: 'thermal_fuse', repairQuote: 145 };

describe('worker /api/calculate validation', () => {
  it('accepts a valid request and returns a verdict', async () => {
    const res = await worker.fetch(postJson('/api/calculate', base), makeEnv());
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(['repair', 'replace', 'uncertain']).toContain(data.verdict);
  });

  it('rejects an invalid brandTier (would NaN the model) with 400', async () => {
    const res = await worker.fetch(postJson('/api/calculate', { ...base, brandTier: 'foo' }), makeEnv());
    expect(res.status).toBe(400);
  });

  it('rejects a non-finite ageYears (1e309 -> Infinity) with 400', async () => {
    const raw = '{"category":"dryer","repairQuote":200,"ageYears":1e309}';
    const res = await worker.fetch(postJson('/api/calculate', null, raw), makeEnv());
    expect(res.status).toBe(400);
  });

  it('rejects an unknown category and a negative quote', async () => {
    expect((await worker.fetch(postJson('/api/calculate', { ...base, category: 'toaster' }), makeEnv())).status).toBe(400);
    expect((await worker.fetch(postJson('/api/calculate', { ...base, repairQuote: -5 }), makeEnv())).status).toBe(400);
  });

  it('rejects a malformed upc with 400', async () => {
    expect((await worker.fetch(postJson('/api/calculate', { ...base, upc: '12' }), makeEnv())).status).toBe(400);
    expect((await worker.fetch(postJson('/api/calculate', { ...base, upc: 12345678 }), makeEnv())).status).toBe(400);
  });

  it('drops a faultComponent that does not belong to the category', async () => {
    const res = await worker.fetch(
      postJson('/api/calculate', { category: 'hvac_central', brandTier: 'mid', ageYears: 10, faultComponent: 'thermal_fuse', repairQuote: 300 }),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const data: any = await res.json();
    expect(data.resolvedInput.faultComponent).toBeNull();
  });

  it('keeps a faultComponent that does belong to the category', async () => {
    const res = await worker.fetch(
      postJson('/api/calculate', { category: 'hvac_central', brandTier: 'mid', ageYears: 10, faultComponent: 'hvac_capacitor', repairQuote: 300 }),
      makeEnv(),
    );
    const data: any = await res.json();
    expect(data.resolvedInput.faultComponent).toBe('hvac_capacitor');
  });
});

describe('worker /api/recalls', () => {
  it('rejects a missing or malformed upc with 400', async () => {
    expect((await worker.fetch(req('/api/recalls'), makeEnv())).status).toBe(400);
    expect((await worker.fetch(req('/api/recalls?upc=abc'), makeEnv())).status).toBe(400);
  });
});

describe('worker /api/report', () => {
  it('round-trips a valid result and issues a uuid share url', async () => {
    const env = makeEnv();
    const saveRes = await worker.fetch(postJson('/api/report', { verdict: 'repair', npc: {} }), env);
    expect(saveRes.status).toBe(201);
    const { id, url } = (await saveRes.json()) as any;
    expect(url).toBe(`/r?id=${id}`);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);

    const getRes = await worker.fetch(req(`/api/report?id=${id}`), env);
    expect(getRes.status).toBe(200);
    expect(((await getRes.json()) as any).verdict).toBe('repair');
  });

  it('rejects a non-result body with 400', async () => {
    const res = await worker.fetch(postJson('/api/report', { foo: 1 }), makeEnv());
    expect(res.status).toBe(400);
  });

  it('rejects an unknown verdict with 400', async () => {
    const res = await worker.fetch(postJson('/api/report', { verdict: 'hacked' }), makeEnv());
    expect(res.status).toBe(400);
  });

  it('rejects a non-numeric gaugePosition (XSS payload) with 400', async () => {
    const res = await worker.fetch(
      postJson('/api/report', { verdict: 'replace', gaugePosition: '<img src=x onerror=alert(1)>' }),
      makeEnv(),
    );
    expect(res.status).toBe(400);
  });

  it('accepts a numeric gaugePosition', async () => {
    const res = await worker.fetch(postJson('/api/report', { verdict: 'replace', gaugePosition: 82 }), makeEnv());
    expect(res.status).toBe(201);
  });

  it('rejects an oversized payload with 413', async () => {
    const big = '{"verdict":"repair","pad":"' + 'x'.repeat(33 * 1024) + '"}';
    const res = await worker.fetch(postJson('/api/report', null, big), makeEnv());
    expect(res.status).toBe(413);
  });

  it('rejects a malformed report id with 400 and a missing one with 404', async () => {
    expect((await worker.fetch(req('/api/report?id=not-a-uuid'), makeEnv())).status).toBe(400);
    expect((await worker.fetch(req('/api/report?id=00000000-0000-0000-0000-000000000000'), makeEnv())).status).toBe(404);
  });
});

describe('worker misc', () => {
  it('serves /api/health', async () => {
    const res = await worker.fetch(req('/api/health'), makeEnv());
    expect(res.status).toBe(200);
    expect(((await res.json()) as any).ok).toBe(true);
  });

  it('falls through to static assets for non-api paths', async () => {
    const res = await worker.fetch(req('/guides/refrigerator'), makeEnv());
    expect(await res.text()).toBe('static-asset');
  });

  it('returns a generic 500 without leaking internals', async () => {
    const cache = makeKV({
      get: async () => {
        throw new Error('super secret internal KV failure');
      },
    });
    const res = await worker.fetch(req('/api/report?id=00000000-0000-0000-0000-000000000000'), makeEnv(cache));
    expect(res.status).toBe(500);
    const data: any = await res.json();
    expect(data.detail).toBeUndefined();
    expect(JSON.stringify(data)).not.toContain('secret');
  });
});
