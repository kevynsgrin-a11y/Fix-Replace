import { describe, it, expect } from 'vitest';
import { computeEnergy } from '../src/core/energy.js';

describe('computeEnergy — localized energy sub-model', () => {
  it('a high-rate state (NY) yields higher annual costs and savings than a low-rate state (WA)', () => {
    const ny = computeEnergy('refrigerator_freestanding', 'electric', { state: 'NY' }, true);
    const wa = computeEnergy('refrigerator_freestanding', 'electric', { state: 'WA' }, true);
    expect(ny.annualOldCost).toBeGreaterThan(wa.annualOldCost);
    expect(ny.annualNewCost).toBeGreaterThan(wa.annualNewCost);
    expect(ny.annualSavings).toBeGreaterThan(wa.annualSavings);
  });

  it('pins the anchored NY electricity rate (0.2649 $/kWh)', () => {
    const ny = computeEnergy('refrigerator_freestanding', 'electric', { state: 'NY' }, true);
    expect(ny.electricityRate).toBeCloseTo(0.2649, 4);
    // Old fridge 800 kWh, new 400 kWh at the NY rate.
    expect(ny.annualOldCost).toBeCloseTo(800 * 0.2649, 4);
    expect(ny.annualNewCost).toBeCloseTo(400 * 0.2649, 4);
    expect(ny.localized).toBe(true);
  });

  it('savings = old cost - new cost', () => {
    const r = computeEnergy('dishwasher', 'electric', { state: 'CA' }, true);
    expect(r.annualSavings).toBeCloseTo(r.annualOldCost - r.annualNewCost, 6);
  });

  it('an ENERGY STAR replacement saves at least as much as a non-ENERGY-STAR one', () => {
    const es = computeEnergy('refrigerator_freestanding', 'electric', { state: 'NY' }, true);
    const nonEs = computeEnergy('refrigerator_freestanding', 'electric', { state: 'NY' }, false);
    expect(es.annualSavings).toBeGreaterThanOrEqual(nonEs.annualSavings);
    // A non-ENERGY-STAR replacement captures only ~half of the efficiency gain.
    expect(nonEs.annualSavings).toBeCloseTo(es.annualSavings / 2, 4);
    // Both still beat running the old unit.
    expect(nonEs.annualNewCost).toBeLessThan(nonEs.annualOldCost);
  });

  it('gas vs electric fuel selects the right energy profile', () => {
    // range_gas is fuel-dependent: gas fuel burns therms; electric fuel does not.
    const gas = computeEnergy('range_gas', 'gas', { state: 'NY' }, true);
    const electric = computeEnergy('range_gas', 'electric', { state: 'NY' }, true);
    // Gas profile reports a non-zero gas rate; the electric profile reports 0.
    expect(gas.gasRate).toBeGreaterThan(0);
    expect(electric.gasRate).toBe(0);
    // The two profiles produce different operating costs.
    expect(gas.annualOldCost).not.toBeCloseTo(electric.annualOldCost, 1);
  });

  it('reports gasRate 0 for a purely electric category regardless of fuel arg', () => {
    const r = computeEnergy('refrigerator_freestanding', 'electric', { state: 'NY' }, true);
    expect(r.gasRate).toBe(0);
  });

  it('a gas water heater uses the gas rate and therms', () => {
    const wh = computeEnergy('water_heater', 'gas', { state: 'NY' }, true);
    // NY gas rate 1.70 $/therm; old 215 therms, new 185 therms.
    expect(wh.gasRate).toBeCloseTo(1.7, 4);
    expect(wh.annualOldCost).toBeCloseTo(215 * 1.7, 3);
    expect(wh.annualNewCost).toBeCloseTo(185 * 1.7, 3);
  });

  it('localized flag is false and national rates used when no state is provided', () => {
    const r = computeEnergy('refrigerator_freestanding', 'electric', undefined, true);
    expect(r.localized).toBe(false);
    expect(r.electricityRate).toBeCloseTo(0.178, 4); // NATIONAL_ELECTRIC_RATE
  });

  it('localized flag is false for an unknown state', () => {
    const r = computeEnergy('refrigerator_freestanding', 'electric', { state: 'ZZ' }, true);
    expect(r.localized).toBe(false);
    expect(r.electricityRate).toBeCloseTo(0.178, 4);
  });
});
