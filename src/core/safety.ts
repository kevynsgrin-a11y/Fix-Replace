import type { ApplianceCategory, SafetyResult } from './types.js';
import { getComponent, type Hazard } from '../data/partCosts.js';

/**
 * Trust & safety hard-stops. Providing diagnostic advice on gas, high-voltage,
 * and refrigerant systems carries real physical risk, so the utility actively
 * suppresses DIY parts links and tutorials for hazardous work and routes the
 * user to a licensed professional.
 */

const HAZARD_MESSAGES: Record<Hazard, string> = {
  gas: 'Gas components carry fire, explosion, and carbon-monoxide risk. This work must be performed by a licensed professional — never attempt it yourself.',
  high_voltage:
    'This part sits behind high-voltage capacitors that hold a lethal charge even when unplugged. Professional service only; no DIY.',
  refrigerant:
    'Handling refrigerant requires EPA Section 608 certification by law. A certified HVAC/appliance technician must perform this repair.',
  water: 'This repair involves water lines — shut off the supply first and watch for leaks that can cause hidden water damage.',
};

export function evaluateSafety(
  category: ApplianceCategory,
  faultComponent: string | undefined | null,
): SafetyResult {
  const component = getComponent(faultComponent);
  const hazards = new Set<Hazard>(component?.hazards ?? []);

  // Categorical rule: any internal microwave repair is high-voltage by nature,
  // regardless of which component was named.
  if (category === 'microwave_otr') {
    hazards.add('high_voltage');
  }

  const messages: string[] = [];
  let professionalRequired = false;
  let diySuppressed = false;

  const dangerous: Hazard[] = ['gas', 'high_voltage', 'refrigerant'];
  for (const hazard of hazards) {
    messages.push(HAZARD_MESSAGES[hazard]);
    if (dangerous.includes(hazard)) {
      professionalRequired = true;
      diySuppressed = true;
    }
  }

  // A known component that simply isn't homeowner-serviceable (e.g. a washer
  // transmission) is not a *safety* hazard, but it still has no DIY path.
  if (component && !component.diyFriendly) {
    diySuppressed = true;
    professionalRequired = true;
  }

  return {
    professionalRequired,
    diySuppressed,
    hazards: Array.from(hazards),
    messages,
  };
}
