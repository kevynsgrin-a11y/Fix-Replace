import type { ApplianceCategory, FuelType } from '../core/types.js';
import { getApplianceMeta } from './appliances.js';

/**
 * Ancillary costs of replacement. Ignoring these artificially biases the
 * decision toward replacement, which violates the utility's neutral mandate.
 *
 * Disposal/removal is anchored to the brief: national average $109–$244, with
 * complex extractions (built-ins, HVAC) reaching up to ~$570; the handoff notes
 * an average removal cost near $150.
 */

export interface ReplacementAncillary {
  /** Installation / hookup labor, USD. */
  install: number;
  /** Delivery, USD. */
  delivery: number;
  /** Haul-away and disposal of the old unit, USD. */
  disposal: number;
  /** Salvage / trade-in credit for the old unit, USD (≈0 when it has failed). */
  salvage: number;
}

const DISPOSAL_BASE: Record<'standard' | 'heavy', number> = {
  standard: 130, // within the $109–$244 national band
  heavy: 220,
};

/** Categories whose removal is a "complex extraction" (up to ~$570). */
const HEAVY_EXTRACTION: Partial<Record<ApplianceCategory, number>> = {
  refrigerator_builtin: 400,
  hvac_central: 320,
  water_heater: 260,
};

function installCost(category: ApplianceCategory, fuel: FuelType): number {
  switch (category) {
    case 'refrigerator_freestanding':
      return 100;
    case 'refrigerator_builtin':
      return 800;
    case 'washer_frontload':
    case 'washer_topload':
      return 100;
    case 'dryer':
      return fuel === 'gas' ? 180 : 120;
    case 'dishwasher':
      return 220;
    case 'range_gas':
      return 180;
    case 'range_electric':
      return 130;
    case 'oven':
      return 300;
    case 'water_heater':
      return fuel === 'gas' ? 900 : 800;
    case 'microwave_otr':
      return 160;
    case 'hvac_central':
      return 0; // installed price already includes labor
  }
}

function deliveryCost(category: ApplianceCategory): number {
  switch (category) {
    case 'refrigerator_freestanding':
    case 'refrigerator_builtin':
    case 'water_heater':
    case 'hvac_central':
      return 120;
    case 'microwave_otr':
      return 40;
    default:
      return 90;
  }
}

export function getReplacementAncillary(
  category: ApplianceCategory,
  fuel: FuelType,
): ReplacementAncillary {
  const meta = getApplianceMeta(category);
  const disposal = HEAVY_EXTRACTION[category] ?? DISPOSAL_BASE[meta.disposalClass];
  return {
    install: installCost(category, fuel),
    delivery: deliveryCost(category),
    disposal,
    // A failed appliance being replaced typically has negligible salvage; the
    // homeowner pays to remove it. Kept explicit for transparency.
    salvage: 0,
  };
}
