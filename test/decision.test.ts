import { describe, it, expect } from 'vitest';
import { calculateDecision } from '../src/core/decision.js';
import type { CalculationInput, RecallResult } from '../src/core/types.js';

const activeRecall = (): RecallResult => ({
  status: 'active',
  matches: [
    {
      recallNumber: '24-123',
      recallDate: '2024-02-01',
      company: 'ACME Appliances',
      productType: 'Dishwasher',
      hazard: 'Fire hazard',
      url: 'https://www.cpsc.gov/recall/24-123',
    },
  ],
});

describe('calculateDecision — verdict orchestration', () => {
  it('a clearly old, cheap unit with an expensive repair -> replace', async () => {
    const r = await calculateDecision({
      category: 'dishwasher',
      brandTier: 'budget',
      ageYears: 9,
      faultComponent: 'control_board',
      repairQuote: 380,
      location: { state: 'CA', metro: 'los-angeles' },
    });
    expect(r.verdict).toBe('replace');
    expect(r.gaugePosition).not.toBeNull();
    expect(r.gaugePosition!).toBeGreaterThan(50);
  });

  it('a young premium unit with a cheap DIY repair -> repair', async () => {
    const r = await calculateDecision({
      category: 'refrigerator_freestanding',
      brandTier: 'premium',
      ageYears: 3,
      faultComponent: 'evaporator_fan_motor',
      repairQuote: 200,
      location: { state: 'TX' },
    });
    expect(r.verdict).toBe('repair');
    expect(r.gaugePosition).not.toBeNull();
    expect(r.gaugePosition!).toBeLessThan(50);
  });

  it('an in-warranty unit -> repair verdict with the gauge pulled low', async () => {
    const r = await calculateDecision({
      category: 'dishwasher',
      brandTier: 'mid',
      ageYears: 5,
      faultComponent: 'drain_pump',
      repairQuote: 250,
      underWarranty: true,
      location: { state: 'CA' },
    });
    expect(r.verdict).toBe('repair');
    expect(r.gaugePosition).not.toBeNull();
    expect(r.gaugePosition!).toBeLessThanOrEqual(15); // warranty pull toward repair
    expect(r.verdictHeadline.toLowerCase()).toContain('covered');
  });

  it('a suppressed (predatory-quote) result -> uncertain with a null gauge', async () => {
    const r = await calculateDecision({
      category: 'dishwasher',
      brandTier: 'mid',
      ageYears: 3,
      faultComponent: 'drain_pump',
      repairQuote: 900,
      location: { metro: 'los-angeles', state: 'CA' },
    });
    expect(r.verdict).toBe('uncertain');
    expect(r.confidence.suppressed).toBe(true);
    expect(r.gaugePosition).toBeNull();
  });

  it('an active recall -> repair verdict, recall banner, gauge pulled low', async () => {
    const r = await calculateDecision(
      {
        category: 'dishwasher',
        brandTier: 'mid',
        ageYears: 9, // would otherwise favor replace
        faultComponent: 'control_board',
        repairQuote: 380,
        upc: '012345678905',
        location: { state: 'CA', metro: 'los-angeles' },
      },
      { recallLookup: async () => activeRecall() },
    );
    expect(r.recall.status).toBe('active');
    expect(r.verdict).toBe('repair');
    expect(r.gaugePosition).not.toBeNull();
    expect(r.gaugePosition!).toBeLessThanOrEqual(15);
    // Banner content surfaces the recall.
    expect(r.verdictHeadline.toLowerCase()).toContain('recall');
    expect(r.recall.matches.length).toBeGreaterThan(0);
  });

  it('a recall lookup that throws degrades to unavailable without breaking the verdict', async () => {
    const r = await calculateDecision(
      {
        category: 'dishwasher',
        brandTier: 'mid',
        ageYears: 5,
        faultComponent: 'drain_pump',
        repairQuote: 250,
        upc: '012345678905',
        location: { state: 'CA' },
      },
      {
        recallLookup: async () => {
          throw new Error('CPSC down');
        },
      },
    );
    expect(r.recall.status).toBe('unavailable');
    expect(['repair', 'replace']).toContain(r.verdict); // economic verdict still produced
  });

  it('with no UPC, recall status is unavailable and the verdict is still computed', async () => {
    const r = await calculateDecision({
      category: 'dishwasher',
      brandTier: 'mid',
      ageYears: 5,
      faultComponent: 'drain_pump',
      repairQuote: 250,
    });
    expect(r.recall.status).toBe('unavailable');
    expect(r.gaugePosition).not.toBeNull();
  });

  it('resolvedInput applies defaults: tier -> mid, fuel from category', async () => {
    // brandTier & fuelType omitted; range_gas defaults fuel to gas.
    const raw = { category: 'range_gas', ageYears: 5, repairQuote: 250 } as unknown as CalculationInput;
    const r = await calculateDecision(raw);
    expect(r.resolvedInput.brandTier).toBe('mid');
    expect(r.resolvedInput.fuelType).toBe('gas');
    expect(r.resolvedInput.underWarranty).toBe(false);
    expect(r.resolvedInput.energyStarReplacement).toBe(true);
    // newUnitPrice defaults to the mid-tier catalog price for a gas range.
    expect(r.resolvedInput.newUnitPrice).toBe(1200);
  });

  it('unknown fault component resolves to null and lowers confidence', async () => {
    const r = await calculateDecision({
      category: 'dishwasher',
      brandTier: 'mid',
      ageYears: 5,
      faultComponent: 'not_a_component',
      repairQuote: 250,
      location: { state: 'CA' },
    });
    expect(r.resolvedInput.faultComponent).toBeNull();
    expect(r.confidence.score).toBeLessThan(100);
  });

  it('always returns non-empty provenance notes', async () => {
    const r = await calculateDecision({
      category: 'dishwasher',
      brandTier: 'mid',
      ageYears: 5,
      faultComponent: 'drain_pump',
      repairQuote: 250,
    });
    expect(r.provenance.length).toBeGreaterThan(0);
    for (const note of r.provenance) {
      expect(note.label.length).toBeGreaterThan(0);
      expect(note.source.length).toBeGreaterThan(0);
    }
  });

  it('the gauge is null exactly when suppressed, otherwise within [0, 100]', async () => {
    const normal = await calculateDecision({
      category: 'dishwasher',
      brandTier: 'mid',
      ageYears: 6,
      faultComponent: 'drain_pump',
      repairQuote: 250,
      location: { state: 'CA' },
    });
    expect(normal.gaugePosition).not.toBeNull();
    expect(normal.gaugePosition!).toBeGreaterThanOrEqual(0);
    expect(normal.gaugePosition!).toBeLessThanOrEqual(100);
  });
});
