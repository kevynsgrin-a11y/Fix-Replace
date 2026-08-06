import type { LocationInput } from '../core/types.js';

/**
 * Localized energy rates. High utility costs shorten the break-even period on a
 * new, efficient unit and push the decision toward replacement — a factor
 * generic advice columns ignore.
 *
 * Anchored figures:
 * - New York residential electricity: 26.49 ¢/kWh (brief cites this as 49%
 * above the national average, implying a national mean near 17.8 ¢/kWh).
 * - Natural gas rates reflect the EIA short-term outlook's elevated Henry Hub
 * forecast through 2026–2027, expressed as residential $/therm.
 * Other state values are representative EIA-consistent residential rates.
 */

/** National average residential electricity rate, $/kWh. */
export const NATIONAL_ELECTRIC_RATE = 0.178;
/** National average residential natural gas rate, $/therm. */
export const NATIONAL_GAS_RATE = 1.35;

/** Residential electricity rate by state, $/kWh. */
export const STATE_ELECTRIC_RATE: Record<string, number> = {
  NY: 0.2649,
  CA: 0.31,
  HI: 0.44,
  MA: 0.31,
  CT: 0.3,
  RI: 0.29,
  NH: 0.24,
  ME: 0.24,
  VT: 0.22,
  NJ: 0.19,
  PA: 0.18,
  IL: 0.16,
  MI: 0.19,
  FL: 0.15,
  TX: 0.15,
  GA: 0.14,
  NC: 0.13,
  TN: 0.12,
  WA: 0.11,
  OR: 0.12,
  CO: 0.15,
  AZ: 0.15,
  NV: 0.16,
  MN: 0.15,
  DC: 0.17,
};

/** Residential natural gas rate by state, $/therm. */
export const STATE_GAS_RATE: Record<string, number> = {
  NY: 1.7,
  CA: 2.15,
  MA: 1.85,
  CT: 1.8,
  IL: 1.05,
  MI: 1.0,
  FL: 1.95,
  TX: 1.15,
  GA: 1.4,
  NC: 1.35,
  TN: 1.1,
  WA: 1.4,
  OR: 1.45,
  CO: 0.95,
  AZ: 1.55,
  NV: 1.25,
  MN: 0.95,
  PA: 1.35,
  NJ: 1.3,
  DC: 1.3,
};

export interface ResolvedEnergyRates {
  electricRate: number;
  gasRate: number;
  /** True when a state-specific rate was found. */
  localized: boolean;
  state: string | null;
}

/** Own-property lookup — a bare index would walk the prototype chain. */
function own(map: Record<string, number>, key: string): number | undefined {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}

export function resolveEnergyRates(location?: LocationInput): ResolvedEnergyRates {
  const state = location?.state?.toUpperCase() ?? null;
  const electric = state ? own(STATE_ELECTRIC_RATE, state) : undefined;
  if (state && electric !== undefined) {
    return {
      electricRate: electric,
      gasRate: own(STATE_GAS_RATE, state) ?? NATIONAL_GAS_RATE,
      localized: true,
      state,
    };
  }
  return {
    electricRate: NATIONAL_ELECTRIC_RATE,
    gasRate: NATIONAL_GAS_RATE,
    localized: false,
    state,
  };
}
