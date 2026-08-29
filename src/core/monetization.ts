import type {
  AffiliateLink,
  ApplianceCategory,
  BrandTier,
  LeadGenOption,
  MonetizationResult,
  SafetyResult,
  Verdict,
} from './types';
import { getApplianceMeta } from '../data/appliances';
import { getComponent } from '../data/partCosts';

/**
 * Monetization contract. Two hard rules from the brief drive this module:
 *   1. Paid placements must never masquerade as the neutral result. The verdict
 *      is computed first and independently; links are appended afterward and the
 *      frontend renders them in a physically separate block.
 *   2. All affiliate/lead placements carry an FTC-compliant disclosure.
 *
 * DIY parts links are only offered for a known, homeowner-serviceable component
 * on a repair verdict, and are hard-suppressed for any hazardous work.
 */

const FTC_DISCLOSURE =
  'Disclosure: RepairOrReplace may earn a commission on parts or products bought through these links, and a referral fee if you request a quote from a local pro. These partnerships never influence your result above or which repair-vs-replace verdict we show.';

/**
 * RepairClinic affiliate program — the specialist repair-parts complement to the
 * general-retailer placements. It pays materially better than the big-box
 * programs (roughly 6% commission on a 7-day cookie, against ~1.6% on a 24-hour
 * cookie) and it maps exactly onto the moment this link renders: a known,
 * homeowner-serviceable part on a repair verdict.
 *
 * PLACEHOLDER — this is NOT a live partner ID, and it is deliberately not shaped
 * like one. It must be replaced with the real tracking ID issued once the
 * RepairClinic affiliate account is approved. Until that happens
 * `repairClinicPartUrl()` emits a plain, untracked search link: the user still
 * lands on the correct part, but the click is unattributed and earns nothing.
 *
 * The exact attribution mechanism is confirmed at approval time (a tracking
 * parameter on repairclinic.com, or a network deep link). This constant and
 * REPAIRCLINIC_AFFILIATE_PARAM are the only two places that need to change.
 */
const REPAIRCLINIC_AFFILIATE_ID: string = 'UNSET_REPAIRCLINIC_PARTNER_ID';

/** Query parameter used to attribute a referred RepairClinic click. */
const REPAIRCLINIC_AFFILIATE_PARAM = 'affiliate_id';

/** True only once a real partner ID has replaced the placeholder above. */
function hasRepairClinicAffiliateId(): boolean {
  return REPAIRCLINIC_AFFILIATE_ID.length > 0 && !REPAIRCLINIC_AFFILIATE_ID.startsWith('UNSET_');
}

/**
 * Search link into RepairClinic for the failed component on this appliance,
 * built the same way as the retailer links: a single URL-encoded query string.
 * Tracking is appended only when a real partner ID is in place.
 */
function repairClinicPartUrl(encodedQuery: string): string {
  const base = `https://www.repairclinic.com/Shop-For-Parts?query=${encodedQuery}`;
  return hasRepairClinicAffiliateId()
    ? `${base}&${REPAIRCLINIC_AFFILIATE_PARAM}=${encodeURIComponent(REPAIRCLINIC_AFFILIATE_ID)}`
    : base;
}

function partLinks(category: ApplianceCategory, componentLabel: string): AffiliateLink[] {
  const meta = getApplianceMeta(category);
  const q = encodeURIComponent(`${meta.label} ${componentLabel}`);
  return [
    // Specialist repair-parts partner first: it is the closest match to the
    // "buy this exact part" intent, and the higher-payout program.
    {
      kind: 'part',
      label: componentLabel,
      merchant: 'RepairClinic',
      url: repairClinicPartUrl(q),
    },
    {
      kind: 'part',
      label: componentLabel,
      merchant: 'Amazon',
      url: `https://www.amazon.com/s?k=${q}`,
    },
  ];
}

function newUnitLinks(category: ApplianceCategory, tier: BrandTier): AffiliateLink[] {
  const meta = getApplianceMeta(category);
  const q = encodeURIComponent(`${tier} ${meta.label}`);
  return [
    {
      kind: 'new_unit',
      label: `Shop ${meta.label}`,
      merchant: 'The Home Depot',
      url: `https://www.homedepot.com/s/${q}`,
    },
    {
      kind: 'new_unit',
      label: `Shop ${meta.label}`,
      merchant: 'Best Buy',
      url: `https://www.bestbuy.com/site/searchpage.jsp?st=${q}`,
    },
    {
      kind: 'new_unit',
      label: `Shop ${meta.label}`,
      merchant: 'Wayfair',
      url: `https://www.wayfair.com/keyword.php?keyword=${q}`,
    },
  ];
}

export interface MonetizationInput {
  verdict: Verdict;
  category: ApplianceCategory;
  tier: BrandTier;
  faultComponent: string | undefined | null;
  safety: SafetyResult;
  /** Regionally-adjusted local repair invoice band for lead-gen context. */
  invoiceLow: number;
  invoiceHigh: number;
}

export function buildMonetization(input: MonetizationInput): MonetizationResult {
  const { verdict, category, tier, faultComponent, safety, invoiceLow, invoiceHigh } = input;
  const affiliateLinks: AffiliateLink[] = [];
  const leadGen: LeadGenOption[] = [];

  const component = getComponent(faultComponent);

  // DIY parts: only for a known, homeowner-serviceable, non-hazardous component
  // on a repair verdict.
  if (verdict === 'repair' && component && component.diyFriendly && !safety.diySuppressed) {
    affiliateLinks.push(...partLinks(category, component.label));
  }

  // New unit shopping on a replace verdict.
  if (verdict === 'replace') {
    affiliateLinks.push(...newUnitLinks(category, tier));
  }

  // Local pro lead-gen: whenever a professional is required, or a repair is
  // advised on non-DIY work, or the verdict was suppressed (needs a real quote).
  const needsPro =
    safety.professionalRequired ||
    (verdict === 'repair' && component && !component.diyFriendly) ||
    verdict === 'uncertain';
  if (needsPro) {
    leadGen.push({
      label:
        verdict === 'uncertain'
          ? 'Get a second, no-obligation quote from a vetted local pro'
          : 'Get quotes from vetted local appliance pros',
      estimatedInvoiceLow: Math.round(invoiceLow),
      estimatedInvoiceHigh: Math.round(invoiceHigh),
    });
  }

  return {
    affiliateLinks,
    leadGen,
    // The calculator result screen never runs display ads — they are reserved
    // for low-intent editorial pages so the financial verdict stays unobscured.
    showDisplayAds: false,
    disclosure: FTC_DISCLOSURE,
  };
}
