import { describe, it, expect } from 'vitest';
import { calculateDecision } from '../src/core/decision.js';
import { APPLIANCES } from '../src/data/appliances.js';
import type { ApplianceCategory, BrandTier, CalculationResult } from '../src/core/types.js';

/**
 * Property sweep — the final accuracy backstop.
 *
 * Runs the complete decision engine across every category × tier and a grid of
 * ages, quotes, and locations (~1,000 scenarios), asserting the mathematical
 * invariants that must hold for EVERY output. Unlike the example-based suites,
 * this catches edge-case regressions anywhere in the input space.
 */

const CATEGORIES = Object.keys(APPLIANCES) as ApplianceCategory[];
const TIERS: BrandTier[] = ['budget', 'mid', 'premium'];
const AGES = [0, 2, 5, 8, 12, 18, 30];
const QUOTES = [60, 250, 600];
const LOCATIONS = [undefined, { state: 'NY' }, { metro: 'miami', state: 'FL' }] as const;

/** Recursively assert no NaN/Infinity hides anywhere in the result. */
function assertAllFinite(value: unknown, path: string): void {
  if (typeof value === 'number') {
    expect(Number.isFinite(value), `non-finite number at ${path}`).toBe(true);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => assertAllFinite(v, `${path}[${i}]`));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) assertAllFinite(v, `${path}.${k}`);
  }
}

function checkInvariants(r: CalculationResult, label: string): void {
  assertAllFinite(r, label);

  // Gauge ↔ verdict coupling.
  if (r.gaugePosition === null) {
    expect(r.verdict, label).toBe('uncertain');
  } else {
    expect(r.gaugePosition, label).toBeGreaterThanOrEqual(0);
    expect(r.gaugePosition, label).toBeLessThanOrEqual(100);
  }

  // NPC totals are positive, advantage is their difference, breakdowns reconcile.
  expect(r.npc.repair, label).toBeGreaterThan(0);
  expect(r.npc.replace, label).toBeGreaterThan(0);
  expect(r.npc.horizonYears, label).toBeGreaterThan(0);
  expect(r.npc.advantageOfReplacing, label).toBeCloseTo(r.npc.repair - r.npc.replace, 6);
  const rb = r.npc.repairBreakdown;
  expect(rb.upfront + rb.energyPresentValue - rb.salvageCredit + rb.riskAdjustment, label).toBeCloseTo(
    r.npc.repair,
    6,
  );
  const pb = r.npc.replaceBreakdown;
  expect(pb.upfront + pb.energyPresentValue - pb.salvageCredit + pb.riskAdjustment, label).toBeCloseTo(
    r.npc.replace,
    6,
  );

  // Break-even reconciles with the verdict math: replacing "pulls ahead" at
  // some month if and only if it is cheaper over the full horizon.
  if (r.npc.advantageOfReplacing >= 0) {
    expect(r.npc.breakEvenMonths, label).not.toBeNull();
    expect(r.npc.breakEvenMonths!, label).toBeGreaterThanOrEqual(1);
    expect(r.npc.breakEvenMonths!, label).toBeLessThanOrEqual(Math.round(r.npc.horizonYears * 12));
  } else {
    expect(r.npc.breakEvenMonths, label).toBeNull();
  }

  // Survival curve is a proper decreasing probability.
  for (const s of [r.rul.survival12Months, r.rul.survival24Months, r.rul.survival36Months]) {
    expect(s, label).toBeGreaterThanOrEqual(0);
    expect(s, label).toBeLessThanOrEqual(1);
  }
  expect(r.rul.survival12Months + 1e-12, label).toBeGreaterThanOrEqual(r.rul.survival24Months);
  expect(r.rul.survival24Months + 1e-12, label).toBeGreaterThanOrEqual(r.rul.survival36Months);
  expect(r.rul.medianRemainingYears, label).toBeGreaterThanOrEqual(0);
  expect(r.rul.shape, label).toBeGreaterThan(1); // wear-out regime

  // Risk-adjusted repair cost only ever adds to the quote, within the cap.
  expect(r.repairCost.expected, label).toBeGreaterThanOrEqual(r.repairCost.quote);
  expect(r.repairCost.repeatFailureProbability, label).toBeGreaterThanOrEqual(0);
  expect(r.repairCost.repeatFailureProbability, label).toBeLessThanOrEqual(0.85);

  // Energy model sanity.
  expect(r.energy.annualOldCost, label).toBeGreaterThanOrEqual(0);
  expect(r.energy.annualNewCost, label).toBeGreaterThanOrEqual(0);

  // Verdict consistency with the economics (no warranty/recall/suppression in
  // this sweep, so the sign of the advantage must decide it).
  if (!r.confidence.suppressed) {
    expect(r.verdict, label).toBe(r.npc.advantageOfReplacing >= 0 ? 'replace' : 'repair');
  } else {
    expect(r.verdict, label).toBe('uncertain');
  }

  // Trust contracts: disclosure always present when anything is monetized;
  // DIY part links never survive a safety suppression.
  const partLinks = r.monetization.affiliateLinks.filter((l) => l.kind === 'part');
  if (r.safety.diySuppressed) expect(partLinks, label).toHaveLength(0);
  if (r.monetization.affiliateLinks.length || r.monetization.leadGen.length) {
    expect(r.monetization.disclosure.length, label).toBeGreaterThan(0);
  }
  expect(r.monetization.showDisplayAds, label).toBe(false);
  expect(r.provenance.length, label).toBeGreaterThan(0);
}

describe('decision engine property sweep', () => {
  it('holds every invariant across the full input grid', async () => {
    let n = 0;
    for (const category of CATEGORIES) {
      for (const tier of TIERS) {
        for (const ageYears of AGES) {
          for (const repairQuote of QUOTES) {
            const location = LOCATIONS[n % LOCATIONS.length];
            const r = await calculateDecision({
              category,
              brandTier: tier,
              ageYears,
              repairQuote,
              location: location as { state?: string; metro?: string } | undefined,
            });
            checkInvariants(r, `${category}/${tier}/age${ageYears}/$${repairQuote}`);
            n++;
          }
        }
      }
    }
    expect(n).toBe(CATEGORIES.length * TIERS.length * AGES.length * QUOTES.length);
  });

  it('repeat-failure probability is non-decreasing with age', async () => {
    for (const category of CATEGORIES) {
      let prev = -1;
      for (const age of [0, 3, 6, 9, 12, 16, 22, 30]) {
        const r = await calculateDecision({ category, brandTier: 'mid', ageYears: age, repairQuote: 200 });
        expect(r.repairCost.repeatFailureProbability + 1e-9).toBeGreaterThanOrEqual(prev);
        prev = r.repairCost.repeatFailureProbability;
      }
    }
  });

  it('an older unit never has a lower gauge than a younger one (same inputs)', async () => {
    for (const category of ['dishwasher', 'refrigerator_freestanding', 'dryer'] as ApplianceCategory[]) {
      const young = await calculateDecision({ category, brandTier: 'mid', ageYears: 2, repairQuote: 300 });
      const old = await calculateDecision({ category, brandTier: 'mid', ageYears: 14, repairQuote: 300 });
      expect(old.gaugePosition!).toBeGreaterThanOrEqual(young.gaugePosition!);
    }
  });

  it('warranty always pins the verdict to repair with a low gauge', async () => {
    const r = await calculateDecision({
      category: 'dishwasher',
      brandTier: 'budget',
      ageYears: 12,
      repairQuote: 380,
      underWarranty: true,
    });
    expect(r.verdict).toBe('repair');
    expect(r.gaugePosition!).toBeLessThanOrEqual(15);
  });
});
