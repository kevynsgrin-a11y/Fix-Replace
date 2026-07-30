import type {
  ApplianceCategory,
  EnergyResult,
  FuelType,
  LocationInput,
} from './types';
import { resolveEnergyProfile } from '../data/appliances';
import { resolveEnergyRates } from '../data/energyRates';

/**
 * Localized energy sub-model. Replacing an aging unit with a modern efficient
 * one yields operating savings that compound over the ownership horizon; in
 * high-utility-cost states (e.g. New York at 26.49 ¢/kWh) those savings can
 * flip the decision toward replacement.
 */

export function computeEnergy(
  category: ApplianceCategory,
  fuel: FuelType,
  location: LocationInput | undefined,
  energyStarReplacement: boolean,
): EnergyResult {
  const profile = resolveEnergyProfile(category, fuel);
  const rates = resolveEnergyRates(location);

  const oldKwh = profile.electricOldKwh;
  const oldTherms = profile.gasOldTherms;

  // A non-ENERGY STAR replacement is still newer than a worn unit, but only
  // captures roughly half of the efficiency gain of a top-tier model.
  const newKwh = energyStarReplacement
    ? profile.electricNewKwh
    : oldKwh - 0.5 * (oldKwh - profile.electricNewKwh);
  const newTherms = energyStarReplacement
    ? profile.gasNewTherms
    : oldTherms - 0.5 * (oldTherms - profile.gasNewTherms);

  const annualOldCost = oldKwh * rates.electricRate + oldTherms * rates.gasRate;
  const annualNewCost = newKwh * rates.electricRate + newTherms * rates.gasRate;

  return {
    annualOldCost,
    annualNewCost,
    annualSavings: annualOldCost - annualNewCost,
    electricityRate: rates.electricRate,
    gasRate: oldTherms > 0 || newTherms > 0 ? rates.gasRate : 0,
    localized: rates.localized,
  };
}
