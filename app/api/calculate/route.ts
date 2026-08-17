import { NextResponse } from "next/server"
import { calculateDecision } from "@/src/core/decision"
import type {
  ApplianceCategory,
  BrandTier,
  CalculationInput,
  FuelType,
  LocationInput,
  RecallResult,
} from "@/src/core/types"

export const runtime = "nodejs"

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
 * Demo recall lookup. In production this would hit CPSC SaferProducts.gov via a
 * cache; here it deterministically flags a known test UPC as an active recall
 * so the safety path is exercisable, and reports every other code as clear.
 */
async function recallLookup(upc: string): Promise<RecallResult> {
  const normalized = upc.replace(/\D/g, "")
  if (normalized === "012345678905") {
    return {
      status: "active",
      matches: [
        {
          recallNumber: "24-231",
          recallDate: "2024-05-16",
          company: "Example Appliance Co.",
          productType: "Refrigerator",
          hazard: "Compressor can overheat, posing a fire hazard.",
          url: "https://www.cpsc.gov/Recalls",
        },
      ],
      note: "This unit matches an open federal recall.",
    }
  }
  return {
    status: "clear",
    matches: [],
    note: "No open federal recalls match this UPC.",
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
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

  const hasUpc = typeof body.upc === "string" && body.upc.trim() !== ""
  if (hasUpc) input.upc = (body.upc as string).trim()

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
