import { describe, it, expect } from 'vitest';
import {
  fitWeibull,
  reliability,
  conditionalSurvival,
  medianRemainingYears,
  computeRul,
} from '../src/core/weibull.js';
import { getLifespanBand } from '../src/data/lifespans.js';
import { APPLIANCES } from '../src/data/appliances.js';
import type { ApplianceCategory, BrandTier } from '../src/core/types.js';

const CATEGORIES = Object.keys(APPLIANCES) as ApplianceCategory[];
const TIERS: BrandTier[] = ['budget', 'mid', 'premium'];

describe('fitWeibull — parameter fit sanity', () => {
  it('produces a wear-out shape (>1) and a positive scale for every category/tier', () => {
    for (const category of CATEGORIES) {
      for (const tier of TIERS) {
        const { shape, scaleYears } = fitWeibull(category, tier);
        expect(shape).toBeGreaterThan(1); // increasing hazard / wear-out
        expect(scaleYears).toBeGreaterThan(0);
        // Guard rails from the module keep shape physically sensible.
        expect(shape).toBeGreaterThanOrEqual(1.4);
        expect(shape).toBeLessThanOrEqual(8);
      }
    }
  });

  it('median remaining life at age 0 lands on the band midpoint (IQR fit)', () => {
    // By construction the distribution's median ≈ band midpoint.
    for (const category of CATEGORIES) {
      for (const tier of TIERS) {
        const params = fitWeibull(category, tier);
        const band = getLifespanBand(category, tier);
        const midpoint = (band.low + band.high) / 2;
        const median0 = medianRemainingYears(params, 0);
        // Within ~1% relative — tolerant of the parameter fit, not a magic number.
        expect(Math.abs(median0 - midpoint) / midpoint).toBeLessThan(0.02);
      }
    }
  });

  it('a wider band implies a smaller (less predictable) shape than a tight band', () => {
    // washer_topload premium is a wide band (15–25); refrigerator budget is
    // tighter (8–11). Wider variance => smaller shape.
    const wide = fitWeibull('washer_topload', 'premium'); // ratio 1.67
    const tight = fitWeibull('refrigerator_freestanding', 'budget'); // ratio 1.375
    expect(wide.shape).toBeLessThan(tight.shape);
  });

  it('degenerate/null tier bands fall back gracefully (built-in fridge budget)', () => {
    // refrigerator_builtin has no budget tier (null) -> falls back to mid band,
    // so the fit must still be finite and within the guard rails.
    const params = fitWeibull('refrigerator_builtin', 'budget');
    expect(Number.isFinite(params.shape)).toBe(true);
    expect(Number.isFinite(params.scaleYears)).toBe(true);
    expect(params.shape).toBeGreaterThanOrEqual(1.4);
    expect(params.shape).toBeLessThanOrEqual(8);
    // Falls back to the mid band (12–15), so scale is near that characteristic life.
    expect(params.scaleYears).toBeGreaterThan(10);
  });
});

describe('reliability R(t)', () => {
  const params = fitWeibull('dishwasher', 'mid');

  it('is 1 at (or before) age 0 and stays within [0, 1]', () => {
    expect(reliability(params, 0)).toBe(1);
    expect(reliability(params, -5)).toBe(1); // non-positive age guarded to 1
    for (const t of [0, 1, 5, 10, 15, 30, 100]) {
      const r = reliability(params, t);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });

  it('is monotonically decreasing in age', () => {
    let prev = reliability(params, 0);
    for (const t of [1, 3, 6, 9, 12, 18, 25]) {
      const r = reliability(params, t);
      expect(r).toBeLessThanOrEqual(prev);
      prev = r;
    }
  });
});

describe('conditionalSurvival', () => {
  const params = fitWeibull('dishwasher', 'mid');

  it('stays within [0, 1]', () => {
    for (const age of [0, 5, 11, 20, 40]) {
      for (const delta of [1, 2, 3]) {
        const s = conditionalSurvival(params, age, delta);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      }
    }
  });

  it('older units have lower conditional survival (same horizon)', () => {
    // Fixed 1-year horizon, increasing current age => strictly lower survival.
    let prev = conditionalSurvival(params, 0, 1);
    for (const age of [3, 6, 9, 12, 15, 20]) {
      const s = conditionalSurvival(params, age, 1);
      expect(s).toBeLessThan(prev);
      prev = s;
    }
  });

  it('longer horizons yield lower survival (same age)', () => {
    const age = 8;
    const s1 = conditionalSurvival(params, age, 1);
    const s2 = conditionalSurvival(params, age, 2);
    const s3 = conditionalSurvival(params, age, 3);
    expect(s1).toBeGreaterThan(s2);
    expect(s2).toBeGreaterThan(s3);
  });

  it('negative age is clamped to 0 (age 0 vs -3 identical)', () => {
    expect(conditionalSurvival(params, -3, 2)).toBeCloseTo(
      conditionalSurvival(params, 0, 2),
      6,
    );
  });
});

describe('medianRemainingYears', () => {
  const params = fitWeibull('dishwasher', 'mid');

  it('shrinks as the unit ages', () => {
    let prev = medianRemainingYears(params, 0);
    for (const age of [2, 5, 8, 11, 15]) {
      const m = medianRemainingYears(params, age);
      expect(m).toBeLessThan(prev);
      expect(m).toBeGreaterThanOrEqual(0);
      prev = m;
    }
  });

  it('never goes negative even for a very old unit', () => {
    expect(medianRemainingYears(params, 60)).toBeGreaterThanOrEqual(0);
  });
});

describe('computeRul — full RUL picture', () => {
  it('reports survival12 > survival24 > survival36 for a mid-life unit', () => {
    const rul = computeRul('dishwasher', 'mid', 8);
    expect(rul.survival12Months).toBeGreaterThan(rul.survival24Months);
    expect(rul.survival24Months).toBeGreaterThan(rul.survival36Months);
  });

  it('ties annualFailureProbability to 1 - survival12', () => {
    const rul = computeRul('refrigerator_freestanding', 'mid', 10);
    expect(rul.annualFailureProbability).toBeCloseTo(1 - rul.survival12Months, 10);
  });

  it('keeps all survival probabilities within [0, 1]', () => {
    for (const age of [0, 5, 12, 25]) {
      const rul = computeRul('washer_frontload', 'mid', age);
      for (const s of [rul.survival12Months, rul.survival24Months, rul.survival36Months]) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      }
      expect(rul.annualFailureProbability).toBeGreaterThanOrEqual(0);
      expect(rul.annualFailureProbability).toBeLessThanOrEqual(1);
    }
  });

  it('a brand-new unit is very likely to survive; a very old one is not', () => {
    const young = computeRul('dishwasher', 'mid', 0);
    const old = computeRul('dishwasher', 'mid', 40);
    expect(young.survival12Months).toBeGreaterThan(0.99);
    expect(young.medianRemainingYears).toBeGreaterThan(9); // ~band midpoint 10.5
    expect(old.survival12Months).toBeLessThan(0.05);
    expect(old.annualFailureProbability).toBeCloseTo(1, 2);
  });

  it('an older unit has less median remaining life than a younger one', () => {
    const younger = computeRul('dishwasher', 'mid', 3);
    const older = computeRul('dishwasher', 'mid', 11);
    expect(older.medianRemainingYears).toBeLessThan(younger.medianRemainingYears);
  });
});
