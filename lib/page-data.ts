/**
 * lib/page-data.ts
 * Server-only module — assembles static data for every guide and metro page
 * from the existing engine data files. Never imported by client components.
 */
import type { ApplianceCategory, BrandTier } from "@/src/core/types"
import { LIFESPANS, getLifespanBand } from "@/src/data/lifespans"
import {
  COMPONENTS,
  CATEGORY_DEFAULT_REPAIR,
  componentsForCategory,
  type Hazard,
} from "@/src/data/partCosts"
import { METROS, NATIONAL_MEAN_WAGE } from "@/src/data/laborRates"
export { NATIONAL_MEAN_WAGE }

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`

/* -------------------------------------------------------------------------- */
/* Guides                                                                     */
/* -------------------------------------------------------------------------- */

/** One entry per guide page. `slug` is the URL segment; `category` keys the engine data. */
export const GUIDE_SLUGS = [
  { slug: "refrigerators", navLabel: "Refrigerators", category: "refrigerator_freestanding" },
  { slug: "washing-machines", navLabel: "Washing machines", category: "washer_frontload" },
  { slug: "dishwashers", navLabel: "Dishwashers", category: "dishwasher" },
  { slug: "dryers", navLabel: "Dryers", category: "dryer" },
  { slug: "ranges", navLabel: "Ranges", category: "range_gas" },
  { slug: "wall-ovens", navLabel: "Wall ovens", category: "oven" },
  { slug: "microwaves", navLabel: "Microwaves", category: "microwave_otr" },
  { slug: "water-heaters", navLabel: "Water heaters", category: "water_heater" },
] as const satisfies readonly {
  slug: string
  navLabel: string
  category: ApplianceCategory
}[]

export type GuideSlug = (typeof GUIDE_SLUGS)[number]["slug"]

interface GuideMeta {
  category: ApplianceCategory
  also?: ApplianceCategory[]
  label: string
  /** Lowercase singular noun for mid-sentence use. */
  noun: string
  lede: string
  repairRule: string
}

const GUIDE_META: Record<GuideSlug, GuideMeta> = {
  refrigerators: {
    category: "refrigerator_freestanding",
    also: ["refrigerator_builtin"],
    label: "Refrigerator",
    noun: "refrigerator",
    lede: "A failing refrigerator forces a fast decision — spoiled food raises the stakes. Here is what the common repairs actually cost, how long each brand tier is built to last, and the point where replacement wins.",
    repairRule:
      "Repair a refrigerator under 8 years old for anything short of a sealed-system or compressor failure. Past 12 years, or when the quote clears $400 on a freestanding unit, replacement usually wins on net-present cost.",
  },
  "washing-machines": {
    category: "washer_frontload",
    also: ["washer_topload"],
    label: "Washing Machine",
    noun: "washing machine",
    lede: "Washers fail in predictable ways — bearings, pumps, and door seals lead the list. These are the real installed costs, the lifespan you should expect by tier, and when a rebuild stops making sense.",
    repairRule:
      "A drum-bearing or transmission job on a washer past 8 years rarely pays off — those repairs run $250–$550 and signal more wear behind them. Pumps, valves, and seals on a newer machine are worth fixing.",
  },
  dishwashers: {
    category: "dishwasher",
    label: "Dishwasher",
    noun: "dishwasher",
    lede: "Most dishwasher failures are drain pumps, control boards, and door latches — not catastrophic. Here is what each costs installed, how tiers differ on lifespan, and the quote level where a new unit is the smarter buy.",
    repairRule:
      "Dishwashers are inexpensive to replace, so the repair math turns early: past 8 years or above a ~$350 quote, a new ENERGY STAR unit typically wins. Newer machines with a bad pump or valve are worth repairing.",
  },
  dryers: {
    category: "dryer",
    label: "Dryer",
    noun: "dryer",
    lede: "Dryers are among the most repair-friendly appliances — heating elements, thermal fuses, and thermostats are cheap and long-lived fixes. Here is what they cost and when a drum or motor job tips toward replacement.",
    repairRule:
      "Repair almost any dryer under 10 years old — elements, fuses, and thermostats are inexpensive and restore full life. A drum-bearing or motor failure on an older unit is the usual replace trigger.",
  },
  ranges: {
    category: "range_gas",
    also: ["range_electric"],
    label: "Range",
    noun: "range",
    lede: "Ranges last longer than almost anything else in the kitchen, so most repairs are worth it. Here are typical igniter, element, and valve costs — and the safety line that makes gas work a licensed-pro job.",
    repairRule:
      "Ranges routinely run 15+ years, so repair is the default well past a decade. The exceptions are a failed gas valve or control board on a budget unit near end of life, where replacement can win.",
  },
  "wall-ovens": {
    category: "oven",
    label: "Wall Oven",
    noun: "wall oven",
    lede: "Wall ovens are built in, so replacement carries cabinetry and fit costs that tilt the math toward repair. Here is what bake elements, boards, and gaskets cost, and when a swap is finally justified.",
    repairRule:
      "Because a built-in swap means matching the cutout and often the cabinetry, repair wins more often than for freestanding units. Replace mainly when the control board fails on an oven already past 15 years.",
  },
  microwaves: {
    category: "microwave_otr",
    label: "Microwave",
    noun: "microwave",
    lede: "Over-the-range microwaves are the shortest-lived major appliance, so the repair-versus-replace line comes early. Here is what magnetron and motor repairs cost, and why the internal high-voltage side is pro-only.",
    repairRule:
      "With new over-the-range units starting around $250, most repairs above ~$150 do not pay off. Repair only a newer microwave with a cheap, accessible fault — otherwise replace.",
  },
  "water-heaters": {
    category: "water_heater",
    label: "Water Heater",
    noun: "water heater",
    lede: "A water heater's age is the whole story: elements and thermostats are cheap, but a tank leak is terminal. Here is what the fixable parts cost and the age past which replacement is the safe call.",
    repairRule:
      "Replace any water heater with a leaking tank — that is not repairable. Elements, thermostats, and thermocouples are worth fixing on a unit under 10 years old; past 12, plan the replacement.",
  },
}

const TIER_LABEL: Record<BrandTier, string> = {
  budget: "Budget / entry",
  mid: "Mid-range",
  premium: "Premium / luxury",
}

export interface GuideLifespanRow {
  tier: string
  range: string
  midpoint: number
}

export interface GuideFailure {
  name: string
  hazard?: Hazard
  costRange: string
  costLow: number
  diyFriendly: boolean
}

export interface GuideFaq {
  q: string
  a: string
}

export interface GuideData {
  slug: GuideSlug
  category: ApplianceCategory
  label: string
  noun: string
  lede: string
  provenance: string
  sources: string
  lifespanRows: GuideLifespanRow[]
  failures: GuideFailure[]
  repairRule: string
  faqs: GuideFaq[]
}

const PROVENANCE = "Data reviewed July 19, 2026"
const SOURCES = "BLS OEWS 49-9031 · NAHB life-expectancy tables · EIA residential rates"

function isGuideSlug(v: string): v is GuideSlug {
  return GUIDE_SLUGS.some((g) => g.slug === v)
}

export function getAllGuideSlugs(): GuideSlug[] {
  return GUIDE_SLUGS.map((g) => g.slug)
}

export function getGuideData(slug: string): GuideData | undefined {
  if (!isGuideSlug(slug)) return undefined
  const meta = GUIDE_META[slug]
  const cats = [meta.category, ...(meta.also ?? [])]

  const bands = LIFESPANS[meta.category]
  const lifespanRows: GuideLifespanRow[] = (
    ["budget", "mid", "premium"] as BrandTier[]
  ).map((tier) => {
    const band = bands?.[tier] ?? getLifespanBand(meta.category, tier)
    return {
      tier: TIER_LABEL[tier],
      range: `${band.low}–${band.high} yrs`,
      midpoint: Math.round((band.low + band.high) / 2),
    }
  })

  const seen = new Set<string>()
  const failures: GuideFailure[] = []
  for (const cat of cats) {
    for (const comp of componentsForCategory(cat)) {
      if (seen.has(comp.id)) continue
      seen.add(comp.id)
      failures.push({
        name: comp.label,
        hazard: comp.hazards[0],
        costRange: `${money(comp.costLow)}–${money(comp.costHigh)}`,
        costLow: comp.costLow,
        diyFriendly: comp.diyFriendly,
      })
    }
  }
  failures.sort((a, b) => a.costLow - b.costLow)

  const meanRepair = CATEGORY_DEFAULT_REPAIR[meta.category]
  const faqs = buildGuideFaqs(meta.label, meta.noun, meanRepair, lifespanRows)

  return {
    slug,
    category: meta.category,
    label: meta.label,
    noun: meta.noun,
    lede: meta.lede,
    provenance: PROVENANCE,
    sources: SOURCES,
    lifespanRows,
    failures,
    repairRule: meta.repairRule,
    faqs,
  }
}

function buildGuideFaqs(
  label: string,
  noun: string,
  meanRepair: { low: number; high: number },
  lifespanRows: GuideLifespanRow[],
): GuideFaq[] {
  const mid = lifespanRows[1]
  return [
    {
      q: `How long should a ${noun} last?`,
      a: `A mid-range ${noun} typically lasts ${mid.range}. Budget models run shorter and premium units longer — see the lifespan table above for the full tier breakdown drawn from NAHB and InterNACHI data.`,
    },
    {
      q: `Is it worth repairing a ${noun}?`,
      a: `It depends on age and the specific part. A typical major ${noun} repair runs about ${money(meanRepair.low)}–${money(meanRepair.high)} installed. If that is more than half the price of a comparable new unit and the appliance is past two-thirds of its expected life, replacement usually wins.`,
    },
    {
      q: `What ${label.toLowerCase()} repairs can I do myself?`,
      a: `The parts marked DIY-friendly above — typically thermostats, elements, seals, and pumps — are within reach for a careful owner with basic tools. Anything tagged gas, refrigerant, or high-voltage should go to a licensed professional.`,
    },
    {
      q: `Does my location change the repair cost?`,
      a: `Yes. Labor is the largest share of most repair bills, and technician wages vary by metro. The same job can differ 25% or more between markets — check your local rate on the labor-cost pages, then run the calculator with your actual quote.`,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/* Metros                                                                     */
/* -------------------------------------------------------------------------- */

export const METRO_SLUGS = [
  "new-york",
  "los-angeles",
  "chicago",
  "boston",
  "miami",
  "minneapolis",
] as const

export type MetroSlug = (typeof METRO_SLUGS)[number]

export interface MetroCostRow {
  repair: string
  low: number
  high: number
  guideSlug: GuideSlug
}

export interface MetroData {
  slug: MetroSlug
  name: string
  rate: number
  multiplier: number
  nationalMean: number
  costRows: MetroCostRow[]
  faqs: GuideFaq[]
  siblings: { slug: string; name: string }[]
}

const METRO_REPAIRS: { repair: string; componentId: string; guideSlug: GuideSlug }[] = [
  { repair: "Refrigerator compressor", componentId: "compressor", guideSlug: "refrigerators" },
  { repair: "Refrigerator evaporator fan motor", componentId: "evaporator_fan_motor", guideSlug: "refrigerators" },
  { repair: "Washer drum bearing", componentId: "drum_bearing", guideSlug: "washing-machines" },
  { repair: "Washer drain pump", componentId: "drain_pump", guideSlug: "washing-machines" },
  { repair: "Dryer heating element", componentId: "heating_element", guideSlug: "dryers" },
  { repair: "Dishwasher control board", componentId: "control_board", guideSlug: "dishwashers" },
  { repair: "Range gas valve", componentId: "gas_valve", guideSlug: "ranges" },
  { repair: "Water heater element", componentId: "wh_element", guideSlug: "water-heaters" },
]

const MIN_MULT = 0.85
const MAX_MULT = 1.5

function rawMultiplier(wage: number): number {
  return Math.min(MAX_MULT, Math.max(MIN_MULT, wage / NATIONAL_MEAN_WAGE))
}

function isMetroSlug(v: string): v is MetroSlug {
  return (METRO_SLUGS as readonly string[]).includes(v)
}

export function getAllMetroSlugs(): MetroSlug[] {
  return [...METRO_SLUGS]
}

export function getMetroData(slug: string): MetroData | undefined {
  if (!isMetroSlug(slug)) return undefined
  const metro = METROS.find((m) => m.slug === slug)
  if (!metro) return undefined
  const multiplier = rawMultiplier(metro.meanHourlyWage)

  const costRows: MetroCostRow[] = METRO_REPAIRS.filter((r) => COMPONENTS[r.componentId]).map((r) => {
    const comp = COMPONENTS[r.componentId]
    const adjust = (v: number) => v * (1 - comp.laborShare) + v * comp.laborShare * multiplier
    return {
      repair: r.repair,
      low: Math.round(adjust(comp.costLow)),
      high: Math.round(adjust(comp.costHigh)),
      guideSlug: r.guideSlug,
    }
  })

  const siblings = METRO_SLUGS.filter((s) => s !== slug).map((s) => {
    const m = METROS.find((x) => x.slug === s)!
    return { slug: m.slug, name: m.name }
  })

  const shortName = metro.name.split(",")[0]
  const pct = Math.round((multiplier - 1) * 100)
  const aboveBelow = multiplier >= 1 ? "above" : "below"

  const faqs: GuideFaq[] = [
    {
      q: `Why are appliance repairs priced differently in ${shortName}?`,
      a: `Repair prices track local field-labor wages. ${shortName} technicians earn a mean ${money(metro.meanHourlyWage)}/hr (BLS OEWS 49-9031), which is ${Math.abs(pct)}% ${aboveBelow} the ${money(NATIONAL_MEAN_WAGE)}/hr national mean, so the labor share of every bill scales accordingly.`,
    },
    {
      q: `How much is a typical repair in ${shortName}?`,
      a: `The table above lists representative installed costs for the most common failures, already adjusted by the ${shortName} labor multiplier of ${multiplier.toFixed(2)}×. For a specific answer, enter your actual quote in the calculator.`,
    },
    {
      q: `Is it cheaper to repair or replace in ${shortName}?`,
      a: `Higher local labor pushes marginal repairs toward replacement, but the deciding factors are still the appliance's age and remaining useful life. The calculator combines the ${shortName} rate with net-present-cost math to give you a verdict.`,
    },
    {
      q: `Do these numbers include the service-call fee?`,
      a: `The ranges shown are installed part costs. Most ${shortName} shops charge a separate diagnostic or trip fee of roughly $75–$130, often credited toward the repair if you proceed. Always confirm before booking.`,
    },
  ]

  return {
    slug,
    name: metro.name,
    rate: metro.meanHourlyWage,
    multiplier,
    nationalMean: NATIONAL_MEAN_WAGE,
    costRows,
    faqs,
    siblings,
  }
}

export interface MetroHubEntry {
  slug: MetroSlug
  name: string
  shortName: string
  wage: number
  multiplier: number
}

/** Hub cards: every featured metro with its wage + multiplier. */
export function getMetroHubData(): MetroHubEntry[] {
  return METRO_SLUGS.map((slug) => {
    const m = METROS.find((x) => x.slug === slug)!
    return {
      slug,
      name: m.name,
      shortName: m.name.split(",")[0],
      wage: m.meanHourlyWage,
      multiplier: rawMultiplier(m.meanHourlyWage),
    }
  })
}

/** Alias used by the metro hub page. */
export const getAllMetros = getMetroHubData
