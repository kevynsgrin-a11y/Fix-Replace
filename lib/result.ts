/**
 * Client-facing contract for POST /api/calculate.
 *
 * This mirrors the server engine's CalculationResult (src/core/types) but lives
 * in the client bundle so result components stay fully typed without importing
 * server-only modules. The route maps the engine output onto this shape.
 */

export type Verdict = "repair" | "replace" | "uncertain"
export type ConfidenceLevel = "high" | "moderate" | "low" | "suppressed"

/** Recall status. `not_checked` is a CLIENT-ONLY state meaning the user never
 *  opted in with a UPC — distinct from a genuine lookup failure (`unavailable`). */
export type RecallStatus = "active" | "clear" | "unavailable" | "not_checked"

export interface ConfidenceBlock {
  score: number
  level: ConfidenceLevel
  factors: string[]
  warnings: string[]
}

export interface NpcBreakdown {
  upfront: number
  energyPresentValue: number
  salvageCredit: number
  riskAdjustment: number
}

export interface NpcBlock {
  repair: number
  replace: number
  advantageOfReplacing: number
  breakEvenMonths: number | null
  horizonYears: number
  discountRate: number
  repairBreakdown: NpcBreakdown
  replaceBreakdown: NpcBreakdown
}

export interface RulBlock {
  medianRemainingYears: number
  survival12Months: number
  survival24Months: number
  survival36Months: number
  shape: number
  scaleYears: number
}

export interface RepairCostBlock {
  quote: number
  expected: number
  repeatFailureProbability: number
  subsequentRepairCost: number
}

export interface EnergyBlock {
  annualSavings: number
  annualOldCost: number
  annualNewCost: number
  electricityRate: number
  gasRate: number
  localized: boolean
}

export interface RecallMatch {
  recallNumber: string
  recallDate: string
  company: string
  productType: string
  hazard: string
  url?: string
}

export interface SafetyBlock {
  professionalRequired: boolean
  hazards: string[]
  messages: string[]
  diySuppressed: boolean
}

export interface RecallBlock {
  status: RecallStatus
  matches: RecallMatch[]
  note?: string
}

export interface ProvenanceNote {
  label: string
  source: string
}

export interface AffiliateLink {
  kind: "part" | "new_unit"
  label: string
  merchant: string
  url: string
}

export interface LeadGenOption {
  label: string
  estimatedInvoiceLow: number
  estimatedInvoiceHigh: number
}

export interface MonetizationBlock {
  affiliateLinks: AffiliateLink[]
  leadGen: LeadGenOption[]
  disclosure: string
}

export interface CalculationResult {
  verdict: Verdict
  verdictHeadline: string
  verdictExplanation: string
  gaugePosition: number | null
  confidence: ConfidenceBlock
  npc: NpcBlock
  rul: RulBlock
  repairCost: RepairCostBlock
  energy: EnergyBlock
  safety: SafetyBlock
  recall: RecallBlock
  provenance: ProvenanceNote[]
  monetization: MonetizationBlock
}

/** Alias used across the result components — the response body of POST /api/calculate. */
export type CalculateResponse = CalculationResult

/* -------------------------------------------------------------------------- */
/* Request payload                                                            */
/* -------------------------------------------------------------------------- */

export interface CalculatePayload {
  category: string
  tier: string
  quote: number
  component: string | null
  warranty: boolean
  energyStar: boolean
  location: { metro: string } | { zip: string }
  age?: number
  fuel?: string
  upc?: string
}

/* -------------------------------------------------------------------------- */
/* Error classification                                                       */
/* -------------------------------------------------------------------------- */

export type CalcErrorKind = "network" | "server" | "client"

export class CalcError extends Error {
  kind: CalcErrorKind
  constructor(kind: CalcErrorKind, message: string) {
    super(message)
    this.kind = kind
    this.name = "CalcError"
  }
}

/**
 * POST the payload and classify failures into human categories the result view
 * can speak to: a network failure ("couldn't reach our servers") is distinct
 * from a 5xx ("pricing service is having a moment"). Never surfaces a raw body.
 */
export async function postCalculate(
  payload: CalculatePayload,
): Promise<CalculationResult> {
  // Dev-only simulation hook for exercising error branches in the browser.
  // No effect in production builds.
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    const sim = (window as unknown as { __ROR_SIMULATE__?: string })
      .__ROR_SIMULATE__
    if (sim === "network") throw new CalcError("network", "Simulated offline")
    if (sim === "server") throw new CalcError("server", "Simulated 500")
  }

  let res: Response
  try {
    res = await fetch("/api/calculate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new CalcError(
      "network",
      "We couldn't reach our servers. Check your connection and try again.",
    )
  }

  if (res.status >= 500) {
    throw new CalcError(
      "server",
      "Our pricing service is having a moment. Give it a few seconds and try again.",
    )
  }
  if (!res.ok) {
    throw new CalcError(
      "client",
      "Something about those inputs didn't add up. Adjust them and try again.",
    )
  }

  try {
    return (await res.json()) as CalculationResult
  } catch {
    throw new CalcError(
      "server",
      "Our pricing service returned something we couldn't read. Please try again.",
    )
  }
}

export type ShareState = "idle" | "saving" | "saved" | "disabled" | "error"

/** POST /api/report. Returns 503 when sharing is disabled server-side. */
export async function postReport(
  result: CalculationResult,
): Promise<{ ok: true; url: string } | { ok: false; disabled: boolean }> {
  let res: Response
  try {
    res = await fetch("/api/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ verdict: result.verdict }),
    })
  } catch {
    return { ok: false, disabled: false }
  }
  if (res.status === 503) return { ok: false, disabled: true }
  if (!res.ok) return { ok: false, disabled: false }
  const data = (await res.json()) as { url: string }
  return { ok: true, url: data.url }
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

export const money = (n: number) =>
  `$${Math.round(n).toLocaleString("en-US")}`

/** Alias used by the guide/metro templates. */
export const fmtUSD = money

export const moneyCents = (n: number) =>
  `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export function years(n: number) {
  const r = Math.round(n * 10) / 10
  return `${r} yr${Math.abs(r - 1) < 0.05 ? "" : "s"}`
}

export function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

/** A repair is "past expected life" when almost no median life remains. */
export function isPastLife(rul: RulBlock) {
  return rul.medianRemainingYears < 0.5
}

/** Withheld = we can't stand behind the figures (suppressed / uncertain). */
export function isWithheld(result: CalculationResult) {
  return result.verdict === "uncertain" || result.confidence.level === "suppressed"
}

export function confidenceVariant(
  level: ConfidenceLevel,
): "repair" | "warn" | "danger" | "neutral" {
  switch (level) {
    case "high":
      return "repair"
    case "moderate":
      return "neutral"
    case "low":
      return "warn"
    case "suppressed":
      return "danger"
  }
}

/* -------------------------------------------------------------------------- */
/* Driver sentence — compose from the two largest present-value drivers        */
/* -------------------------------------------------------------------------- */

export interface DriverPhrase {
  /** Text with `{n}` placeholders replaced by bold figures in the component. */
  parts: Array<{ text: string; bold?: boolean }>
}

interface Driver {
  magnitude: number
  render: () => Array<{ text: string; bold?: boolean }>
}

/**
 * Build the one plain sentence explaining the verdict from its two biggest
 * dollar drivers. Returns segmented parts so the component can bold the figures.
 * Callers must not invoke this on the withheld path.
 */
export function composeDriverSentence(
  result: CalculationResult,
): Array<{ text: string; bold?: boolean }> {
  const { npc, energy, repairCost } = result
  const replaceWins = npc.advantageOfReplacing >= 0
  const advantage = Math.abs(npc.advantageOfReplacing)

  const drivers: Driver[] = []

  // Energy driver
  const energyPvDelta = Math.abs(
    npc.repairBreakdown.energyPresentValue -
      npc.replaceBreakdown.energyPresentValue,
  )
  if (Math.abs(energy.annualSavings) >= 1) {
    drivers.push({
      magnitude: energyPvDelta,
      render: () =>
        replaceWins
          ? [
              { text: "a new unit cuts " },
              { text: money(Math.abs(energy.annualSavings)) + "/yr", bold: true },
              { text: " in energy" },
            ]
          : [
              { text: "the efficiency gain is only " },
              { text: money(Math.abs(energy.annualSavings)) + "/yr", bold: true },
            ],
    })
  }

  // Repeat-failure risk driver
  if (repairCost.repeatFailureProbability >= 0.05) {
    drivers.push({
      magnitude: npc.repairBreakdown.riskAdjustment,
      render: () =>
        replaceWins
          ? [
              { text: "another failure is " },
              { text: pct(repairCost.repeatFailureProbability), bold: true },
              { text: " likely within two years" },
            ]
          : [
              { text: "the repeat-failure risk is a manageable " },
              { text: pct(repairCost.repeatFailureProbability), bold: true },
            ],
    })
  }

  // Upfront price driver
  const upfrontDelta = Math.abs(
    npc.replaceBreakdown.upfront - npc.repairBreakdown.upfront,
  )
  drivers.push({
    magnitude: upfrontDelta,
    render: () =>
      replaceWins
        ? [
            { text: "the repair only defers a " },
            { text: money(npc.replaceBreakdown.upfront), bold: true },
            { text: " purchase" },
          ]
        : [
            { text: "a new unit runs " },
            { text: money(npc.replaceBreakdown.upfront), bold: true },
            { text: " up front" },
          ],
  })

  // Salvage driver
  if (Math.abs(npc.replaceBreakdown.salvageCredit) >= 20) {
    drivers.push({
      magnitude: Math.abs(npc.replaceBreakdown.salvageCredit),
      render: () => [
        { text: "removal and disposal add " },
        { text: money(Math.abs(npc.replaceBreakdown.salvageCredit)), bold: true },
      ],
    })
  }

  drivers.sort((a, b) => b.magnitude - a.magnitude)
  const [first, second] = drivers

  const parts: Array<{ text: string; bold?: boolean }> = [
    { text: replaceWins ? "Replacing comes out " : "Repairing comes out " },
    { text: money(advantage) + " cheaper", bold: true },
    { text: ` over ${years(npc.horizonYears)}` },
  ]

  if (first) {
    parts.push({ text: " — mostly because " })
    parts.push(...first.render())
  }
  if (second) {
    parts.push({ text: ", and " })
    parts.push(...second.render())
  }
  parts.push({ text: "." })
  return parts
}
