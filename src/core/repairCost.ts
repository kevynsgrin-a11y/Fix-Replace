import type { ApplianceCategory, BrandTier, RepairCostResult } from './types';
import { conditionalSurvival, fitWeibull } from './weibull';
import { CATEGORY_DEFAULT_REPAIR } from '../data/partCosts';

/**
 * Expected (risk-adjusted) cost of authorizing the repair.
 *
 *   E[C_repair] = C_quote + P_repeat * C_subsequent
 *
 * The naive "just pay the quote" view ignores that an aging machine is likely
 * to suffer a second, unrelated failure soon after. We tie P_repeat directly to
 * the Weibull curve: it is the modeled probability that the whole machine (whose
 * other components are just as old) throws another significant fault within a
 * near-term window. Because the Weibull hazard rises past the median lifespan,
 * P_repeat rises steeply for old units — exactly the age penalty the brief calls
 * for, sourced from the same actuarial model rather than a second guess.
 */

/** Window over which a "next" failure is considered a repeat failure. */
const REPEAT_WINDOW_YEARS = 2;
/** Cap so a very old unit never implies a certain second failure. */
const MAX_REPEAT_PROBABILITY = 0.85;

export function computeRepairCost(
  category: ApplianceCategory,
  tier: BrandTier,
  ageYears: number,
  quote: number,
  laborMultiplier: number,
): RepairCostResult {
  const params = fitWeibull(category, tier);
  const survival = conditionalSurvival(params, ageYears, REPEAT_WINDOW_YEARS);
  const repeatFailureProbability = Math.min(MAX_REPEAT_PROBABILITY, 1 - survival);

  // The "average subsequent repair" is a typical major repair for the category,
  // regionally adjusted. We assume this next repair is labor-heavy (0.6).
  const fallback = CATEGORY_DEFAULT_REPAIR[category];
  const baseSubsequent = (fallback.low + fallback.high) / 2;
  const subsequentRepairCost = baseSubsequent * (0.4 + 0.6 * laborMultiplier);

  const expected = quote + repeatFailureProbability * subsequentRepairCost;

  return {
    quote,
    repeatFailureProbability,
    subsequentRepairCost,
    expected,
  };
}
