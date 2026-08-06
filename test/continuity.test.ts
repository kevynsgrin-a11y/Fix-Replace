import { describe, it, expect } from 'vitest';
import { computeNpc } from '../src/core/npc.js';
import { calculateDecision } from '../src/core/decision.js';
import { APPLIANCES } from '../src/data/appliances.js';
import { getReplacementAncillary } from '../src/data/ancillary.js';
import { getExpectedLifespanYears } from '../src/data/lifespans.js';
import type { ApplianceCategory, BrandTier } from '../src/core/types.js';

/**
 * Continuity guards for the NPC engine.
 *
 * A pre-launch audit found that the mid-horizon replacement capital block was
 * switched on and off by a boolean instead of tapering, so the repair total
 * jumped by up to 89% as the old unit's remaining life crossed the horizon —
 * enough to reverse the verdict on a one-year change in age. The invariant
 * sweep never caught it because finiteness, sign, and break-even reconciliation
 * all held on both sides of the cliff. Continuity is the missing invariant.
 */

const CATEGORIES = Object.keys(APPLIANCES) as ApplianceCategory[];
const TIERS: BrandTier[] = ['budget', 'mid', 'premium'];

function npcAt(category: ApplianceCategory, tier: BrandTier, oldRemainingYears: number) {
  return computeNpc({
    category,
    tier,
    expectedRepairCost: 300,
    annualOldEnergy: 80,
    annualNewEnergy: 50,
    newUnitPrice: APPLIANCES[category].newPrice[tier],
    ancillary: getReplacementAncillary(category, APPLIANCES[category].defaultFuel),
    discountRate: 0.05,
    oldRemainingYears,
  });
}

describe('NPC continuity', () => {
  it('has no step at the horizon cliff for any category/tier', () => {
    for (const category of CATEGORIES) {
      for (const tier of TIERS) {
        const H = getExpectedLifespanYears(category, tier);
        const eps = 0.001;
        const below = npcAt(category, tier, H - eps);
        const above = npcAt(category, tier, H + eps);
        const jumpPct = (Math.abs(above.repair - below.repair) / below.repair) * 100;
        expect(jumpPct, `${category}/${tier} step at horizon`).toBeLessThan(1);
      }
    }
  });

  it('is continuous across the whole remaining-life range', () => {
    for (const category of CATEGORIES) {
      for (const tier of TIERS) {
        const H = getExpectedLifespanYears(category, tier);
        let prev = npcAt(category, tier, 0.01).repair;
        for (let r = 0.05; r <= H * 1.3; r += 0.05) {
          const cur = npcAt(category, tier, r).repair;
          const jumpPct = (Math.abs(cur - prev) / prev) * 100;
          // A 0.05y step should never move the total by more than a few percent.
          expect(jumpPct, `${category}/${tier} step at R=${r.toFixed(2)}`).toBeLessThan(5);
          prev = cur;
        }
      }
    }
  });

  it('repairing a unit with no life left costs at least as much as replacing', () => {
    // With zero remaining life the repair path must buy the same replacement
    // immediately, so it can never come out cheaper than replacing outright.
    for (const category of CATEGORIES) {
      for (const tier of TIERS) {
        const r = npcAt(category, tier, 0.01);
        expect(r.repair, `${category}/${tier}`).toBeGreaterThan(r.replace * 0.99);
      }
    }
  });

  it('does not reverse the verdict on a one-year change in age', async () => {
    // The audit's concrete repro: microwave/budget/$300 flipped repair->replace
    // between age 0 and age 1 purely from the capital-block step.
    for (const category of CATEGORIES) {
      for (const tier of TIERS) {
        const verdicts: string[] = [];
        for (const ageYears of [0, 1]) {
          const d = await calculateDecision({ category, brandTier: tier, ageYears, repairQuote: 300 });
          verdicts.push(d.verdict);
        }
        expect(verdicts[0], `${category}/${tier} flipped between age 0 and 1`).toBe(verdicts[1]);
      }
    }
  });
});

describe('discount rate hardening', () => {
  it('clamps a nonsensical rate instead of emitting Infinity/NaN', () => {
    for (const rate of [-1, -2, -0.5, 99, Number.NaN, Number.POSITIVE_INFINITY]) {
      const r = computeNpc({
        category: 'dishwasher',
        tier: 'mid',
        expectedRepairCost: 300,
        annualOldEnergy: 80,
        annualNewEnergy: 50,
        newUnitPrice: 800,
        ancillary: getReplacementAncillary('dishwasher', 'electric'),
        discountRate: rate,
        oldRemainingYears: 4,
      });
      expect(Number.isFinite(r.repair), `rate ${rate}`).toBe(true);
      expect(Number.isFinite(r.replace), `rate ${rate}`).toBe(true);
      expect(r.repair, `rate ${rate}`).toBeGreaterThan(0);
      expect(r.replace, `rate ${rate}`).toBeGreaterThan(0);
      // The reported rate must be the one actually applied.
      expect(r.discountRate).toBeGreaterThanOrEqual(0);
      expect(r.discountRate).toBeLessThanOrEqual(0.5);
    }
  });
});

describe('lookup hardening', () => {
  it('does not 500 on prototype-chain keys as faultComponent', async () => {
    for (const key of ['constructor', '__proto__', 'toString', 'valueOf', 'hasOwnProperty']) {
      const d = await calculateDecision({
        category: 'dryer',
        brandTier: 'mid',
        ageYears: 8,
        repairQuote: 145,
        faultComponent: key,
      });
      expect(d.resolvedInput.faultComponent, `faultComponent=${key}`).toBeNull();
      expect(Number.isFinite(d.npc.repair)).toBe(true);
    }
  });

  it('does not resolve prototype-chain keys as a location', async () => {
    for (const key of ['constructor', '__proto__', 'toString']) {
      const d = await calculateDecision({
        category: 'dryer',
        brandTier: 'mid',
        ageYears: 8,
        repairQuote: 145,
        location: { state: key, zip: key, metro: key },
      });
      expect(Number.isFinite(d.npc.repair), `location=${key}`).toBe(true);
      expect(Number.isFinite(d.energy.electricityRate)).toBe(true);
    }
  });
});

describe('confidence reflects resolution, not mere input', () => {
  const base = {
    category: 'dishwasher' as const,
    brandTier: 'mid' as const,
    ageYears: 5,
    faultComponent: 'drain_pump',
    repairQuote: 240,
  };

  it('an unmapped ZIP does not score higher than no location at all', async () => {
    const none = await calculateDecision(base);
    const unmapped = await calculateDecision({ ...base, location: { zip: '44114' } });
    expect(unmapped.confidence.score).toBeLessThanOrEqual(none.confidence.score);
    // ...and it must say so rather than silently implying localized data.
    expect(unmapped.confidence.factors.join(' ')).toMatch(/couldn't match|national-average/i);
  });

  it('a resolved metro does score higher than an unmapped ZIP', async () => {
    const unmapped = await calculateDecision({ ...base, location: { zip: '44114' } });
    const resolved = await calculateDecision({ ...base, location: { metro: 'miami', state: 'FL' } });
    expect(resolved.confidence.score).toBeGreaterThan(unmapped.confidence.score);
  });
});
