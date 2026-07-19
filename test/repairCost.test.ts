import { describe, it, expect } from 'vitest';
import { computeRepairCost } from '../src/core/repairCost.js';
import { CATEGORY_DEFAULT_REPAIR } from '../src/data/partCosts.js';

describe('computeRepairCost — expected (risk-adjusted) repair cost', () => {
  it('expected cost is always >= the raw quote', () => {
    for (const age of [1, 5, 9, 15, 30]) {
      for (const quote of [100, 300, 600]) {
        const r = computeRepairCost('dishwasher', 'mid', age, quote, 1.0);
        expect(r.expected).toBeGreaterThanOrEqual(quote);
        // expected = quote + P_repeat * subsequent
        expect(r.expected).toBeCloseTo(
          r.quote + r.repeatFailureProbability * r.subsequentRepairCost,
          6,
        );
      }
    }
  });

  it('echoes the quote unchanged', () => {
    const r = computeRepairCost('dishwasher', 'mid', 8, 275, 1.0);
    expect(r.quote).toBe(275);
  });

  it('repeat-failure probability rises with age', () => {
    let prev = -1;
    for (const age of [1, 4, 7, 10, 13]) {
      const r = computeRepairCost('dishwasher', 'mid', age, 300, 1.0);
      expect(r.repeatFailureProbability).toBeGreaterThan(prev);
      prev = r.repeatFailureProbability;
    }
  });

  it('caps repeat-failure probability at 0.85 for a very old unit', () => {
    const veryOld = computeRepairCost('dishwasher', 'mid', 40, 300, 1.0);
    expect(veryOld.repeatFailureProbability).toBeCloseTo(0.85, 10);
    expect(veryOld.repeatFailureProbability).toBeLessThanOrEqual(0.85);
    // Never exceeds the cap regardless of how old.
    const ancient = computeRepairCost('dishwasher', 'mid', 100, 300, 1.0);
    expect(ancient.repeatFailureProbability).toBeLessThanOrEqual(0.85);
  });

  it('probability stays within [0, 0.85]', () => {
    for (const age of [0, 3, 8, 20, 50]) {
      const r = computeRepairCost('washer_topload', 'mid', age, 300, 1.0);
      expect(r.repeatFailureProbability).toBeGreaterThanOrEqual(0);
      expect(r.repeatFailureProbability).toBeLessThanOrEqual(0.85);
    }
  });

  it('a higher labor multiplier raises the subsequent repair cost', () => {
    const low = computeRepairCost('dishwasher', 'mid', 8, 300, 0.85);
    const nat = computeRepairCost('dishwasher', 'mid', 8, 300, 1.0);
    const high = computeRepairCost('dishwasher', 'mid', 8, 300, 1.5);
    expect(low.subsequentRepairCost).toBeLessThan(nat.subsequentRepairCost);
    expect(nat.subsequentRepairCost).toBeLessThan(high.subsequentRepairCost);
  });

  it('subsequent cost follows base * (0.4 + 0.6*multiplier) from the category default', () => {
    // dishwasher default band 150–400 => base midpoint 275.
    const base =
      (CATEGORY_DEFAULT_REPAIR.dishwasher.low + CATEGORY_DEFAULT_REPAIR.dishwasher.high) / 2;
    const r = computeRepairCost('dishwasher', 'mid', 8, 300, 1.0);
    expect(r.subsequentRepairCost).toBeCloseTo(base * (0.4 + 0.6 * 1.0), 6);
    const r15 = computeRepairCost('dishwasher', 'mid', 8, 300, 1.5);
    expect(r15.subsequentRepairCost).toBeCloseTo(base * (0.4 + 0.6 * 1.5), 6);
  });

  it('the age penalty is real: an old unit costs meaningfully more in expectation', () => {
    const young = computeRepairCost('dishwasher', 'mid', 2, 300, 1.0);
    const old = computeRepairCost('dishwasher', 'mid', 11, 300, 1.0);
    expect(old.expected).toBeGreaterThan(young.expected);
  });
});
