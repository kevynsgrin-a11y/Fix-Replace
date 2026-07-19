import { describe, it, expect } from 'vitest';
import { evaluateSafety } from '../src/core/safety.js';

describe('evaluateSafety — hazard hard-stops', () => {
  it('gas components trigger professionalRequired, diySuppressed, and a gas hazard', () => {
    const r = evaluateSafety('range_gas', 'gas_valve');
    expect(r.professionalRequired).toBe(true);
    expect(r.diySuppressed).toBe(true);
    expect(r.hazards).toContain('gas');
    expect(r.messages.length).toBeGreaterThan(0);
  });

  it('other gas components (igniter, burner) are also hard-stopped', () => {
    for (const component of ['gas_igniter', 'gas_burner']) {
      const r = evaluateSafety('range_gas', component);
      expect(r.hazards).toContain('gas');
      expect(r.professionalRequired).toBe(true);
      expect(r.diySuppressed).toBe(true);
    }
  });

  it('a microwave is categorically high-voltage regardless of the named component', () => {
    const withComponent = evaluateSafety('microwave_otr', 'magnetron');
    const noComponent = evaluateSafety('microwave_otr', null);
    // Even a component that would otherwise be harmless is high-voltage here.
    const unrelated = evaluateSafety('microwave_otr', 'thermal_fuse');
    for (const r of [withComponent, noComponent, unrelated]) {
      expect(r.hazards).toContain('high_voltage');
      expect(r.professionalRequired).toBe(true);
      expect(r.diySuppressed).toBe(true);
    }
  });

  it('refrigerant components (compressor, sealed_system, hvac) are hard-stopped', () => {
    const cases: Array<[Parameters<typeof evaluateSafety>[0], string]> = [
      ['refrigerator_freestanding', 'compressor'],
      ['refrigerator_freestanding', 'sealed_system'],
      ['hvac_central', 'hvac_compressor'],
      ['hvac_central', 'hvac_refrigerant'],
    ];
    for (const [category, component] of cases) {
      const r = evaluateSafety(category, component);
      expect(r.hazards).toContain('refrigerant');
      expect(r.professionalRequired).toBe(true);
      expect(r.diySuppressed).toBe(true);
    }
  });

  it('DIY-friendly non-hazardous components are NOT suppressed', () => {
    for (const [category, component] of [
      ['dryer', 'thermal_fuse'],
      ['refrigerator_freestanding', 'evaporator_fan_motor'],
    ] as const) {
      const r = evaluateSafety(category, component);
      expect(r.professionalRequired).toBe(false);
      expect(r.diySuppressed).toBe(false);
      expect(r.hazards).toEqual([]);
    }
  });

  it('a non-DIY but non-hazardous component (transmission) still suppresses DIY without a hazard', () => {
    const r = evaluateSafety('washer_topload', 'transmission');
    expect(r.diySuppressed).toBe(true);
    expect(r.professionalRequired).toBe(true);
    // Not homeowner-serviceable, but not a *safety* hazard.
    expect(r.hazards).toEqual([]);
  });

  it('a water-only hazard warns but does not force professional service', () => {
    const r = evaluateSafety('dishwasher', 'drain_pump');
    expect(r.hazards).toContain('water');
    expect(r.professionalRequired).toBe(false);
    expect(r.diySuppressed).toBe(false);
    expect(r.messages.length).toBeGreaterThan(0);
  });

  it('an unknown or missing component yields a clean, non-suppressed result', () => {
    for (const c of [undefined, null, 'not_a_real_component']) {
      const r = evaluateSafety('dishwasher', c);
      expect(r.professionalRequired).toBe(false);
      expect(r.diySuppressed).toBe(false);
      expect(r.hazards).toEqual([]);
      expect(r.messages).toEqual([]);
    }
  });
});
