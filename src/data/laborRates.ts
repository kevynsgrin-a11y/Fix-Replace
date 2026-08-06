import type { LocationInput } from '../core/types.js';

/**
 * Regional labor data for Home Appliance Repairers (BLS OEWS occupation code
 * 49-9031, May 2024). Retail service prices track the local field-labor market,
 * so a repair that is fairly priced in Miami can look like gouging in
 * Minneapolis and vice-versa. We convert area mean hourly wages into a labor
 * multiplier applied to the labor-heavy portion of component cost estimates.
 *
 * Anchored to published figures:
 *   - National median hourly wage: $22.68
 *   - National 90th percentile:    $34.93
 *   - Minneapolis–St. Paul mean:   $28.51
 *   - Miami mean:                  $22.87
 * Other metro means are OEWS-consistent estimates for the same occupation.
 */

export const NATIONAL_MEDIAN_WAGE = 22.68;
export const NATIONAL_P90_WAGE = 34.93;

/** National *mean* baseline used to normalize metro means into multipliers. */
export const NATIONAL_MEAN_WAGE = 24.1;

export interface MetroLabor {
  slug: string;
  name: string;
  state: string;
  /** Area mean hourly wage for occupation 49-9031, USD. */
  meanHourlyWage: number;
}

export const METROS: MetroLabor[] = [
  { slug: 'los-angeles', name: 'Los Angeles, CA', state: 'CA', meanHourlyWage: 26.4 },
  { slug: 'san-francisco', name: 'San Francisco, CA', state: 'CA', meanHourlyWage: 30.9 },
  { slug: 'san-diego', name: 'San Diego, CA', state: 'CA', meanHourlyWage: 25.7 },
  { slug: 'new-york', name: 'New York, NY', state: 'NY', meanHourlyWage: 28.8 },
  { slug: 'boston', name: 'Boston, MA', state: 'MA', meanHourlyWage: 29.6 },
  { slug: 'chicago', name: 'Chicago, IL', state: 'IL', meanHourlyWage: 25.3 },
  { slug: 'minneapolis', name: 'Minneapolis–St. Paul, MN', state: 'MN', meanHourlyWage: 28.51 },
  { slug: 'miami', name: 'Miami, FL', state: 'FL', meanHourlyWage: 22.87 },
  { slug: 'seattle', name: 'Seattle, WA', state: 'WA', meanHourlyWage: 29.1 },
  { slug: 'dallas', name: 'Dallas, TX', state: 'TX', meanHourlyWage: 23.4 },
  { slug: 'houston', name: 'Houston, TX', state: 'TX', meanHourlyWage: 23.1 },
  { slug: 'atlanta', name: 'Atlanta, GA', state: 'GA', meanHourlyWage: 23.0 },
  { slug: 'denver', name: 'Denver, CO', state: 'CO', meanHourlyWage: 25.6 },
  { slug: 'phoenix', name: 'Phoenix, AZ', state: 'AZ', meanHourlyWage: 23.3 },
  { slug: 'philadelphia', name: 'Philadelphia, PA', state: 'PA', meanHourlyWage: 25.0 },
  { slug: 'washington-dc', name: 'Washington, DC', state: 'DC', meanHourlyWage: 27.9 },
  { slug: 'detroit', name: 'Detroit, MI', state: 'MI', meanHourlyWage: 24.2 },
  { slug: 'portland', name: 'Portland, OR', state: 'OR', meanHourlyWage: 26.2 },
  { slug: 'las-vegas', name: 'Las Vegas, NV', state: 'NV', meanHourlyWage: 24.0 },
  { slug: 'nashville', name: 'Nashville, TN', state: 'TN', meanHourlyWage: 22.4 },
  { slug: 'charlotte', name: 'Charlotte, NC', state: 'NC', meanHourlyWage: 22.6 },
  { slug: 'austin', name: 'Austin, TX', state: 'TX', meanHourlyWage: 24.1 },
];

const METRO_BY_SLUG = new Map(METROS.map((m) => [m.slug, m]));

/** State-level mean wage fallback when only a state code is known. */
export const STATE_MEAN_WAGE: Record<string, number> = {
  CA: 26.6,
  NY: 27.5,
  MA: 29.0,
  IL: 24.8,
  MN: 27.9,
  FL: 22.6,
  WA: 28.4,
  TX: 23.3,
  GA: 22.8,
  CO: 25.2,
  AZ: 23.1,
  PA: 24.6,
  DC: 27.9,
  MI: 23.9,
  OR: 25.9,
  NV: 23.8,
  TN: 22.3,
  NC: 22.5,
};

/**
 * Coarse 3-digit ZIP prefix -> metro slug map for the highest-traffic metros.
 * This is intentionally partial; unmatched ZIPs fall through to state, then
 * national. A production build would replace this with the full crosswalk in D1.
 */
const ZIP3_TO_METRO: Record<string, string> = {
  '900': 'los-angeles', '901': 'los-angeles', '902': 'los-angeles',
  '941': 'san-francisco', '940': 'san-francisco',
  '921': 'san-diego',
  '100': 'new-york', '101': 'new-york', '104': 'new-york', '112': 'new-york',
  '021': 'boston', '022': 'boston',
  '606': 'chicago', '604': 'chicago',
  '554': 'minneapolis', '551': 'minneapolis',
  '331': 'miami', '330': 'miami',
  '981': 'seattle', '980': 'seattle',
  '752': 'dallas', '750': 'dallas',
  '770': 'houston', '772': 'houston',
  '303': 'atlanta', '300': 'atlanta',
  '802': 'denver', '800': 'denver',
  '850': 'phoenix', '852': 'phoenix',
  '191': 'philadelphia', '190': 'philadelphia',
  '200': 'washington-dc', '203': 'washington-dc',
  '482': 'detroit', '480': 'detroit',
  '972': 'portland', '970': 'portland',
  '891': 'las-vegas', '890': 'las-vegas',
  '372': 'nashville',
  '282': 'charlotte',
  '787': 'austin', '733': 'austin',
};

/**
 * Own-property lookup. A bare index walks the prototype chain, so a key like
 * "constructor" would return a function instead of a miss. Every user-supplied
 * key must go through this.
 */
function own<T>(map: Record<string, T>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}

export interface ResolvedLabor {
  /** Multiplier applied to labor-heavy cost estimates (1.0 = national). */
  multiplier: number;
  /** Metro slug when resolved to a metro, else null. */
  metro: string | null;
  /** Human label describing the resolution basis. */
  basis: string;
  /** State code when known. */
  state: string | null;
}

const MIN_MULTIPLIER = 0.85;
const MAX_MULTIPLIER = 1.5;

function wageToMultiplier(meanWage: number): number {
  const raw = meanWage / NATIONAL_MEAN_WAGE;
  return Math.min(MAX_MULTIPLIER, Math.max(MIN_MULTIPLIER, raw));
}

/**
 * Resolve a labor multiplier from the most specific location signal available:
 * explicit metro > ZIP prefix > state > national.
 */
export function resolveLabor(location?: LocationInput): ResolvedLabor {
  if (location?.metro) {
    const metro = METRO_BY_SLUG.get(location.metro);
    if (metro) {
      return {
        multiplier: wageToMultiplier(metro.meanHourlyWage),
        metro: metro.slug,
        basis: `${metro.name} area mean wage $${metro.meanHourlyWage.toFixed(2)}/hr`,
        state: metro.state,
      };
    }
  }

  if (location?.zip && location.zip.length >= 3) {
    const zip3 = location.zip.slice(0, 3);
    const slug = own(ZIP3_TO_METRO, zip3);
    if (slug) {
      const metro = METRO_BY_SLUG.get(slug)!;
      return {
        multiplier: wageToMultiplier(metro.meanHourlyWage),
        metro: metro.slug,
        basis: `${metro.name} (ZIP ${zip3}xx) area mean wage $${metro.meanHourlyWage.toFixed(2)}/hr`,
        state: metro.state,
      };
    }
  }

  const state = location?.state?.toUpperCase();
  const stateWage = state ? own(STATE_MEAN_WAGE, state) : undefined;
  if (state && stateWage !== undefined) {
    return {
      multiplier: wageToMultiplier(stateWage),
      metro: null,
      basis: `${state} state mean wage $${stateWage.toFixed(2)}/hr`,
      state,
    };
  }

  return {
    multiplier: 1.0,
    metro: null,
    basis: 'National average (no location provided)',
    state: state ?? null,
  };
}
