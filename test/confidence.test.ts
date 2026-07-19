import { describe, it, expect } from 'vitest';
import { evaluateConfidence, type ConfidenceInput } from '../src/core/confidence.js';
import { getRepairCostBand } from '../src/data/partCosts.js';
import { resolveLabor } from '../src/data/laborRates.js';

const LA = resolveLabor({ metro: 'los-angeles', state: 'CA' });
// Regionally-adjusted band for a Los Angeles drain-pump repair.
const BAND = getRepairCostBand('dishwasher', 'drain_pump', LA.multiplier);

function input(overrides: Partial<ConfidenceInput> = {}): ConfidenceInput {
  return {
    category: 'dishwasher',
    faultComponent: 'drain_pump',
    ageYears: 3,
    repairQuote: BAND.mid,
    laborMultiplier: LA.multiplier,
    hasLocation: true,
    componentKnown: true,
    ...overrides,
  };
}

describe('evaluateConfidence — suppression & scoring', () => {
  it('a predatory quote (>2x the regional high) is suppressed with a warning', () => {
    // Brief example: ~$900 to replace a ~$190 drain pump in LA.
    const r = evaluateConfidence(input({ repairQuote: 900 }));
    expect(r.suppressed).toBe(true);
    expect(r.level).toBe('suppressed');
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings.some((w) => /predatory|second opinion/i.test(w))).toBe(true);
  });

  it('an in-range quote scores high and is not suppressed', () => {
    const r = evaluateConfidence(input({ repairQuote: BAND.mid }));
    expect(r.suppressed).toBe(false);
    expect(r.score).toBe(100);
    expect(r.level).toBe('high');
  });

  it('missing component, age, and location each lower the score', () => {
    const full = evaluateConfidence(input());
    const noComponent = evaluateConfidence(
      input({ componentKnown: false, faultComponent: null }),
    );
    const noAge = evaluateConfidence(input({ ageYears: 0 }));
    const noLocation = evaluateConfidence(input({ hasLocation: false }));
    expect(noComponent.score).toBeLessThan(full.score);
    expect(noAge.score).toBeLessThan(full.score);
    expect(noLocation.score).toBeLessThan(full.score);
    // The component gap is the biggest single hit (-25).
    expect(noComponent.score).toBeLessThan(noLocation.score);
  });

  it('missing everything produces a low-confidence (but not suppressed) result', () => {
    const r = evaluateConfidence(
      input({ componentKnown: false, faultComponent: null, ageYears: 0, hasLocation: false }),
    );
    expect(r.suppressed).toBe(false);
    expect(r.level).toBe('low');
    expect(r.score).toBeLessThan(60);
  });

  it('an elevated (but not predatory) quote dents confidence without suppressing', () => {
    // Between 1.4x and 2x the regional high.
    const quote = BAND.high * 1.6;
    const r = evaluateConfidence(input({ repairQuote: quote }));
    expect(r.suppressed).toBe(false);
    expect(r.score).toBeLessThan(100);
    expect(r.factors.some((f) => /high side/i.test(f))).toBe(true);
  });

  it('a suspiciously low quote warns but is not necessarily suppressed', () => {
    const quote = BAND.low * 0.2; // below 0.35 * low
    const r = evaluateConfidence(input({ repairQuote: quote }));
    expect(r.suppressed).toBe(false);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings.some((w) => /unusually low/i.test(w))).toBe(true);
  });

  it('the score is always clamped to [0, 100]', () => {
    const inputs: ConfidenceInput[] = [
      input(),
      input({ repairQuote: 900 }),
      input({ componentKnown: false, faultComponent: null, ageYears: 0, hasLocation: false, repairQuote: 5000 }),
      input({ repairQuote: 1 }),
      input({ repairQuote: BAND.high * 1.6 }),
    ];
    for (const i of inputs) {
      const r = evaluateConfidence(i);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });
});
