import { describe, it, expect } from 'vitest';
import { buildMonetization, type MonetizationInput } from '../src/core/monetization.js';
import { evaluateSafety } from '../src/core/safety.js';
import type { SafetyResult } from '../src/core/types.js';

function input(overrides: Partial<MonetizationInput> = {}): MonetizationInput {
  const { safety: safetyOverride, ...rest } = overrides;
  const safety: SafetyResult =
    safetyOverride ?? { professionalRequired: false, diySuppressed: false, hazards: [], messages: [] };
  return {
    verdict: 'repair',
    category: 'dryer',
    tier: 'mid',
    faultComponent: 'thermal_fuse',
    invoiceLow: 100,
    invoiceHigh: 200,
    ...rest,
    safety,
  };
}

describe('buildMonetization', () => {
  it('a repair verdict on a DIY-friendly non-hazard component shows part links', () => {
    const r = buildMonetization(
      input({ verdict: 'repair', safety: evaluateSafety('dryer', 'thermal_fuse') }),
    );
    const parts = r.affiliateLinks.filter((l) => l.kind === 'part');
    expect(parts.length).toBeGreaterThan(0);
    expect(parts.every((l) => l.url.length > 0)).toBe(true);
    // No new-unit links on a repair verdict.
    expect(r.affiliateLinks.some((l) => l.kind === 'new_unit')).toBe(false);
  });

  it('a replace verdict shows new-unit links, not part links', () => {
    const r = buildMonetization(input({ verdict: 'replace' }));
    const newUnits = r.affiliateLinks.filter((l) => l.kind === 'new_unit');
    expect(newUnits.length).toBeGreaterThan(0);
    expect(r.affiliateLinks.some((l) => l.kind === 'part')).toBe(false);
  });

  it('a gas/hazard repair shows zero part links and offers lead-gen', () => {
    const r = buildMonetization(
      input({
        verdict: 'repair',
        category: 'range_gas',
        faultComponent: 'gas_valve',
        safety: evaluateSafety('range_gas', 'gas_valve'),
        invoiceLow: 200,
        invoiceHigh: 350,
      }),
    );
    expect(r.affiliateLinks.filter((l) => l.kind === 'part').length).toBe(0);
    expect(r.leadGen.length).toBeGreaterThan(0);
    expect(r.leadGen[0].estimatedInvoiceLow).toBe(200);
    expect(r.leadGen[0].estimatedInvoiceHigh).toBe(350);
  });

  it('a repair on a non-DIY (but non-hazard) component suppresses parts and offers lead-gen', () => {
    const r = buildMonetization(
      input({
        verdict: 'repair',
        category: 'washer_topload',
        faultComponent: 'transmission',
        safety: evaluateSafety('washer_topload', 'transmission'),
        invoiceLow: 350,
        invoiceHigh: 550,
      }),
    );
    expect(r.affiliateLinks.filter((l) => l.kind === 'part').length).toBe(0);
    expect(r.leadGen.length).toBeGreaterThan(0);
  });

  it('an uncertain verdict offers a second-opinion lead-gen option', () => {
    const r = buildMonetization(input({ verdict: 'uncertain' }));
    expect(r.leadGen.length).toBeGreaterThan(0);
    expect(r.leadGen[0].label).toMatch(/second/i);
    // No affiliate links when the verdict is withheld.
    expect(r.affiliateLinks.length).toBe(0);
  });

  it('the FTC disclosure is always present and non-empty', () => {
    for (const verdict of ['repair', 'replace', 'uncertain'] as const) {
      const r = buildMonetization(input({ verdict }));
      expect(r.disclosure.length).toBeGreaterThan(0);
      expect(r.disclosure.toLowerCase()).toContain('disclosure');
    }
  });

  it('never runs display ads on the results screen', () => {
    for (const verdict of ['repair', 'replace', 'uncertain'] as const) {
      expect(buildMonetization(input({ verdict })).showDisplayAds).toBe(false);
    }
  });
});
