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
import { METROS, NATIONAL_MEAN_WAGE, type MetroLabor } from "@/src/data/laborRates"
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
  { slug: "hvac", navLabel: "Central HVAC", category: "hvac_central" },
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
  /**
   * Indefinite article that precedes `noun` in generated FAQ copy. Defaults to
   * "a"; set "an" where the noun opens on a vowel *sound* rather than a vowel
   * letter (e.g. "an HVAC system"), which no letter test gets right.
   */
  article?: "a" | "an"
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
    lede: "Over-the-range microwaves are the shortest-lived major appliance, so the repair-versus-replace line comes early. Here is what the six common failures cost — from the line fuse and door-interlock switch through the turntable motor, high-voltage capacitor, magnetron, and control board — and why every one of them is pro-only once the cabinet is open.",
    repairRule:
      "With new over-the-range units starting around $200 and mid-range models around $350, most repairs above ~$150 do not pay off. Nothing here is a homeowner job either: the cheap parts sit behind the same high-voltage capacitor as the expensive ones, so every quote carries a service call. Repair only a newer microwave with a genuinely cheap fault — otherwise replace.",
  },
  "water-heaters": {
    category: "water_heater",
    label: "Water Heater",
    noun: "water heater",
    lede: "A water heater's age is the whole story: elements and thermostats are cheap, but a tank leak is terminal. Here is what the fixable parts cost and the age past which replacement is the safe call.",
    repairRule:
      "Replace any water heater with a leaking tank — that is not repairable. Elements, thermostats, and thermocouples are worth fixing on a unit under 10 years old; past 12, plan the replacement.",
  },
  hvac: {
    category: "hvac_central",
    label: "Central HVAC",
    noun: "HVAC system",
    article: "an",
    lede: "A new central system runs $4,500–$11,000 for the system installed depending on tier, before delivery and old-unit removal — about $4,940–$11,440 all-in, which is what the calculator quotes. Either way the bar a repair has to clear sits far higher here than on any kitchen appliance. Here is what compressors, capacitors, and refrigerant work actually cost, how long each tier lasts, and the point where a whole-system swap wins.",
    repairRule:
      "Run capacitors ($150–$400) and thermostats ($120–$260) are worth fixing at almost any age — small fractions of a replacement that starts near $4,900 all-in. A compressor at $1,200–$2,800 is the real decision: the top of that band is more than half a new budget system, and it buys none of the efficiency gain a modern unit delivers — roughly 30% less electricity on an ENERGY STAR electric system, but closer to 17% on the gas side, where therms dominate the bill, and about half of either if the replacement is not ENERGY STAR certified. Past 16 years — the midpoint of the 14–18-year mid-tier band in the table above, so a system already at its expected life — replacement usually wins. Refrigerant work ($250–$900) is EPA Section 608 certified-technician-only by law, and on pre-2010 R-22 systems the recharge cost climbs every year — chasing a leak on one rarely pays.",
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
  /**
   * Indefinite article for `noun`, so headings can render "an HVAC system"
   * instead of hardcoding "a". Always populated — defaults to "a".
   */
  article: "a" | "an"
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

  const article = meta.article ?? "a"
  const meanRepair = CATEGORY_DEFAULT_REPAIR[meta.category]
  const faqs = buildGuideFaqs({
    noun: meta.noun,
    article,
    meanRepair,
    lifespanRows,
    failures,
  })

  return {
    slug,
    category: meta.category,
    label: meta.label,
    noun: meta.noun,
    article,
    lede: meta.lede,
    provenance: PROVENANCE,
    sources: SOURCES,
    lifespanRows,
    failures,
    repairRule: meta.repairRule,
    faqs,
  }
}

/**
 * Lowercase a component label for mid-sentence use, leaving acronym-initial
 * labels ("HVAC compressor") alone — only "Xy…" shapes are safe to downcase.
 */
function midSentence(label: string): string {
  return /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label
}

/** "a", "a and b", "a, b, and c" — Oxford comma, matching the prose elsewhere. */
function listPhrase(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

/**
 * Why a guide with zero DIY-friendly rows has zero of them, phrased from the
 * hazards those rows actually carry rather than a generic disclaimer.
 */
const HAZARD_REASON: Record<Hazard, string> = {
  high_voltage:
    "a high-voltage capacitor that can hold a lethal charge long after the unit is unplugged",
  gas: "a live gas connection",
  refrigerant: "a sealed refrigerant circuit only an EPA Section 608 certified technician may open",
  water: "a pressurized water connection",
}

/**
 * The self-repair question used to read `label.toLowerCase()`. That is byte-for-
 * byte the same as `noun` for every guide whose label is plain words, but it
 * mangles an acronym label ("Central HVAC" -> "central hvac"), so it now uses
 * `noun` directly.
 *
 * It also used to name a fixed list of parts ("thermostats, elements, seals, and
 * pumps") that matched no guide exactly and matched microwaves not at all — zero
 * of six microwave rows are DIY-friendly, and only the thermostat is on HVAC. The
 * answer is now generated from the page's own failures list, which is why that
 * list is threaded in here.
 */
function buildGuideFaqs({
  noun,
  article,
  meanRepair,
  lifespanRows,
  failures,
}: {
  noun: string
  article: "a" | "an"
  meanRepair: { low: number; high: number }
  lifespanRows: GuideLifespanRow[]
  failures: GuideFailure[]
}): GuideFaq[] {
  const mid = lifespanRows[1]
  const diy = failures.filter((f) => f.diyFriendly)

  let selfRepairAnswer: string
  if (diy.length > 0) {
    const names = listPhrase(diy.map((f) => midSentence(f.name)))
    const rest = failures.length - diy.length
    selfRepairAnswer =
      `On this page that means the ${names} — marked DIY-friendly in the table above, within reach of a careful owner with basic tools and the power or gas shut off.` +
      (rest > 0
        ? ` The other ${rest === 1 ? "listed repair is" : `${rest} listed repairs are`} professional work: anything tagged gas, refrigerant, or high-voltage should go to a licensed pro.`
        : "")
  } else {
    const hazards = [...new Set(failures.map((f) => f.hazard).filter((h): h is Hazard => !!h))]
    const reason = hazards.length
      ? listPhrase(hazards.map((h) => HAZARD_REASON[h]))
      : "internal assemblies that are not designed to be opened by the owner"
    const cheapest = failures[0]
    selfRepairAnswer =
      `None of them. Every failure in the table above sits behind ${reason}, so no ${noun} repair on this page is homeowner-serviceable` +
      (cheapest
        ? ` — not even the ${midSentence(cheapest.name)}, the cheapest row above, where the part costs a few dollars but reaching it does not`
        : "") +
      `. Budget for a licensed technician on any of this work, and weigh that service call against the price of a new unit.`
  }

  return [
    {
      q: `How long should ${article} ${noun} last?`,
      a: `A mid-range ${noun} typically lasts ${mid.range}. Budget models run shorter and premium units longer — see the lifespan table above for the full tier breakdown drawn from NAHB and InterNACHI data.`,
    },
    {
      q: `Is it worth repairing ${article} ${noun}?`,
      a: `It depends on age and the specific part. A typical major ${noun} repair runs about ${money(meanRepair.low)}–${money(meanRepair.high)} installed. If that is more than half the price of a comparable new unit and the appliance is past two-thirds of its expected life, replacement usually wins.`,
    },
    {
      q: `What ${noun} repairs can I do myself?`,
      a: selfRepairAnswer,
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

/**
 * Every metro that gets a landing page. This must stay a subset of METROS in
 * src/data/laborRates.ts — each slug is looked up there for its BLS mean wage.
 *
 * The first six are the original launch set; their URLs must not move. The rest
 * were already priced in laborRates.ts and are published in the same template.
 */
export const METRO_SLUGS = [
  "new-york",
  "los-angeles",
  "chicago",
  "boston",
  "miami",
  "minneapolis",
  "san-francisco",
  "san-diego",
  "seattle",
  "dallas",
  "houston",
  "atlanta",
  "denver",
  "phoenix",
  "philadelphia",
  "washington-dc",
  "detroit",
  "portland",
  "las-vegas",
  "nashville",
  "charlotte",
  "austin",
] as const

export type MetroSlug = (typeof METRO_SLUGS)[number]

/** O(1) slug -> labor record, so the page builders do not re-scan METROS. */
const METRO_BY_SLUG = new Map<string, MetroLabor>(METROS.map((m) => [m.slug, m]))

export interface MetroCostRow {
  repair: string
  low: number
  high: number
  guideSlug: GuideSlug
  /**
   * Unique per row, unlike `guideSlug` — refrigerators and washing machines each
   * contribute two rows, so keying a rendered list on `guideSlug` produces
   * duplicate React keys. Key on this instead.
   */
  componentId: string
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

/**
 * The repairs priced on every metro page. `componentId` must exist in COMPONENTS
 * (rows whose component is missing are filtered out) and must be unique across
 * the list — it is the render key, because `guideSlug` repeats.
 *
 * Each row is also an inbound link to its guide from all 22 metro pages, so a
 * guide missing from this list gets none. Wall ovens and microwaves are still
 * absent — see the note in the review handoff.
 */
const METRO_REPAIRS: { repair: string; componentId: string; guideSlug: GuideSlug }[] = [
  { repair: "Refrigerator compressor", componentId: "compressor", guideSlug: "refrigerators" },
  { repair: "Refrigerator evaporator fan motor", componentId: "evaporator_fan_motor", guideSlug: "refrigerators" },
  { repair: "Washer drum bearing", componentId: "drum_bearing", guideSlug: "washing-machines" },
  { repair: "Washer drain pump", componentId: "drain_pump", guideSlug: "washing-machines" },
  { repair: "Dryer heating element", componentId: "heating_element", guideSlug: "dryers" },
  { repair: "Dishwasher control board", componentId: "control_board", guideSlug: "dishwashers" },
  { repair: "Range gas valve", componentId: "gas_valve", guideSlug: "ranges" },
  { repair: "Water heater element", componentId: "wh_element", guideSlug: "water-heaters" },
  { repair: "HVAC run capacitor", componentId: "hvac_capacitor", guideSlug: "hvac" },
]

const MIN_MULT = 0.85
const MAX_MULT = 1.5

function rawMultiplier(wage: number): number {
  return Math.min(MAX_MULT, Math.max(MIN_MULT, wage / NATIONAL_MEAN_WAGE))
}

function isMetroSlug(v: string): v is MetroSlug {
  return (METRO_SLUGS as readonly string[]).includes(v)
}

/** Sibling chips rendered per metro page. */
const MAX_SIBLINGS = 5

/**
 * Pick the sibling metros to link from a metro page.
 *
 * Linking all 21 other markets would bury the page in undifferentiated internal
 * links, so we cap at MAX_SIBLINGS and choose the ones a reader is most likely
 * to want: markets in the same state first (Dallas -> Houston, Austin), then the
 * closest markets by mean wage, since a similar labor rate means comparable
 * numbers. Ordering is fully deterministic — same-state flag, then absolute wage
 * distance, then slug — so the same page renders the same chips on every build.
 * The current metro is excluded before sorting and can never appear.
 */
function siblingMetros(slug: MetroSlug): { slug: string; name: string }[] {
  const self = METRO_BY_SLUG.get(slug)
  if (!self) return []

  const pool = METRO_SLUGS.filter((s) => s !== slug)
    .map((s) => METRO_BY_SLUG.get(s))
    .filter((m): m is MetroLabor => m !== undefined)

  pool.sort((a, b) => {
    const aSameState = a.state === self.state ? 0 : 1
    const bSameState = b.state === self.state ? 0 : 1
    if (aSameState !== bSameState) return aSameState - bSameState

    const aDist = Math.abs(a.meanHourlyWage - self.meanHourlyWage)
    const bDist = Math.abs(b.meanHourlyWage - self.meanHourlyWage)
    if (aDist !== bDist) return aDist - bDist

    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0
  })

  return pool.slice(0, MAX_SIBLINGS).map((m) => ({ slug: m.slug, name: m.name }))
}

export function getAllMetroSlugs(): MetroSlug[] {
  return [...METRO_SLUGS]
}

export function getMetroData(slug: string): MetroData | undefined {
  if (!isMetroSlug(slug)) return undefined
  const metro = METRO_BY_SLUG.get(slug)
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
      componentId: r.componentId,
    }
  })

  const siblings = siblingMetros(slug)

  const shortName = metro.name.split(",")[0]
  const pct = Math.round((multiplier - 1) * 100)
  const aboveBelow = multiplier >= 1 ? "above" : "below"

  const faqs: GuideFaq[] = [
    {
      q: `Why are appliance repairs priced differently in ${shortName}?`,
      // Wages print to the cent, matching the hero lede. money() rounds, which
      // had the FAQ claiming "$29/hr" under a hero reading "$28.80/hr".
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

export interface MetroHubEntry {
  slug: MetroSlug
  name: string
  shortName: string
  wage: number
  multiplier: number
}

/** Hub cards: every published metro with its wage + multiplier. */
export function getMetroHubData(): MetroHubEntry[] {
  return METRO_SLUGS.map((slug) => {
    const m = METRO_BY_SLUG.get(slug)!
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
