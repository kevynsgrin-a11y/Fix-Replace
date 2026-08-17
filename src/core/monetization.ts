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

function partLinks(category: ApplianceCategory, componentLabel: string): AffiliateLink[] {
  const meta = getApplianceMeta(category);
  const q = encodeURIComponent(`${meta.label} ${componentLabel}`);
  return [
    {
      kind: 'part',
      label: componentLabel,
      merchant: 'RepairClinic',
      url: `https://www.repairclinic.com/Shop-For-Parts?query=${q}`,
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
