import type { ApplianceCategory, BrandTier } from './types.js';
import { APPLIANCES } from '../data/appliances.js';
import { componentsForCategory } from '../data/partCosts.js';
import { METROS } from '../data/laborRates.js';
import { getLifespanBand } from '../data/lifespans.js';

/**
 * UI catalog. The frontend fetches this once to build the intake form
 * dynamically — category list, brand tiers with prices and lifespan bands, the
 * symptom picker per category, and the metro list — so there is a single source
 * of truth for the domain and no duplicated data in the client.
 */

const TIER_ORDER: BrandTier[] = ['budget', 'mid', 'premium'];
const TIER_LABELS: Record<BrandTier, string> = {
  budget: 'Budget / entry',
  mid: 'Mid-range',
  premium: 'Premium / luxury',
};

export function getCatalog() {
  const categories = (Object.keys(APPLIANCES) as ApplianceCategory[]).map((cat) => {
    const meta = APPLIANCES[cat];
    return {
      id: cat,
      label: meta.label,
      fuelDependent: meta.fuelDependent,
      defaultFuel: meta.defaultFuel,
      tiers: TIER_ORDER.map((t) => ({
        id: t,
        label: TIER_LABELS[t],
        newPrice: meta.newPrice[t],
        lifespan: getLifespanBand(cat, t),
      })),
      components: componentsForCategory(cat).map((c) => ({
        id: c.id,
        label: c.label,
        diyFriendly: c.diyFriendly,
        hazards: c.hazards,
        costLow: c.costLow,
        costHigh: c.costHigh,
      })),
    };
  });

  return {
    categories,
    tiers: TIER_ORDER.map((t) => ({ id: t, label: TIER_LABELS[t] })),
    metros: METROS.map((m) => ({ slug: m.slug, name: m.name, state: m.state })),
  };
}
