/**
 * lib/page-data.ts
 * Server-only module — assembles static data for every guide and metro page
 * from the existing engine data files. Never imported by client components.
 */
import type { ApplianceCategory, BrandTier } from "@/src/core/types"
import { APPLIANCES } from "@/src/data/appliances"
import { LIFESPANS, getLifespanBand } from "@/src/data/lifespans"
import {
  COMPONENTS,
  CATEGORY_DEFAULT_REPAIR,
  componentsForCategory,
  type Hazard,
} from "@/src/data/partCosts"
import { METROS, NATIONAL_MEAN_WAGE } from "@/src/data/laborRates"

/* -------------------------------------------------------------------------- */
/* Guides                                                                     */
/* -------------------------------------------------------------------------- */

export const GUIDE_SLUGS = [
  "refrigerators",
  "washing-machines",
  "dishwashers",
  "dryers",
  "ranges",
  "wall-ovens",
  "microwaves",
  "water-heaters",
] as const

export type GuideSlug = (typeof GUIDE_SLUGS)[number]

const GUIDE_META: Record<
  GuideSlug,
  {
    category: ApplianceCategory
    also?: ApplianceCategory[]
    title: string
    /** Lowercase singular noun used mid-sentence. Stored on GuideData.plural. */
    noun: string
    lede: string
    rule: string
  }
> = {
  refrigerators: {
    category: "refrigerator_freestanding",
    also: ["refrigerator_builtin"],
    title: "Refrigerator",
    noun: "refrigerator",
    lede: "A failing refrigerator forces a fast decision — spoiled food raises the stakes. Here is what the common repairs actually cost, how long each brand tier is built to last, and the point where replacement wins.",
    rule: "Repair a refrigerator under 8 years old for anything short of a sealed-system or compressor failure. Past 12 years, or when the quote clears $400 on a freestanding unit, replacement usually wins on net-present cost.",
  },
  "washing-machines": {
    category: "washer_frontload",
    also: ["washer_topload"],
    title: "Washing Machine",
    noun: "washing machine",
    lede: "Washers fail in predictable ways — bearings, pumps, and door seals lead the list. These are the real installed costs, the lifespan you should expect by tier, and when a rebuild stops making sense.",
    rule: "A drum-bearing or transmission job on a washer past 8 years rarely pays off — those repairs run $250–$550 and signal more wear behind them. Pumps, valves, and seals on a newer machine are worth fixing.",
  },
  dishwashers: {
    category: "dishwasher",
    title: "Dishwasher",
    noun: "dishwasher",
    lede: "Most dishwasher failures are drain pumps, control boards, and door latches — not catastrophic. Here is what each costs installed, how tiers differ on lifespan, and the quote level where a new unit is the smarter buy.",
    rule: "Dishwashers are inexpensive to replace, so the repair math turns early: past 8 years or above a ~$350 quote, a new ENERGY STAR unit typically wins. Newer machines with a bad pump or valve are worth repairing.",
  },
  dryers: {
    category: "dryer",
    title: "Dryer",
    noun: "dryer",
    lede: "Dryers are among the most repair-friendly appliances — heating elements, thermal fuses, and thermostats are cheap and long-lived fixes. Here is what they cost and when a drum or motor job tips toward replacement.",
    rule: "Repair almost any dryer under 10 years old — elements, fuses, and thermostats are inexpensive and restore full life. A drum-bearing or motor failure on an older unit is the usual replace trigger.",
  },
  ranges: {
    category: "range_gas",
    also: ["range_electric"],
    title: "Range",
    noun: "range",
    lede: "Ranges last longer than almost anything else in the kitchen, so most repairs are worth it. Here are typical igniter, element, and valve costs — and the safety line that makes gas work a licensed-pro job.",
    rule: "Ranges routinely run 15+ years, so repair is the default well past a decade. The exceptions are a failed gas valve or control board on a budget unit near end of life, where replacement can win.",
  },
  "wall-ovens": {
    category: "oven",
    title: "Wall Oven",
    noun: "wall oven",
    lede: "Wall ovens are built in, so replacement carries cabinetry and fit costs that tilt the math toward repair. Here is what bake elements, boards, and gaskets cost, and when a swap is finally justified.",
    rule: "Because a built-in swap means matching the cutout and often the cabinetry, repair wins more often than for freestanding units. Replace mainly when the control board fails on an oven already past 15 years.",
  },
  microwaves: {
    category: "microwave_otr",
    title: "Microwave",
    noun: "microwave",
    lede: "Over-the-range microwaves are the shortest-lived major appliance, so the repair-versus-replace line comes early. Here is what magnetron and motor repairs cost, and why the internal high-voltage side is pro-only.",
    rule: "With new over-the-range units starting around $250, most repairs above ~$150 do not pay off. Repair only a newer microwave with a cheap, accessible fault — otherwise replace.",
  },
  "water-heaters": {
    category: "water_heater",
    title: "Water Heater",
    noun: "water heater",
    lede: "A water heater's age is the whole story: elements and thermostats are cheap, but a tank leak is terminal. Here is what the fixable parts cost and the age past which replacement is the safe call.",
    rule: "Replace any water heater with a leaking tank — that is not repairable. Elements, thermostats, and thermocouples are worth fixing on a unit under 10 years old; past 12, plan the replacement.",
  },
}

const TIER_LABEL: Record<BrandTier, string> = {
  budget: "Budget / entry",
  mid: "Mid-range",
  premium: "Premium / luxury",
}

const SYMPTOMS: Record<string, string> = {
  compressor: "Not cooling; runs constantly or clicks and stops",
  sealed_system: "Warm box, frost buildup, or hissing near the coils",
  evaporator_fan_motor: "Noisy freezer fan or uneven cooling",
  door_gasket: "Condensation, warm spots, or a door that won't seal",
  water_inlet_valve: "No water dispensed or a slow icemaker",
  control_board: "Dead panel, wrong readings, or cycles that won't start",
  drum_bearing: "Loud grinding or a drum that wobbles",
  transmission: "Won't agitate or spin",
  drain_pump: "Standing water; won't drain",
  thermal_fuse: "No heat; dryer runs cold",
  heating_element: "No heat or weak heat",
  thermostat: "Overheats, or won't reach temperature",
  gas_valve: "No flame, or a gas smell (shut off and call a pro)",
  gas_igniter: "Clicks but won't light",
  gas_burner: "Weak or uneven flame",
  bake_element: "Oven won't heat or heats unevenly",
  magnetron: "Runs but won't heat food",
  microwave_motor: "Turntable won't turn or fan is dead",
  wh_element: "No hot water, or runs cold quickly",
}

const HAZARD_LABEL: Record<Hazard, string> = {
  gas: "Gas — licensed pro",
  high_voltage: "High voltage — pro only",
  refrigerant: "Refrigerant — EPA-certified pro",
  water: "Water line",
}

export interface GuideLifespanRow {
  tier: string
  low: number
  high: number
}

export interface GuideFailure {
  part: string
  symptom: string
  low: number
  high: number
  diy: boolean
  hazards: { label: string; kind: Hazard }[]
}

export interface GuideFaq {
  q: string
  a: string
}

export interface GuideMetroLink {
  slug: string
  name: string
}

export interface GuideData {
  slug: GuideSlug
  category: ApplianceCategory
  title: string
  /** Lowercase singular noun for mid-sentence use. Named `plural` for the consumer. */
  plural: string
  glyphId: GuideSlug
  lede: string
  provenance: string
  lifespanRows: GuideLifespanRow[]
  failures: GuideFailure[]
  rule: string
  faqs: GuideFaq[]
  newPrice: { tier: string; price: number }[]
  metros: GuideMetroLink[]
}

const PROVENANCE =
  "Data reviewed July 19, 2026 · NAHB / InterNACHI lifespan tables · BLS OEWS 49-9031 · EIA residential rates"

const FEATURED_METRO_SLUGS = [
  "new-york",
  "los-angeles",
  "chicago",
  "boston",
  "miami",
  "minneapolis",
] as const

function featuredMetros(): GuideMetroLink[] {
  return FEATURED_METRO_SLUGS.map((slug) => {
    const m = METROS.find((x) => x.slug === slug)!
    return { slug: m.slug, name: m.name }
  })
}

export function getAllGuideSlugs(): GuideSlug[] {
  return [...GUIDE_SLUGS]
}

export function getGuideData(slug: GuideSlug): GuideData {
  const meta = GUIDE_META[slug]
  const cats = [meta.category, ...(meta.also ?? [])]

  const bands = LIFESPANS[meta.category]
  const lifespanRows: GuideLifespanRow[] = (
    ["budget", "mid", "premium"] as BrandTier[]
  ).map((tier) => {
    const band = bands[tier] ?? getLifespanBand(meta.category, tier)
    return { tier: TIER_LABEL[tier], low: band.low, high: band.high }
  })

  const seen = new Set<string>()
  const failures: GuideFailure[] = []
  for (const cat of cats) {
    for (const comp of componentsForCategory(cat)) {
      if (seen.has(comp.id)) continue
      seen.add(comp.id)
      failures.push({
        part: comp.label,
        symptom: SYMPTOMS[comp.id] ?? "Intermittent or complete failure",
        low: comp.costLow,
        high: comp.costHigh,
        diy: comp.diyFriendly,
        hazards: comp.hazards.map((h) => ({ label: HAZARD_LABEL[h], kind: h })),
      })
    }
  }
  failures.sort((a, b) => a.low - b.low)

  const meanRepair = CATEGORY_DEFAULT_REPAIR[meta.category]
  const appliance = APPLIANCES[meta.category]

  const newPrice = (["budget", "mid", "premium"] as BrandTier[]).map((tier) => ({
    tier: TIER_LABEL[tier],
    price: appliance.newPrice[tier],
  }))

  const faqs = buildGuideFaqs(meta.title, meta.noun, meanRepair, lifespanRows)

  return {
    slug,
    category: meta.category,
    title: meta.title,
    plural: meta.noun,
    glyphId: slug,
    lede: meta.lede,
    provenance: PROVENANCE,
    lifespanRows,
    failures,
    rule: meta.rule,
    faqs,
    newPrice,
    metros: featuredMetros(),
  }
}

function buildGuideFaqs(
  title: string,
  noun: string,
  meanRepair: { low: number; high: number },
  lifespanRows: GuideLifespanRow[],
): GuideFaq[] {
  const mid = lifespanRows[1]
  return [
    {
      q: `How long should a ${noun} last?`,
      a: `A mid-range ${noun} typically lasts ${mid.low}–${mid.high} years. Budget models run shorter and premium units longer — see the lifespan table above for the full tier breakdown drawn from NAHB and InterNACHI data.`,
    },
    {
      q: `Is it worth repairing a ${noun}?`,
      a: `It depends on age and the specific part. A typical major ${noun} repair runs about $${meanRepair.low}–$${meanRepair.high} installed. If that is more than half the price of a comparable new unit and the appliance is past two-thirds of its expected life, replacement usually wins.`,
    },
    {
      q: `What ${title.toLowerCase()} repairs can I do myself?`,
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

const METRO_REPAIRS: { repair: string; componentId: string; guideSlug: GuideSlug }[] =
  [
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

export function getAllMetroSlugs(): MetroSlug[] {
  return [...METRO_SLUGS]
}

export function getMetroData(slug: MetroSlug): MetroData {
  const metro = METROS.find((m) => m.slug === slug)!
  const multiplier = rawMultiplier(metro.meanHourlyWage)

  const costRows: MetroCostRow[] = METRO_REPAIRS.map((r) => {
    const comp = COMPONENTS[r.componentId]
    const adjust = (v: number) =>
      v * (1 - comp.laborShare) + v * comp.laborShare * multiplier
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
      a: `Repair prices track local field-labor wages. ${shortName} technicians earn a mean $${metro.meanHourlyWage.toFixed(2)}/hr (BLS OEWS 49-9031), which is ${Math.abs(pct)}% ${aboveBelow} the $${NATIONAL_MEAN_WAGE.toFixed(2)}/hr national mean, so the labor share of every bill scales accordingly.`,
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

/** Hub cards: every featured metro with its wage + multiplier. */
export function getMetroHubData(): {
  slug: MetroSlug
  name: string
  shortName: string
  wage: number
  multiplier: number
}[] {
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
