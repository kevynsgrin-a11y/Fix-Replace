/**
 * Shared domain contract for the RepairOrReplace decision utility.
 *
 * Everything downstream — the pure algorithm modules, the decision
 * orchestrator, the Cloudflare Worker API, and the browser client — speaks in
 * terms of the types declared here. Keeping the contract in one place is what
 * lets the same NPC/Weibull math run identically in unit tests (node) and in
 * production (workerd).
 */

/** Major appliance categories covered by the launch wedge. */
export type ApplianceCategory =
  | 'refrigerator_freestanding'
  | 'refrigerator_builtin'
  | 'washer_frontload'
  | 'washer_topload'
  | 'dryer'
  | 'dishwasher'
  | 'range_gas'
  | 'range_electric'
  | 'oven'
  | 'water_heater'
  | 'microwave_otr'
  | 'hvac_central';

/**
 * Brand/build tier. Collapsing three manufacturing populations into a single
 * category-level lifespan (the NAHB "13 years for a refrigerator" trap) is
 * exactly the misleading precision this utility avoids — lifespans are keyed
 * by (category, tier).
 */
export type BrandTier = 'budget' | 'mid' | 'premium';

/** Fuel source, relevant for ranges, dryers, and water heaters. */
export type FuelType = 'gas' | 'electric';

/** Final recommendation surfaced to the user. */
export type Verdict = 'repair' | 'replace' | 'uncertain';

/** Confidence bucket derived from the numeric confidence score. */
export type ConfidenceLevel = 'high' | 'moderate' | 'low' | 'suppressed';

/** Everything the calculator needs from the user (MVP anonymous flow). */
export interface CalculationInput {
  category: ApplianceCategory;
  brandTier: BrandTier;
  /** Approximate age of the unit in years. */
  ageYears: number;
  /**
   * Identifier of the failed component (see data/partCosts). Drives repair
   * cost estimation, DIY-friendliness, and safety hard-stops. Optional: a
   * vague symptom lowers the confidence score rather than blocking a result.
   */
  faultComponent?: string;
  /** The technician's out-the-door repair quote, in USD. */
  repairQuote: number;
  /** Coarse location used to localize labor + energy rates. */
  location?: LocationInput;
  /** Fuel source for fuel-dependent categories. */
  fuelType?: FuelType;
  /** Whether the unit is still under manufacturer or extended warranty. */
  underWarranty?: boolean;
  /** Optional override for the price of a comparable new unit, in USD. */
  newUnitPrice?: number;
  /**
   * Whether the replacement being considered is an ENERGY STAR unit. Drives
   * the modeled efficiency delta in the energy sub-model.
   */
  energyStarReplacement?: boolean;
  /** Optional UPC for a federal recall lookup. */
  upc?: string;
}

export interface LocationInput {
  zip?: string;
  /** Metro key (see data/laborRates), e.g. "los-angeles". */
  metro?: string;
  /** Two-letter US state code, e.g. "NY". */
  state?: string;
}

/** Weibull-derived remaining-useful-life picture. */
export interface RulResult {
  /** Weibull shape parameter (beta); >1 => wear-out (increasing hazard). */
  shape: number;
  /** Weibull scale parameter (eta), in years. */
  scaleYears: number;
  /** Median remaining life given the unit has already survived to ageYears. */
  medianRemainingYears: number;
  /** Conditional survival probabilities from the current age. */
  survival12Months: number;
  survival24Months: number;
  survival36Months: number;
  /** Instantaneous-ish annual failure probability at the current age. */
  annualFailureProbability: number;
}

/** Expected (risk-adjusted) cost of authorizing the repair. */
export interface RepairCostResult {
  /** The raw quote the user entered. */
  quote: number;
  /** Modeled probability of a distinct, age-driven secondary failure. */
  repeatFailureProbability: number;
  /** Modeled cost of that subsequent repair, if it occurs. */
  subsequentRepairCost: number;
  /** quote + P(repeat) * subsequentRepairCost. */
  expected: number;
}

/** Localized energy sub-model. */
export interface EnergyResult {
  /** Annual energy cost of continuing to run the old unit, in USD. */
  annualOldCost: number;
  /** Annual energy cost of a modern replacement, in USD. */
  annualNewCost: number;
  /** annualOldCost - annualNewCost (>0 means replacement saves money). */
  annualSavings: number;
  /** Electricity rate used, in $/kWh. */
  electricityRate: number;
  /** Natural gas rate used, in $/therm (0 for all-electric units). */
  gasRate: number;
  /** Whether state-specific rates were found, or national fallbacks used. */
  localized: boolean;
}

/** Net Present Cost comparison over the shared analysis horizon. */
export interface NpcResult {
  /** Analysis horizon in years (remaining useful life of the new unit). */
  horizonYears: number;
  discountRate: number;
  /** Total present cost of replacing now. */
  replace: number;
  /** Total present cost of repairing and running the old unit. */
  repair: number;
  /** repair - replace. Positive => replacement is cheaper in present terms. */
  advantageOfReplacing: number;
  /** Line-item breakdown for transparency. */
  replaceBreakdown: NpcBreakdown;
  repairBreakdown: NpcBreakdown;
  /**
   * Months until cumulative replacement cost undercuts cumulative repair
   * cost. null when replacement never breaks even within the horizon.
   */
  breakEvenMonths: number | null;
}

export interface NpcBreakdown {
  upfront: number;
  energyPresentValue: number;
  salvageCredit: number;
  riskAdjustment: number;
}

/** Safety evaluation — hard-stops, DIY suppression, hazard messaging. */
export interface SafetyResult {
  /** True when the fault demands professional service (no DIY path offered). */
  professionalRequired: boolean;
  /** True when DIY parts links / tutorials must be suppressed. */
  diySuppressed: boolean;
  /** Machine-readable hazard tags, e.g. "gas", "high_voltage", "refrigerant". */
  hazards: string[];
  /** User-facing hazard messages. */
  messages: string[];
}

/** Confidence + suppression evaluation. */
export interface ConfidenceResult {
  /** 0–100 completeness/plausibility score. */
  score: number;
  level: ConfidenceLevel;
  /** Whether a definitive verdict is suppressed (e.g. predatory quote). */
  suppressed: boolean;
  /** Human-readable notes on what raised or lowered confidence. */
  factors: string[];
  /** Warnings surfaced prominently (e.g. "this quote looks predatory"). */
  warnings: string[];
}

/** Result of a CPSC recall lookup. */
export interface RecallResult {
  status: 'clear' | 'active' | 'unavailable';
  matches: RecallMatch[];
  /** Explains the status, e.g. why data was unavailable. */
  note?: string;
}

export interface RecallMatch {
  recallNumber: string;
  recallDate: string;
  company: string;
  productType: string;
  hazard: string;
  url?: string;
}

/** A single monetization placement. Kept isolated from the verdict block. */
export interface AffiliateLink {
  kind: 'part' | 'new_unit';
  label: string;
  merchant: string;
  /** Relative or absolute outbound URL (may be a placeholder in this build). */
  url: string;
}

export interface LeadGenOption {
  label: string;
  /** Estimated local invoice range for context, in USD. */
  estimatedInvoiceLow: number;
  estimatedInvoiceHigh: number;
}

/**
 * The monetization block. Physically separated from the verdict per the
 * product's neutrality contract: paid ranking must never masquerade as the
 * neutral result, and links are only populated after the verdict is computed.
 */
export interface MonetizationResult {
  affiliateLinks: AffiliateLink[];
  leadGen: LeadGenOption[];
  showDisplayAds: boolean;
  /** FTC-mandated disclosure text for any affiliate/lead placement shown. */
  disclosure: string;
}

/** Provenance line for a user-facing number. */
export interface ProvenanceNote {
  label: string;
  source: string;
}

/** The complete, self-describing result returned by the calculator. */
export interface CalculationResult {
  verdict: Verdict;
  verdictHeadline: string;
  verdictExplanation: string;
  /**
   * 0–100 gauge position. 0 = strongly repair, 100 = strongly replace,
   * 50 = break-even. Null when the verdict is suppressed.
   */
  gaugePosition: number | null;
  rul: RulResult;
  repairCost: RepairCostResult;
  energy: EnergyResult;
  npc: NpcResult;
  safety: SafetyResult;
  confidence: ConfidenceResult;
  recall: RecallResult;
  monetization: MonetizationResult;
  provenance: ProvenanceNote[];
  /** Echo of the resolved inputs (defaults applied) for transparency. */
  resolvedInput: ResolvedInput;
}

/** Input after defaults + data lookups have been applied. */
export interface ResolvedInput {
  category: ApplianceCategory;
  brandTier: BrandTier;
  ageYears: number;
  faultComponent: string | null;
  repairQuote: number;
  fuelType: FuelType;
  underWarranty: boolean;
  newUnitPrice: number;
  energyStarReplacement: boolean;
  metro: string | null;
  state: string | null;
}
