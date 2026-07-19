import { describe, it, expect } from 'vitest';
import { calculateDecision } from '../src/core/decision.js';

describe('decision engine smoke', () => {
  it('old budget dishwasher with pricey repair -> replace', async () => {
    const r = await calculateDecision({
      category: 'dishwasher',
      brandTier: 'budget',
      ageYears: 9,
      faultComponent: 'control_board',
      repairQuote: 380,
      location: { state: 'CA', metro: 'los-angeles' },
    });
    console.log('DISHWASHER:', r.verdict, r.verdictHeadline, 'gauge', r.gaugePosition,
      'npc replace/repair', Math.round(r.npc.replace), Math.round(r.npc.repair),
      'RUL', r.rul.medianRemainingYears.toFixed(1));
    expect(r.verdict).toBe('replace');
  });

  it('newer premium fridge with cheap DIY repair -> repair', async () => {
    const r = await calculateDecision({
      category: 'refrigerator_freestanding',
      brandTier: 'premium',
      ageYears: 4,
      faultComponent: 'evaporator_fan_motor',
      repairQuote: 220,
      location: { state: 'TX' },
    });
    console.log('FRIDGE:', r.verdict, r.verdictHeadline, 'gauge', r.gaugePosition,
      'npc', Math.round(r.npc.replace), Math.round(r.npc.repair),
      'affiliate', r.monetization.affiliateLinks.map((l) => l.merchant));
    expect(r.verdict).toBe('repair');
  });

  it('predatory quote -> suppressed / uncertain', async () => {
    const r = await calculateDecision({
      category: 'dishwasher',
      brandTier: 'mid',
      ageYears: 3,
      faultComponent: 'drain_pump',
      repairQuote: 900,
      location: { metro: 'los-angeles', state: 'CA' },
    });
    console.log('PREDATORY:', r.verdict, r.confidence.level, r.confidence.warnings);
    expect(r.verdict).toBe('uncertain');
    expect(r.confidence.suppressed).toBe(true);
    expect(r.gaugePosition).toBeNull();
  });

  it('gas range gas valve -> professional required, DIY suppressed', async () => {
    const r = await calculateDecision({
      category: 'range_gas',
      brandTier: 'mid',
      ageYears: 8,
      faultComponent: 'gas_valve',
      repairQuote: 300,
      fuelType: 'gas',
      location: { state: 'IL', metro: 'chicago' },
    });
    console.log('GAS:', r.verdict, 'proReq', r.safety.professionalRequired, 'diySupp', r.safety.diySuppressed,
      'hazards', r.safety.hazards, 'leadGen', r.monetization.leadGen.length,
      'parts', r.monetization.affiliateLinks.filter((l) => l.kind === 'part').length);
    expect(r.safety.professionalRequired).toBe(true);
    expect(r.safety.diySuppressed).toBe(true);
    expect(r.monetization.affiliateLinks.filter((l) => l.kind === 'part').length).toBe(0);
  });

  it('microwave -> high voltage hazard regardless of component', async () => {
    const r = await calculateDecision({
      category: 'microwave_otr',
      brandTier: 'mid',
      ageYears: 6,
      repairQuote: 180,
    });
    console.log('MICROWAVE:', r.verdict, 'hazards', r.safety.hazards, 'proReq', r.safety.professionalRequired);
    expect(r.safety.hazards).toContain('high_voltage');
  });

  it('high energy state shortens break-even (NY vs national)', async () => {
    const base = { category: 'refrigerator_freestanding' as const, brandTier: 'mid' as const, ageYears: 12, faultComponent: 'compressor', repairQuote: 400 };
    const ny = await calculateDecision({ ...base, location: { state: 'NY' } });
    const wa = await calculateDecision({ ...base, location: { state: 'WA' } });
    console.log('ENERGY NY savings/yr', ny.energy.annualSavings.toFixed(0), 'gauge', ny.gaugePosition);
    console.log('ENERGY WA savings/yr', wa.energy.annualSavings.toFixed(0), 'gauge', wa.gaugePosition);
    expect(ny.energy.annualSavings).toBeGreaterThan(wa.energy.annualSavings);
    expect(ny.gaugePosition!).toBeGreaterThanOrEqual(wa.gaugePosition!);
  });
});
