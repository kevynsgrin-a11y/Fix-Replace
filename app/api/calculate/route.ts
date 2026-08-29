import { NextResponse } from "next/server"
import { calculateDecision } from "@/src/core/decision"
import { fetchRecallsByUpc } from "@/src/recalls/cpsc"
import type {
  ApplianceCategory,
  BrandTier,
  CalculationInput,
  FuelType,
  LocationInput,
  RecallResult,
} from "@/src/core/types"

export const runtime = "nodejs"

/**
 * Live CPSC SaferProducts.gov Recall endpoint. Overridable so a mirror or a
 * local fixture server can be pointed at without a code change.
 */
const CPSC_API_BASE =
  process.env.CPSC_API_BASE || "https://www.saferproducts.gov/RestWebServices/Recall"

/**
 * Generous ceiling for this payload shape (a dozen short scalar fields).
 * Enforced against the body's real byte length, not the declared
 * Content-Length — that header is absent on a chunked request and trivially
 * lied about — so nothing over the cap ever reaches `JSON.parse`. The bytes are
 * still read off the wire first; bounding the *transfer* is the platform's job
 * (edge/WAF request-size limits), this bounds what we parse.
 */
const MAX_BODY_BYTES = 10_000

/**
 * A UPC-A is 12 digits, EAN-13 is 13, GTIN-14 is 14. Anything shorter is a
 * partial code, and CPSC's Recall service wildcard-matches the UPC field, so a
 * partial would match unrelated recalled products — and a recall hit hard-
 * overrides the verdict to "repair". Short/garbled input must not opt into the
 * lookup at all.
 */
const UPC_MIN_DIGITS = 12
const UPC_MAX_DIGITS = 14

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 20
/** Hard ceiling on tracked clients so a distributed flood cannot grow the map. */
const RATE_LIMIT_MAX_CLIENTS = 10_000

const CATEGORIES: ApplianceCategory[] = [
  "refrigerator_freestanding",
  "refrigerator_builtin",
  "washer_frontload",
  "washer_topload",
  "dryer",
  "dishwasher",
  "range_gas",
  "range_electric",
  "oven",
  "water_heater",
  "microwave_otr",
  "hvac_central",
]
const TIERS: BrandTier[] = ["budget", "mid", "premium"]

/**
 * Live recall lookup against CPSC SaferProducts.gov. The client owns its own
 * 5s timeout and degrades to status "unavailable" on any network/parse failure,
 * so a recall check can never block or fail the economic verdict.
 */
function recallLookup(upc: string): Promise<RecallResult> {
  return fetchRecallsByUpc(CPSC_API_BASE, upc)
}

/**
 * Sliding-window request counter, per instance, and only for requests that
 * carry a trusted client key (see `clientKeyFor`). Serverless instances do not
 * share memory, so this is an interim backstop against a single noisy client —
 * platform-level (WAF/edge) rate limiting is the real control, and it is the
 * only control on a deployment that does not set TRUST_PROXY_HEADER.
 */
const requestLog = new Map<string, number[]>()
let lastSweep = 0

/** Drop stamps older than the window and forget clients with none left. */
function sweep(now: number) {
  const cutoff = now - RATE_LIMIT_WINDOW_MS
  for (const [key, stamps] of requestLog) {
    const fresh = stamps.filter((t) => t > cutoff)
    if (fresh.length === 0) requestLog.delete(key)
    else requestLog.set(key, fresh)
  }
  lastSweep = now
}

function isRateLimited(clientKey: string): boolean {
  const now = Date.now()
  // Every entry expires within one window, so sweeping once per window keeps
  // the map bounded by the clients actually seen recently. The size check is
  // the backstop for a flood of unique keys arriving inside a single window.
  if (now - lastSweep > RATE_LIMIT_WINDOW_MS || requestLog.size > RATE_LIMIT_MAX_CLIENTS) {
    sweep(now)
    // Still oversized after a sweep means the traffic is genuinely fresh and
    // adversarial; drop the table rather than leak memory. Worst case a few
    // clients get an extra window's allowance.
    if (requestLog.size > RATE_LIMIT_MAX_CLIENTS) requestLog.clear()
  }

  const cutoff = now - RATE_LIMIT_WINDOW_MS
  const recent = (requestLog.get(clientKey) ?? []).filter((t) => t > cutoff)
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(clientKey, recent)
    return true
  }
  recent.push(now)
  requestLog.set(clientKey, recent)
  return false
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

/**
 * Per-client key for the limiter, or null when there is nobody trustworthy to
 * key on. `x-forwarded-for` is only meaningful behind a proxy that overwrites
 * it: unproxied it is attacker-controlled (rotate the header, evade the limit)
 * and usually absent entirely, which would collapse every visitor into one
 * shared bucket and 429 the calculator site-wide after RATE_LIMIT_MAX_REQUESTS.
 * So it is read only when the deployment opts in with TRUST_PROXY_HEADER=1;
 * otherwise per-client limiting is skipped rather than misapplied.
 */
function clientKeyFor(request: Request): string | null {
  if (process.env.TRUST_PROXY_HEADER !== "1") return null
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
}

export async function POST(request: Request) {
  // Fast path: a declared length over the cap is refused without reading the
  // body. A missing header coerces to 0 and a malformed one to NaN, so neither
  // rejects here — the real enforcement is the byte count below.
  const declaredBytes = Number(request.headers.get("content-length"))
  if (Number.isFinite(declaredBytes) && declaredBytes > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 })
  }

  const clientKey = clientKeyFor(request)
  if (clientKey && isRateLimited(clientKey)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 })
  }
  // Enforced on the actual bytes, so a chunked or under-declared body cannot
  // slip an oversized payload past the header check into the JSON parser.
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 })
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 })
  }

  const category = body.category
  if (typeof category !== "string" || !CATEGORIES.includes(category as ApplianceCategory)) {
    return NextResponse.json({ error: "Unknown appliance category." }, { status: 400 })
  }

  const tier = typeof body.tier === "string" && TIERS.includes(body.tier as BrandTier)
    ? (body.tier as BrandTier)
    : "mid"

  const quote = Number(body.quote)
  if (!Number.isFinite(quote) || quote <= 0) {
    return NextResponse.json({ error: "A repair quote greater than $0 is required." }, { status: 400 })
  }

  // Location: metro OR zip.
  let location: LocationInput | undefined
  if (isRecord(body.location)) {
    const loc = body.location
    if (typeof loc.metro === "string" && loc.metro) location = { metro: loc.metro }
    else if (typeof loc.zip === "string" && loc.zip) location = { zip: loc.zip }
  }

  const input: CalculationInput = {
    category: category as ApplianceCategory,
    brandTier: tier,
    repairQuote: quote,
    underWarranty: body.warranty === true,
    energyStarReplacement: body.energyStar !== false,
    location,
  } as CalculationInput
  // A typed 0 is a real answer; a blank field is omitted upstream so we leave
  // ageYears unset (the engine clamps a missing age to 0 the same as a typed 0).
  if (typeof body.age === "number" && Number.isFinite(body.age)) {
    input.ageYears = Math.max(0, Math.round(body.age))
  }
  if (typeof body.component === "string" && body.component) {
    input.faultComponent = body.component
  }
  if (body.fuel === "gas" || body.fuel === "electric") {
    input.fuelType = body.fuel as FuelType
  }

  // Normalize away spaces, dashes and any other separators, then require a real
  // UPC/EAN/GTIN length before opting into the recall lookup. A typo or a
  // partial code falls through to the "not_checked" branch below instead of
  // wildcard-matching somebody else's recall and flipping the verdict.
  const upcDigits = typeof body.upc === "string" ? body.upc.replace(/\D/g, "") : ""
  const hasUpc = upcDigits.length >= UPC_MIN_DIGITS && upcDigits.length <= UPC_MAX_DIGITS
  if (hasUpc) input.upc = upcDigits

  let result
  try {
    result = await calculateDecision(input, { recallLookup })
  } catch (err) {
    console.error("[v0] calculate failed:", err)
    return NextResponse.json(
      { error: "The pricing engine failed to produce a result." },
      { status: 500 },
    )
  }

  // The engine reports `unavailable` both when no UPC was supplied and when a
  // lookup fails. Distinguish the "never opted in" case for the UI so it can
  // show an invitation instead of a false "recall check unavailable".
  const recall = hasUpc
    ? result.recall
    : { status: "not_checked" as const, matches: [], note: undefined }

  // Strip the internal resolvedInput echo; the client contract omits it.
  const { resolvedInput: _resolvedInput, ...rest } = result
  return NextResponse.json({ ...rest, recall })
}
