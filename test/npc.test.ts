import { describe, it, expect } from 'vitest';
import { computeNpc, type NpcInput } from '../src/core/npc.js';
import { getReplacementAncillary } from '../src/data/ancillary.js';
import { getExpectedLifespanYears } from '../src/data/lifespans.js';

const ancillary = getReplacementAncillary('dishwasher', 'electric');

function baseInput(overrides: Partial<NpcInput> = {}): NpcInput {
  return {
    category: 'dishwasher',
    tier: 'mid',
    expectedRepairCost: 400,
    annualOldEnergy: 100,
    annualNewEnergy: 60,
    newUnitPrice: 800,
    ancillary,
    discountRate: 0.05,
    oldRemainingYears: 5,
    ...overrides,
  };
}

describe('computeNpc — replace vs repair ordering', () => {
  it('a near-end-of-life old unit with a costly repair favors replacing', () => {
    // Old unit has ~1 year left => mid-horizon replacement lands almost
    // immediately, so repairing is the pricier present-cost path.
    const npc = computeNpc(baseInput({ oldRemainingYears: 1, expectedRepairCost: 450 }));
    expect(npc.repair).toBeGreaterThan(npc.replace);
    expect(npc.advantageOfReplacing).toBeGreaterThan(0); // repair - replace > 0
  });

  it('a healthy old unit with a cheap repair favors repairing', () => {
    const npc = computeNpc(baseInput({ oldRemainingYears: 8, expectedRepairCost: 250 }));
    expect(npc.repair).toBeLessThan(npc.replace);
    expect(npc.advantageOfReplacing).toBeLessThan(0);
  });

  it('a nearly-dead old unit makes the repair path pricier than a healthier one', () => {
    // Same everything except remaining life: the closer to death, the sooner the
    // mid-horizon replacement outlay hits, so repair present-cost is higher.
    const nearDeath = computeNpc(baseInput({ oldRemainingYears: 1 }));
    const healthier = computeNpc(baseInput({ oldRemainingYears: 8 }));
    expect(nearDeath.repair).toBeGreaterThan(healthier.repair);
  });
});

describe('computeNpc — horizon & break-even', () => {
  it('uses the tier-specific expected lifespan as the horizon', () => {
    const npc = computeNpc(baseInput());
    expect(npc.horizonYears).toBeCloseTo(getExpectedLifespanYears('dishwasher', 'mid'), 6);
  });

  it('break-even is null or falls within the horizon in months', () => {
    const M = Math.round(getExpectedLifespanYears('dishwasher', 'mid') * 12);
    for (const oldRemainingYears of [1, 3, 5, 8, 20]) {
      const npc = computeNpc(baseInput({ oldRemainingYears }));
      if (npc.breakEvenMonths !== null) {
        expect(npc.breakEvenMonths).toBeGreaterThanOrEqual(1);
        expect(npc.breakEvenMonths).toBeLessThanOrEqual(M);
      }
    }
  });

  it('break-even is null when replacing never catches up (cheap repair, efficient old unit)', () => {
    const npc = computeNpc(
      baseInput({ expectedRepairCost: 50, annualOldEnergy: 100, annualNewEnergy: 100, oldRemainingYears: 20 }),
    );
    expect(npc.breakEvenMonths).toBeNull();
    expect(npc.advantageOfReplacing).toBeLessThan(0);
  });
});

describe('computeNpc — breakdown reconstructs the totals', () => {
  it('replace total == upfront + energyPV - salvageCredit + risk', () => {
    const npc = computeNpc(baseInput({ oldRemainingYears: 1 }));
    const b = npc.replaceBreakdown;
    expect(npc.replace).toBeCloseTo(
      b.upfront + b.energyPresentValue - b.salvageCredit + b.riskAdjustment,
      6,
    );
  });

  it('repair total == upfront + energyPV - salvageCredit + risk', () => {
    const npc = computeNpc(baseInput({ oldRemainingYears: 1 }));
    const b = npc.repairBreakdown;
    expect(npc.repair).toBeCloseTo(
      b.upfront + b.energyPresentValue - b.salvageCredit + b.riskAdjustment,
      6,
    );
  });

  it('advantageOfReplacing == repair - replace', () => {
    const npc = computeNpc(baseInput({ oldRemainingYears: 3 }));
    expect(npc.advantageOfReplacing).toBeCloseTo(npc.repair - npc.replace, 6);
  });

  it('the mid-horizon replacement credits a terminal residual on the repair path', () => {
    // With a mid-horizon replacement, the still-young replacement carries a
    // positive terminal residual credit; the replace-now path has none.
    const npc = computeNpc(baseInput({ oldRemainingYears: 4 }));
    expect(npc.repairBreakdown.salvageCredit).toBeGreaterThan(0);
    expect(npc.replaceBreakdown.salvageCredit).toBe(0);
  });
});

describe('computeNpc — discounting', () => {
  it('a higher discount rate lowers the present value of future energy costs', () => {
    const lo = computeNpc(baseInput({ discountRate: 0.05, oldRemainingYears: 8 }));
    const hi = computeNpc(baseInput({ discountRate: 0.15, oldRemainingYears: 8 }));
    expect(hi.replaceBreakdown.energyPresentValue).toBeLessThan(
      lo.replaceBreakdown.energyPresentValue,
    );
    expect(hi.repairBreakdown.energyPresentValue).toBeLessThan(
      lo.repairBreakdown.energyPresentValue,
    );
  });

  it('echoes the discount rate it was given', () => {
    const npc = computeNpc(baseInput({ discountRate: 0.07 }));
    expect(npc.discountRate).toBeCloseTo(0.07, 6);
  });
});
