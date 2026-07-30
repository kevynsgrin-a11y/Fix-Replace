import type { ApplianceCategory } from '../core/types';

/**
 * Component-level repair economics. Each entry carries a national installed-cost
 * band (parts + labor), a labor share (so regional wage multipliers only scale
 * the labor portion), DIY-friendliness, an optional DIY part-price band, and
 * hazard tags that drive the safety hard-stops.
 *
 * Anchored to the brief's cited figures:
 *   - Dryer thermal fuse ............ ~$145 in major metros
 *   - Refrigerator evaporator fan .... $180–$280
 *   - Dishwasher drain pump .......... ~$190 (Los Angeles, basic)
 *   - Gas valve / solenoid ........... $200–$350
 *   - Refrigerator sealed system ..... $500–$1,250
 *   - Washing machine transmission ... $350–$550 professionally
 *   - Dryer heating element .......... $30–$200 in parts
 *   - Microwave motor ................ $20–$100 in parts (pro-only internally)
 */

export type Hazard = 'gas' | 'high_voltage' | 'refrigerant' | 'water';

export interface Component {
  id: string;
  label: string;
  categories: ApplianceCategory[];
  /** National installed cost band, USD. */
  costLow: number;
  costHigh: number;
  /** Fraction of installed cost attributable to labor (0–1). */
  laborShare: number;
  diyFriendly: boolean;
  /** DIY part-only price band, present when diyFriendly. */
  partLow?: number;
  partHigh?: number;
  hazards: Hazard[];
}

export const COMPONENTS: Record<string, Component> = {
  thermal_fuse: {
    id: 'thermal_fuse',
    label: 'Thermal fuse',
    categories: ['dryer'],
    costLow: 100,
    costHigh: 190,
    laborShare: 0.75,
    diyFriendly: true,
    partLow: 15,
    partHigh: 40,
    hazards: [],
  },
  heating_element: {
    id: 'heating_element',
    label: 'Heating element',
    categories: ['dryer'],
    costLow: 120,
    costHigh: 280,
    laborShare: 0.6,
    diyFriendly: true,
    partLow: 30,
    partHigh: 200,
    hazards: [],
  },
  drain_pump: {
    id: 'drain_pump',
    label: 'Drain pump',
    categories: ['dishwasher', 'washer_frontload', 'washer_topload'],
    costLow: 150,
    costHigh: 320,
    laborShare: 0.65,
    diyFriendly: true,
    partLow: 40,
    partHigh: 150,
    hazards: ['water'],
  },
  evaporator_fan_motor: {
    id: 'evaporator_fan_motor',
    label: 'Evaporator fan motor',
    categories: ['refrigerator_freestanding', 'refrigerator_builtin'],
    costLow: 180,
    costHigh: 280,
    laborShare: 0.6,
    diyFriendly: true,
    partLow: 60,
    partHigh: 160,
    hazards: [],
  },
  compressor: {
    id: 'compressor',
    label: 'Compressor',
    categories: ['refrigerator_freestanding', 'refrigerator_builtin'],
    costLow: 300,
    costHigh: 650,
    laborShare: 0.55,
    diyFriendly: false,
    hazards: ['refrigerant'],
  },
  sealed_system: {
    id: 'sealed_system',
    label: 'Sealed system leak',
    categories: ['refrigerator_freestanding', 'refrigerator_builtin'],
    costLow: 500,
    costHigh: 1250,
    laborShare: 0.5,
    diyFriendly: false,
    hazards: ['refrigerant'],
  },
  control_board: {
    id: 'control_board',
    label: 'Electronic control board',
    categories: [
      'refrigerator_freestanding',
      'refrigerator_builtin',
      'washer_frontload',
      'washer_topload',
      'dryer',
      'dishwasher',
      'range_electric',
      'range_gas',
      'oven',
    ],
    costLow: 200,
    costHigh: 500,
    laborShare: 0.45,
    diyFriendly: true,
    partLow: 120,
    partHigh: 350,
    hazards: [],
  },
  gas_valve: {
    id: 'gas_valve',
    label: 'Gas valve / solenoid',
    categories: ['range_gas', 'oven', 'water_heater', 'dryer'],
    costLow: 200,
    costHigh: 350,
    laborShare: 0.5,
    diyFriendly: false,
    hazards: ['gas'],
  },
  gas_igniter: {
    id: 'gas_igniter',
    label: 'Gas igniter',
    categories: ['range_gas', 'oven'],
    costLow: 150,
    costHigh: 300,
    laborShare: 0.55,
    diyFriendly: false,
    hazards: ['gas'],
  },
  gas_burner: {
    id: 'gas_burner',
    label: 'Gas burner assembly',
    categories: ['range_gas', 'dryer', 'water_heater'],
    costLow: 180,
    costHigh: 400,
    laborShare: 0.55,
    diyFriendly: false,
    hazards: ['gas'],
  },
  door_gasket: {
    id: 'door_gasket',
    label: 'Door seal / gasket',
    categories: ['refrigerator_freestanding', 'refrigerator_builtin', 'dishwasher', 'oven'],
    costLow: 100,
    costHigh: 250,
    laborShare: 0.55,
    diyFriendly: true,
    partLow: 40,
    partHigh: 160,
    hazards: [],
  },
  transmission: {
    id: 'transmission',
    label: 'Transmission',
    categories: ['washer_topload', 'washer_frontload'],
    costLow: 350,
    costHigh: 550,
    laborShare: 0.65,
    diyFriendly: false,
    hazards: [],
  },
  drum_bearing: {
    id: 'drum_bearing',
    label: 'Drum bearing / spider',
    categories: ['washer_frontload', 'washer_topload', 'dryer'],
    costLow: 250,
    costHigh: 450,
    laborShare: 0.7,
    diyFriendly: false,
    hazards: [],
  },
  water_inlet_valve: {
    id: 'water_inlet_valve',
    label: 'Water inlet valve',
    categories: ['washer_frontload', 'washer_topload', 'dishwasher', 'refrigerator_freestanding'],
    costLow: 120,
    costHigh: 250,
    laborShare: 0.6,
    diyFriendly: true,
    partLow: 25,
    partHigh: 90,
    hazards: ['water'],
  },
  thermostat: {
    id: 'thermostat',
    label: 'Thermostat',
    categories: ['dryer', 'oven', 'range_electric', 'water_heater', 'hvac_central'],
    costLow: 120,
    costHigh: 260,
    laborShare: 0.6,
    diyFriendly: true,
    partLow: 20,
    partHigh: 90,
    hazards: [],
  },
  bake_element: {
    id: 'bake_element',
    label: 'Bake / broil element',
    categories: ['oven', 'range_electric'],
    costLow: 120,
    costHigh: 280,
    laborShare: 0.55,
    diyFriendly: true,
    partLow: 30,
    partHigh: 120,
    hazards: [],
  },
  magnetron: {
    id: 'magnetron',
    label: 'Magnetron',
    categories: ['microwave_otr'],
    costLow: 150,
    costHigh: 300,
    laborShare: 0.5,
    diyFriendly: false,
    hazards: ['high_voltage'],
  },
  microwave_motor: {
    id: 'microwave_motor',
    label: 'Turntable / fan motor',
    categories: ['microwave_otr'],
    costLow: 90,
    costHigh: 220,
    laborShare: 0.6,
    diyFriendly: false,
    partLow: 20,
    partHigh: 100,
    hazards: ['high_voltage'],
  },
  hvac_compressor: {
    id: 'hvac_compressor',
    label: 'HVAC compressor',
    categories: ['hvac_central'],
    costLow: 1200,
    costHigh: 2800,
    laborShare: 0.45,
    diyFriendly: false,
    hazards: ['refrigerant'],
  },
  hvac_capacitor: {
    id: 'hvac_capacitor',
    label: 'Run capacitor',
    categories: ['hvac_central'],
    costLow: 150,
    costHigh: 400,
    laborShare: 0.6,
    diyFriendly: false,
    hazards: ['high_voltage'],
  },
  hvac_refrigerant: {
    id: 'hvac_refrigerant',
    label: 'Refrigerant recharge / leak',
    categories: ['hvac_central', 'refrigerator_freestanding', 'refrigerator_builtin'],
    costLow: 250,
    costHigh: 900,
    laborShare: 0.5,
    diyFriendly: false,
    hazards: ['refrigerant'],
  },
  wh_element: {
    id: 'wh_element',
    label: 'Water heater element',
    categories: ['water_heater'],
    costLow: 150,
    costHigh: 350,
    laborShare: 0.6,
    diyFriendly: true,
    partLow: 20,
    partHigh: 60,
    hazards: [],
  },
};

/**
 * Category-level default repair band, used when the specific failed component
 * is unknown or unrecognized. Mid-point represents a "typical major repair"
 * for that category.
 */
export const CATEGORY_DEFAULT_REPAIR: Record<ApplianceCategory, { low: number; high: number }> = {
  refrigerator_freestanding: { low: 200, high: 500 },
  refrigerator_builtin: { low: 300, high: 900 },
  washer_frontload: { low: 180, high: 450 },
  washer_topload: { low: 150, high: 400 },
  dryer: { low: 120, high: 350 },
  dishwasher: { low: 150, high: 400 },
  range_gas: { low: 180, high: 450 },
  range_electric: { low: 150, high: 400 },
  oven: { low: 180, high: 450 },
  water_heater: { low: 180, high: 550 },
  microwave_otr: { low: 120, high: 300 },
  hvac_central: { low: 300, high: 1200 },
};

export function getComponent(id: string | undefined | null): Component | null {
  if (!id) return null;
  return COMPONENTS[id] ?? null;
}

/** Components applicable to a given category (for UI symptom pickers). */
export function componentsForCategory(category: ApplianceCategory): Component[] {
  return Object.values(COMPONENTS).filter((c) => c.categories.includes(category));
}

interface CostBand {
  low: number;
  high: number;
  mid: number;
}

/** Apply the regional labor multiplier to the labor portion of a band. */
function applyLaborMultiplier(low: number, high: number, laborShare: number, multiplier: number): CostBand {
  const adjust = (v: number) => v * (1 - laborShare) + v * laborShare * multiplier;
  const aLow = adjust(low);
  const aHigh = adjust(high);
  return { low: aLow, high: aHigh, mid: (aLow + aHigh) / 2 };
}

/**
 * Regionally-adjusted expected repair cost band for a specific component. Falls
 * back to the category default when the component is unknown.
 */
export function getRepairCostBand(
  category: ApplianceCategory,
  componentId: string | undefined | null,
  laborMultiplier: number,
): CostBand {
  const component = getComponent(componentId);
  if (component) {
    return applyLaborMultiplier(component.costLow, component.costHigh, component.laborShare, laborMultiplier);
  }
  const fallback = CATEGORY_DEFAULT_REPAIR[category];
  // Category defaults are labor-heavy; assume 0.6 labor share.
  return applyLaborMultiplier(fallback.low, fallback.high, 0.6, laborMultiplier);
}
