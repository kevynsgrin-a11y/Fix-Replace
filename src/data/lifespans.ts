import type { ApplianceCategory, BrandTier } from '../core/types.js';

/**
 * Tier-based actuarial lifespans, in years, expressed as a [low, high] band.
 *
 * The refrigerator, washer, gas range, dishwasher, and microwave rows are the
 * exact figures from the strategy brief's lifespan matrix (Section 5), which
 * refines the NAHB Study of Life Expectancy of Home Components and the
 * InterNACHI Estimated Life Expectancy Chart by brand tier. The remaining
 * categories (electric range, wall oven, dryer, water heater, HVAC) are filled
 * from the same NAHB/InterNACHI norms.
 *
 * `null` means the tier does not meaningfully exist for that category (e.g.
 * there is no true "budget" built-in refrigerator); accessors fall back to the
 * mid tier.
 */

export interface LifespanBand {
  low: number;
  high: number;
}

type TierBands = Record<BrandTier, LifespanBand | null>;

export const LIFESPANS: Record<ApplianceCategory, TierBands> = {
  refrigerator_freestanding: {
    budget: { low: 8, high: 11 },
    mid: { low: 11, high: 15 },
    premium: { low: 15, high: 20 },
  },
  refrigerator_builtin: {
    budget: null,
    mid: { low: 12, high: 15 },
    premium: { low: 18, high: 25 },
  },
  washer_frontload: {
    budget: { low: 7, high: 10 },
    mid: { low: 10, high: 13 },
    premium: { low: 15, high: 20 },
  },
  washer_topload: {
    budget: { low: 8, high: 11 },
    mid: { low: 11, high: 14 },
    premium: { low: 15, high: 25 },
  },
  dryer: {
    budget: { low: 8, high: 11 },
    mid: { low: 11, high: 14 },
    premium: { low: 14, high: 18 },
  },
  dishwasher: {
    budget: { low: 6, high: 9 },
    mid: { low: 9, high: 12 },
    premium: { low: 15, high: 20 },
  },
  range_gas: {
    budget: { low: 10, high: 14 },
    mid: { low: 13, high: 17 },
    premium: { low: 20, high: 25 },
  },
  range_electric: {
    budget: { low: 9, high: 13 },
    mid: { low: 12, high: 16 },
    premium: { low: 18, high: 22 },
  },
  oven: {
    budget: { low: 10, high: 14 },
    mid: { low: 13, high: 17 },
    premium: { low: 18, high: 23 },
  },
  water_heater: {
    budget: { low: 6, high: 9 },
    mid: { low: 9, high: 12 },
    premium: { low: 12, high: 18 },
  },
  microwave_otr: {
    budget: { low: 5, high: 8 },
    mid: { low: 8, high: 10 },
    premium: { low: 10, high: 14 },
  },
  hvac_central: {
    budget: { low: 10, high: 14 },
    mid: { low: 14, high: 18 },
    premium: { low: 18, high: 25 },
  },
};

/** The [low, high] lifespan band, falling back to the mid tier when null. */
export function getLifespanBand(
  category: ApplianceCategory,
  tier: BrandTier,
): LifespanBand {
  const band = LIFESPANS[category][tier];
  if (band) return band;
  // Fall back to the nearest defined tier (mid, then premium, then budget).
  const bands = LIFESPANS[category];
  return bands.mid ?? bands.premium ?? bands.budget!;
}

/** Midpoint of the lifespan band — the tier-specific expected lifespan. */
export function getExpectedLifespanYears(
  category: ApplianceCategory,
  tier: BrandTier,
): number {
  const band = getLifespanBand(category, tier);
  return (band.low + band.high) / 2;
}
