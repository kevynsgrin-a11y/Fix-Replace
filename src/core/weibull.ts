import type { ApplianceCategory, BrandTier, RulResult } from './types.js';
import { getLifespanBand } from '../data/lifespans.js';

/**
 * Weibull reliability model for Remaining Useful Life (RUL).
 *
 * Rather than emit a single "your dishwasher dies in 2 years" integer, we treat
 * appliance lifespan as a statistical distribution (standard practice in
 * industrial reliability engineering) and report conditional survival bands.
 *
 * Parameter fit: we interpret each tier's [low, high] lifespan band as the
 * interquartile range (25th–75th percentile) of the failure distribution. That
 * single, defensible assumption pins both Weibull parameters:
 *
 *   R(low)  = 0.75  =>  (low / eta)^k  = -ln(0.75)
 *   R(high) = 0.25  =>  (high / eta)^k = -ln(0.25)
 *
 * Dividing the two fixes the shape k; back-substituting fixes the scale eta.
 * A tighter band implies a larger shape (more predictable wear-out); a wider
 * band implies a smaller shape (more variance). By construction the model's
 * median lands almost exactly on the band midpoint.
 */

const Q25 = -Math.log(0.75); // 0.2876820724
const Q75 = -Math.log(0.25); // 1.3862943611
const LN_Q_RATIO = Math.log(Q75 / Q25); // ln(4.8188...) ≈ 1.5726

// Guard rails: keep the shape in a physically sensible wear-out range.
const MIN_SHAPE = 1.4;
const MAX_SHAPE = 8;

export interface WeibullParams {
  /** Shape (beta). >1 => increasing hazard (wear-out). */
  shape: number;
  /** Scale (eta), in years — the characteristic life. */
  scaleYears: number;
}

/** Fit Weibull parameters from a tier-specific lifespan band. */
export function fitWeibull(category: ApplianceCategory, tier: BrandTier): WeibullParams {
  const band = getLifespanBand(category, tier);
  let low = band.low;
  let high = band.high;

  // Degenerate band guard: fabricate a modest ±15% spread around the point.
  if (high <= low) {
    const mid = (low + high) / 2 || 1;
    low = mid * 0.85;
    high = mid * 1.15;
  }

  const rawShape = LN_Q_RATIO / Math.log(high / low);
  const shape = Math.min(MAX_SHAPE, Math.max(MIN_SHAPE, rawShape));
  // eta = low / Q25^(1/shape)   (from (low/eta)^shape = Q25)
  const scaleYears = low / Math.pow(Q25, 1 / shape);

  return { shape, scaleYears };
}

/** Unconditional reliability R(t) = exp(-(t/eta)^k). */
export function reliability(params: WeibullParams, years: number): number {
  if (years <= 0) return 1;
  return Math.exp(-Math.pow(years / params.scaleYears, params.shape));
}

/**
 * Conditional survival: probability the unit lasts an additional `deltaYears`
 * given it has already survived to `ageYears`.
 *   R(a + d | a) = exp( (a/eta)^k - ((a+d)/eta)^k )
 */
export function conditionalSurvival(
  params: WeibullParams,
  ageYears: number,
  deltaYears: number,
): number {
  const a = Math.max(0, ageYears);
  const { shape, scaleYears } = params;
  const term = Math.pow(a / scaleYears, shape) - Math.pow((a + deltaYears) / scaleYears, shape);
  const p = Math.exp(term);
  return Math.min(1, Math.max(0, p));
}

/**
 * Median remaining life given survival to `ageYears`:
 *   solve R(a + m | a) = 0.5
 *   => a + m = eta * ((a/eta)^k + ln 2)^(1/k)
 */
export function medianRemainingYears(params: WeibullParams, ageYears: number): number {
  const a = Math.max(0, ageYears);
  const { shape, scaleYears } = params;
  const inner = Math.pow(a / scaleYears, shape) + Math.LN2;
  const total = scaleYears * Math.pow(inner, 1 / shape);
  return Math.max(0, total - a);
}

/** Full RUL picture for the given appliance and age. */
export function computeRul(
  category: ApplianceCategory,
  tier: BrandTier,
  ageYears: number,
): RulResult {
  const params = fitWeibull(category, tier);
  const s12 = conditionalSurvival(params, ageYears, 1);
  const s24 = conditionalSurvival(params, ageYears, 2);
  const s36 = conditionalSurvival(params, ageYears, 3);
  return {
    shape: params.shape,
    scaleYears: params.scaleYears,
    medianRemainingYears: medianRemainingYears(params, ageYears),
    survival12Months: s12,
    survival24Months: s24,
    survival36Months: s36,
    annualFailureProbability: 1 - s12,
  };
}
