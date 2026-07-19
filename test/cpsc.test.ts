import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseRecalls,
  fetchRecallsByUpc,
  checkRecall,
  type RecallEnv,
} from '../src/recalls/cpsc.js';

/** Minimal in-memory KV stub mimicking the bits of KVNamespace we use. */
function makeKV() {
  const store = new Map<string, string>();
  const get = vi.fn(async (key: string, type?: string) => {
    const v = store.get(key);
    if (v === undefined) return null;
    return type === 'json' ? JSON.parse(v) : v;
  });
  const put = vi.fn(async (key: string, value: string) => {
    store.set(key, value);
  });
  return { store, get, put };
}

function envWith(kv: ReturnType<typeof makeKV>): RecallEnv {
  return { CACHE: kv as unknown as KVNamespace, CPSC_API_BASE: 'https://api.test/Recall' };
}

/** A Response-like object good enough for fetchJson. */
function jsonResponse(data: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => data } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('parseRecalls — defensive field mapping', () => {
  it('returns [] for non-array / empty input', () => {
    expect(parseRecalls([])).toEqual([]);
    expect(parseRecalls(null)).toEqual([]);
    expect(parseRecalls(undefined)).toEqual([]);
    expect(parseRecalls({})).toEqual([]);
    expect(parseRecalls('nope')).toEqual([]);
  });

  it('maps a fully-populated record, joining multiple manufacturers and hazards', () => {
    const [m] = parseRecalls([
      {
        RecallNumber: '23-123',
        RecallDate: '2023-05-01T00:00:00',
        Title: 'Recalled fridge',
        URL: 'https://x/recall',
        Manufacturers: [{ Name: 'Acme' }, { Name: 'Globex' }],
        Products: [{ Name: 'Cooler 3000', Type: 'Refrigerator' }],
        Hazards: [{ Name: 'Fire' }, { Name: 'Burn' }],
      },
    ]);
    expect(m.recallNumber).toBe('23-123');
    expect(m.recallDate).toBe('2023-05-01'); // date sliced to 10 chars
    expect(m.company).toBe('Acme, Globex');
    expect(m.productType).toBe('Refrigerator'); // Type preferred over Name
    expect(m.hazard).toBe('Fire; Burn');
    expect(m.url).toBe('https://x/recall');
  });

  it('falls back gracefully when arrays/fields are missing', () => {
    const [m] = parseRecalls([{ RecallNumber: '1' }]);
    expect(m.recallNumber).toBe('1');
    expect(m.recallDate).toBe('');
    expect(m.company).toBe('Unknown');
    expect(m.productType).toBe('Unknown product');
    expect(m.hazard).toBe('See recall notice');
    expect(m.url).toBeUndefined();
  });

  it('uses product Name, then Title, when Type is absent', () => {
    const [byName] = parseRecalls([{ Products: [{ Name: 'Dishwasher X' }] }]);
    expect(byName.productType).toBe('Dishwasher X');
    const [byTitle] = parseRecalls([{ Title: 'Some recalled thing' }]);
    expect(byTitle.productType).toBe('Some recalled thing');
  });

  it('maps every element of a multi-record payload', () => {
    const out = parseRecalls([{ RecallNumber: 'a' }, { RecallNumber: 'b' }, { RecallNumber: 'c' }]);
    expect(out.map((r) => r.recallNumber)).toEqual(['a', 'b', 'c']);
  });
});

describe('fetchRecallsByUpc', () => {
  it("returns 'active' with matches when the API returns records", async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) =>
      jsonResponse([{ RecallNumber: '9', Products: [{ Type: 'Dryer' }] }]),
    );
    vi.stubGlobal('fetch', fetchMock);

    const r = await fetchRecallsByUpc('https://api.test/Recall', '012345678905');
    expect(r.status).toBe('active');
    expect(r.matches).toHaveLength(1);
    // UPC is passed through to the request URL.
    expect(String(fetchMock.mock.calls[0][0])).toContain('012345678905');
  });

  it("returns 'clear' when the API returns an empty array", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([])));
    const r = await fetchRecallsByUpc('https://api.test/Recall', '000');
    expect(r.status).toBe('clear');
    expect(r.matches).toEqual([]);
    expect(r.note).toBeTruthy();
  });

  it("returns 'unavailable' when fetch throws", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    const r = await fetchRecallsByUpc('https://api.test/Recall', '000');
    expect(r.status).toBe('unavailable');
    expect(r.matches).toEqual([]);
  });

  it("returns 'unavailable' on a non-OK HTTP response", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(null, false, 503)));
    const r = await fetchRecallsByUpc('https://api.test/Recall', '000');
    expect(r.status).toBe('unavailable');
  });
});

describe('checkRecall — KV caching', () => {
  it('on a cache miss it fetches, returns active, and writes the result to cache', async () => {
    const kv = makeKV();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse([{ RecallNumber: '9', Products: [{ Type: 'Dryer' }] }])),
    );

    const r = await checkRecall(envWith(kv), 'UPC123');
    expect(r.status).toBe('active');
    // Read attempted, then written.
    expect(kv.get).toHaveBeenCalledWith('recall:upc:UPC123', 'json');
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(kv.store.has('recall:upc:UPC123')).toBe(true);
  });

  it('on a cache hit it returns the cached value without fetching', async () => {
    const kv = makeKV();
    const cached = { status: 'clear', matches: [], note: 'cached' };
    kv.store.set('recall:upc:UPC123', JSON.stringify(cached));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const r = await checkRecall(envWith(kv), 'UPC123');
    expect(r).toEqual(cached);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(kv.put).not.toHaveBeenCalled();
  });

  it('does not cache a transient unavailable result', async () => {
    const kv = makeKV();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('down');
      }),
    );
    const r = await checkRecall(envWith(kv), 'UPC404');
    expect(r.status).toBe('unavailable');
    expect(kv.put).not.toHaveBeenCalled();
    expect(kv.store.has('recall:upc:UPC404')).toBe(false);
  });

  it('caches a definitive clear result', async () => {
    const kv = makeKV();
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([])));
    const r = await checkRecall(envWith(kv), 'UPCclear');
    expect(r.status).toBe('clear');
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(kv.store.has('recall:upc:UPCclear')).toBe(true);
  });
});
