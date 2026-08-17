import type {
  CalculationInput,
  CalculationResult,
  FuelType,
  ProvenanceNote,
  RecallResult,
  ResolvedInput,
  Verdict,
} from './types';
import { getApplianceMeta } from '../data/appliances';
import { getComponent, getRepairCostBand } from '../data/partCosts';
import { getReplacementAncillary } from '../data/ancillary';
import { resolveLabor, type ResolvedLabor } from '../data/laborRates';
import { computeRul } from './weibull';
import { computeRepairCost } from './repairCost';
import { computeEnergy } from './energy';
import { computeNpc } from './npc';
import { evaluateSafety } from './safety';
import { evaluateConfidence } from './confidence';
import { buildMonetization } from './monetization';

export interface DecisionOptions {
  /** Macro discount rate (opportunity cost of capital). Defaults to 5%. */
  discountRate?: number;
  /** Async recall lookup, injected by the Worker (KV + CPSC API). */
  recallLookup?: (upc: string) => Promise<RecallResult>;
}

const DEFAULT_DISCOUNT_RATE = 0.05;

const money = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const years = (n: number) => `${n.toFixed(1)} year${Math.abs(n - 1) < 0.05 ? '' : 's'}`;

function resolveInputs(input: CalculationInput, labor: ResolvedLabor): ResolvedInput {
  const meta = getApplianceMeta(input.category);
  const brandTier = input.brandTier ?? 'mid';
  const fuelType: FuelType = meta.fuelDependent
    ? input.fuelType ?? meta.defaultFuel
    : meta.defaultFuel;
  const componentKnown = !!getComponent(input.faultComponent);

  return {
    category: input.category,
    brandTier,
    ageYears: Math.max(0, input.ageYears ?? 0),
    faultComponent: componentKnown ? input.faultComponent! : null,
    repairQuote: Math.max(0, input.repairQuote ?? 0),
    fuelType,
    underWarranty: input.underWarranty ?? false,
    newUnitPrice: input.newUnitPrice ?? meta.newPrice[brandTier],
    energyStarReplacement: input.energyStarReplacement ?? true,
    metro: labor.metro,
    state: labor.state,
  };
}

export async function calculateDecision(
  input: CalculationInput,
  options: DecisionOptions = {},
): Promise<CalculationResult> {
  const discountRate = options.discountRate ?? DEFAULT_DISCOUNT_RATE;
  const labor = resolveLabor(input.location);
  const resolved = resolveInputs(input, labor);

  // A metro or ZIP implies its state, so energy rates can localize even when
  // the user only picked a city (labor resolution already derived the state).
  const effectiveLocation = {
    zip: input.location?.zip,
    metro: input.location?.metro,
    state: resolved.state ?? input.location?.state,
  };

  const rul = computeRul(resolved.category, resolved.brandTier, resolved.ageYears);
  const repairCost = computeRepairCost(
    resolved.category,
    resolved.brandTier,
    resolved.ageYears,
    resolved.repairQuote,
    labor.multiplier,
  );
  const energy = computeEnergy(
    resolved.category,
    resolved.fuelType,
    effectiveLocation,
    resolved.energyStarReplacement,
  );
  const ancillary = getReplacementAncillary(resolved.category, resolved.fuelType);
  const npc = computeNpc({
    category: resolved.category,
    tier: resolved.brandTier,
    expectedRepairCost: repairCost.expected,
    annualOldEnergy: energy.annualOldCost,
    annualNewEnergy: energy.annualNewCost,
    newUnitPrice: resolved.newUnitPrice,
    ancillary,
    discountRate,
    oldRemainingYears: rul.medianRemainingYears,
  });

  const safety = evaluateSafety(resolved.category, resolved.faultComponent);
  const confidence = evaluateConfidence({
    category: resolved.category,
    faultComponent: resolved.faultComponent,
    ageYears: resolved.ageYears,
    repairQuote: resolved.repairQuote,
    laborMultiplier: labor.multiplier,
    // Confidence must reflect whether the location actually RESOLVED, not
    // merely whether one was typed. Most US ZIPs fall outside the metro
    // crosswalk and silently fall back to national rates; scoring those as
    // "located" awarded a higher confidence than leaving the field blank.
    hasLocation: !!(labor.metro || labor.state),
    locationUnresolved: !!(input.location?.metro || input.location?.zip || input.location?.state) &&
      !(labor.metro || labor.state),
    componentKnown: resolved.faultComponent !== null,
  });

  // Recall lookup (never blocks the economic result).
  let recall: RecallResult = {
    status: 'unavailable',
    matches: [],
    note: 'Provide a UPC to check for open federal recalls.',
  };
  if (input.upc && options.recallLookup) {
    try {
      recall = await options.recallLookup(input.upc);
    } catch {
      recall = {
        status: 'unavailable',
        matches: [],
        note: 'Safety-recall data is temporarily unavailable; the economic verdict below is unaffected.',
      };
    }
  }

  // ---- Verdict resolution ----------------------------------------------------
  const advantage = npc.advantageOfReplacing; // repair - replace; >0 favors replace
  const meaningful = 0.08 * resolved.newUnitPrice;
  const recallActive = recall.status === 'active';

  let verdict: Verdict;
  let gaugePosition: number | null;
  let headline: string;
  let explanation: string;

  if (confidence.suppressed) {
    verdict = 'uncertain';
    gaugePosition = null;
    headline = 'Hold off — get a second opinion.';
    explanation =
      `The quote you entered is well outside the normal range for this repair, so we're withholding a definitive verdict. ` +
      `A trustworthy second quote will tell you whether the first was fair. Once you have a realistic number, run it again.`;
  } else {
    // Base economic gauge, then apply warranty / recall pulls toward "repair".
    let g = 50 + 50 * Math.tanh(advantage / (0.5 * resolved.newUnitPrice));
    if (recallActive || resolved.underWarranty) g = Math.min(g, 15);
    gaugePosition = Math.round(Math.min(100, Math.max(0, g)));

    if (recallActive) {
      verdict = 'repair';
      headline = 'Open recall — pursue the free manufacturer remedy first.';
      explanation =
        `This unit matches an active federal recall, which means the manufacturer is typically liable for a free repair or replacement. ` +
        `Do not pay out of pocket — contact the manufacturer or the recall notice before authorizing any paid work.`;
    } else if (resolved.underWarranty) {
      verdict = 'repair';
      headline = 'Repair it — it should be covered.';
      explanation =
        `Because the unit is still under warranty, the repair is likely covered at little or no cost to you, which almost always beats buying new. ` +
        `Confirm the fault is covered before authorizing any billable work.`;
    } else if (advantage >= 0) {
      verdict = 'replace';
      const be =
        npc.breakEvenMonths === null
          ? 'Replacing pays for itself within the new unit’s expected life.'
          : `Replacing pulls ahead after about ${Math.round(npc.breakEvenMonths / 12 * 10) / 10} years.`;
      headline = Math.abs(advantage) < meaningful ? 'Lean toward replacing (it’s close).' : 'Replace it.';
      explanation =
        `Over a ${years(npc.horizonYears)} horizon, replacing costs ${money(npc.replace)} in today’s dollars versus ${money(
          npc.repair,
        )} to repair and keep running the old unit — a ${money(Math.abs(advantage))} advantage to replacing. ${be}`;
    } else {
      verdict = 'repair';
      headline = Math.abs(advantage) < meaningful ? 'Lean toward repairing (it’s close).' : 'Repair it.';
      explanation =
        `Over a ${years(npc.horizonYears)} horizon, repairing costs ${money(npc.repair)} in today’s dollars versus ${money(
          npc.replace,
        )} to replace — a ${money(Math.abs(advantage))} advantage to repairing. ` +
        `The risk-adjusted repair cost of ${money(repairCost.expected)} already accounts for a ${Math.round(
          repairCost.repeatFailureProbability * 100,
        )}% chance of another failure within two years.`;
    }
  }

  const band = getRepairCostBand(resolved.category, resolved.faultComponent, labor.multiplier);
  const monetization = buildMonetization({
    verdict,
    category: resolved.category,
    tier: resolved.brandTier,
    faultComponent: resolved.faultComponent,
    safety,
    invoiceLow: band.low,
    invoiceHigh: band.high,
  });

  const provenance: ProvenanceNote[] = [
    { label: 'Appliance lifespans (by brand tier)', source: 'NAHB Study of Life Expectancy of Home Components; InterNACHI Estimated Life Expectancy Chart' },
    { label: 'Regional labor rates', source: 'BLS OEWS occupation 49-9031 (Home Appliance Repairers), May 2024' },
    { label: 'Energy rates', source: `EIA residential electricity & natural gas rates${energy.localized ? ` (${resolved.state} state rates)` : ' (national averages)'}` },
    { label: 'Removal & disposal costs', source: 'National appliance-removal cost survey ($109–$244 typical)' },
    { label: 'Safety recalls', source: 'CPSC SaferProducts.gov Recall API' },
    { label: 'Discount rate', source: `${(discountRate * 100).toFixed(1)}% macro opportunity cost of capital` },
  ];

  return {
    verdict,
    verdictHeadline: headline,
    verdictExplanation: explanation,
    gaugePosition,
    rul,
    repairCost,
    energy,
    npc,
    safety,
    confidence,
    recall,
    monetization,
    provenance,
    resolvedInput: resolved,
  };
}
