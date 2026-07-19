import type { ApplianceCategory, BrandTier, FuelType } from '../core/types.js';

/**
 * Per-category reference data: human labels, whether the category's running
 * cost depends on fuel choice, sensible default new-unit prices by tier, and
 * the energy profiles that drive the replace-vs-repair efficiency delta.
 *
 * New-unit prices are typical US retail (2025–2026) mid-points; users may
 * override them. Energy consumption figures are annual and describe a typical
 * *aging* unit versus a modern ENERGY STAR equivalent. Sources: ENERGY STAR
 * "Flip Your Fridge" guidance and EIA appliance consumption estimates.
 */

export interface EnergyProfile {
  /** Annual electricity use of an aging unit, kWh. */
  electricOldKwh: number;
  /** Annual electricity use of a modern ENERGY STAR unit, kWh. */
  electricNewKwh: number;
  /** Annual natural gas use of an aging unit, therms (0 if never gas). */
  gasOldTherms: number;
  /** Annual natural gas use of a modern unit, therms. */
  gasNewTherms: number;
}

export interface ApplianceMeta {
  label: string;
  /** Whether running cost / hazards depend on the fuel selection. */
  fuelDependent: boolean;
  defaultFuel: FuelType;
  /** Default price of a comparable new unit by tier, USD. */
  newPrice: Record<BrandTier, number>;
  /** Baseline energy profile (electric-only view). */
  energyElectric: EnergyProfile;
  /**
   * Gas variant profile for fuel-dependent categories. When a user selects a
   * gas unit, gas therms dominate and electricity is auxiliary (controls).
   */
  energyGas?: EnergyProfile;
  /** Removal/disposal weight class, feeds ancillary disposal cost. */
  disposalClass: 'standard' | 'heavy';
}

export const APPLIANCES: Record<ApplianceCategory, ApplianceMeta> = {
  refrigerator_freestanding: {
    label: 'Refrigerator (freestanding)',
    fuelDependent: false,
    defaultFuel: 'electric',
    newPrice: { budget: 700, mid: 1400, premium: 3200 },
    energyElectric: { electricOldKwh: 800, electricNewKwh: 400, gasOldTherms: 0, gasNewTherms: 0 },
    disposalClass: 'heavy',
  },
  refrigerator_builtin: {
    label: 'Refrigerator (built-in)',
    fuelDependent: false,
    defaultFuel: 'electric',
    newPrice: { budget: 4200, mid: 6500, premium: 11000 },
    energyElectric: { electricOldKwh: 900, electricNewKwh: 500, gasOldTherms: 0, gasNewTherms: 0 },
    disposalClass: 'heavy',
  },
  washer_frontload: {
    label: 'Washing machine (front-load)',
    fuelDependent: false,
    defaultFuel: 'electric',
    newPrice: { budget: 700, mid: 1100, premium: 1800 },
    energyElectric: { electricOldKwh: 190, electricNewKwh: 100, gasOldTherms: 0, gasNewTherms: 0 },
    disposalClass: 'standard',
  },
  washer_topload: {
    label: 'Washing machine (top-load)',
    fuelDependent: false,
    defaultFuel: 'electric',
    newPrice: { budget: 550, mid: 900, premium: 1500 },
    energyElectric: { electricOldKwh: 230, electricNewKwh: 140, gasOldTherms: 0, gasNewTherms: 0 },
    disposalClass: 'standard',
  },
  dryer: {
    label: 'Clothes dryer',
    fuelDependent: true,
    defaultFuel: 'electric',
    newPrice: { budget: 550, mid: 900, premium: 1500 },
    energyElectric: { electricOldKwh: 900, electricNewKwh: 600, gasOldTherms: 0, gasNewTherms: 0 },
    energyGas: { electricOldKwh: 80, electricNewKwh: 60, gasOldTherms: 24, gasNewTherms: 20 },
    disposalClass: 'standard',
  },
  dishwasher: {
    label: 'Dishwasher',
    fuelDependent: false,
    defaultFuel: 'electric',
    newPrice: { budget: 450, mid: 800, premium: 1500 },
    energyElectric: { electricOldKwh: 330, electricNewKwh: 240, gasOldTherms: 0, gasNewTherms: 0 },
    disposalClass: 'standard',
  },
  range_gas: {
    label: 'Range (gas)',
    fuelDependent: true,
    defaultFuel: 'gas',
    newPrice: { budget: 650, mid: 1200, premium: 3500 },
    energyElectric: { electricOldKwh: 500, electricNewKwh: 450, gasOldTherms: 0, gasNewTherms: 0 },
    energyGas: { electricOldKwh: 40, electricNewKwh: 35, gasOldTherms: 38, gasNewTherms: 34 },
    disposalClass: 'standard',
  },
  range_electric: {
    label: 'Range (electric)',
    fuelDependent: true,
    defaultFuel: 'electric',
    newPrice: { budget: 600, mid: 1100, premium: 3200 },
    energyElectric: { electricOldKwh: 550, electricNewKwh: 470, gasOldTherms: 0, gasNewTherms: 0 },
    energyGas: { electricOldKwh: 40, electricNewKwh: 35, gasOldTherms: 38, gasNewTherms: 34 },
    disposalClass: 'standard',
  },
  oven: {
    label: 'Wall oven',
    fuelDependent: true,
    defaultFuel: 'electric',
    newPrice: { budget: 900, mid: 1700, premium: 3500 },
    energyElectric: { electricOldKwh: 600, electricNewKwh: 520, gasOldTherms: 0, gasNewTherms: 0 },
    energyGas: { electricOldKwh: 45, electricNewKwh: 40, gasOldTherms: 40, gasNewTherms: 36 },
    disposalClass: 'standard',
  },
  water_heater: {
    label: 'Water heater',
    fuelDependent: true,
    defaultFuel: 'gas',
    newPrice: { budget: 700, mid: 1300, premium: 2200 },
    energyElectric: { electricOldKwh: 4200, electricNewKwh: 3200, gasOldTherms: 0, gasNewTherms: 0 },
    energyGas: { electricOldKwh: 0, electricNewKwh: 0, gasOldTherms: 215, gasNewTherms: 185 },
    disposalClass: 'heavy',
  },
  microwave_otr: {
    label: 'Microwave (over-the-range)',
    fuelDependent: false,
    defaultFuel: 'electric',
    newPrice: { budget: 200, mid: 350, premium: 600 },
    energyElectric: { electricOldKwh: 120, electricNewKwh: 100, gasOldTherms: 0, gasNewTherms: 0 },
    disposalClass: 'standard',
  },
  hvac_central: {
    label: 'Central HVAC',
    fuelDependent: true,
    defaultFuel: 'electric',
    newPrice: { budget: 4500, mid: 7000, premium: 11000 },
    energyElectric: { electricOldKwh: 3500, electricNewKwh: 2450, gasOldTherms: 0, gasNewTherms: 0 },
    energyGas: { electricOldKwh: 1500, electricNewKwh: 1100, gasOldTherms: 420, gasNewTherms: 350 },
    disposalClass: 'heavy',
  },
};

export function getApplianceMeta(category: ApplianceCategory): ApplianceMeta {
  return APPLIANCES[category];
}

/** Resolve the correct energy profile given the category and fuel selection. */
export function resolveEnergyProfile(
  category: ApplianceCategory,
  fuel: FuelType,
): EnergyProfile {
  const meta = APPLIANCES[category];
  if (meta.fuelDependent && fuel === 'gas' && meta.energyGas) {
    return meta.energyGas;
  }
  return meta.energyElectric;
}
