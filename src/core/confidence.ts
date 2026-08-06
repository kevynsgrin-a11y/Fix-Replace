import type { ApplianceCategory, ConfidenceResult } from './types.js';
import { getRepairCostBand } from '../data/partCosts.js';

/**
 * Confidence scoring and suppression logic — the guard against "fake precision".
 *
 * The score reflects how complete and plausible the inputs are. Crucially, when
 * a quote falls wildly outside the regional norm for that repair (the brief's
 * example: a $900 quote to replace a ~$190 dishwasher drain pump), we *suppress*
 * a definitive Repair/Replace verdict and instead warn the user that the quote
 * looks predatory and to seek a second opinion.
 */

export interface ConfidenceInput {
  category: ApplianceCategory;
  faultComponent: string | undefined | null;
  ageYears: number;
  repairQuote: number;
  laborMultiplier: number;
  /** True only when the location RESOLVED to a metro or state, not merely typed. */
  hasLocation: boolean;
  /** True when a location was supplied but could not be resolved. */
  locationUnresolved?: boolean;
  componentKnown: boolean;
}

/** Quote above this multiple of the regional high is treated as predatory. */
const PREDATORY_HIGH_MULTIPLE = 2.0;
/** Quote above this multiple is "on the high side" (dents confidence only). */
const ELEVATED_HIGH_MULTIPLE = 1.4;
/** Quote below this fraction of the regional low is suspiciously cheap. */
const SUSPICIOUS_LOW_FRACTION = 0.35;

export function evaluateConfidence(input: ConfidenceInput): ConfidenceResult {
  const { category, faultComponent, ageYears, repairQuote, laborMultiplier, hasLocation, componentKnown } =
    input;
  const locationUnresolved = input.locationUnresolved ?? false;

  let score = 100;
  const factors: string[] = [];
  const warnings: string[] = [];
  let suppressed = false;

  if (!componentKnown) {
    score -= 25;
    factors.push('No specific failed component identified — using a category-wide cost estimate.');
  }
  if (!(ageYears > 0)) {
    score -= 20;
    factors.push('Appliance age was not provided, which weakens the lifespan estimate.');
  }
  if (!hasLocation) {
    score -= 10;
    factors.push(
      locationUnresolved
        ? "We couldn't match the location you entered to a metro we have wage data for — national-average labor and energy rates were used."
        : 'No location provided — national-average labor and energy rates were used.',
    );
  }

  const band = getRepairCostBand(category, faultComponent, laborMultiplier);
  const predatoryThreshold = band.high * PREDATORY_HIGH_MULTIPLE;
  const elevatedThreshold = band.high * ELEVATED_HIGH_MULTIPLE;
  const suspiciousLow = band.low * SUSPICIOUS_LOW_FRACTION;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

  if (repairQuote > predatoryThreshold) {
    suppressed = true;
    score -= 30;
    warnings.push(
      `Your ${fmt(repairQuote)} quote is far above the typical ${fmt(band.low)}–${fmt(
        band.high,
      )} range for this repair in your area. It may be predatory — get a second opinion before authorizing the work.`,
    );
  } else if (repairQuote > elevatedThreshold) {
    score -= 10;
    factors.push(
      `Quote is on the high side versus the regional norm of ${fmt(band.low)}–${fmt(band.high)}.`,
    );
  } else if (repairQuote < suspiciousLow) {
    score -= 10;
    warnings.push(
      `This quote is unusually low versus the ${fmt(band.low)}–${fmt(
        band.high,
      )} regional norm — confirm it covers both parts and labor.`,
    );
  } else {
    factors.push(`Quote sits within the typical regional range of ${fmt(band.low)}–${fmt(band.high)}.`);
  }

  score = Math.min(100, Math.max(0, score));

  let level: ConfidenceResult['level'];
  if (suppressed) level = 'suppressed';
  else if (score >= 80) level = 'high';
  else if (score >= 60) level = 'moderate';
  else level = 'low';

  return { score, level, suppressed, factors, warnings };
}
