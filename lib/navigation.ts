export interface NavLink {
  label: string
  href: string
}

/* Exactly 4 primary links carried by the desktop header. */
export const primaryLinks: NavLink[] = [
  { label: "Calculator", href: "/#calculator-heading" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Cost guides", href: "/cost-guides" },
  { label: "Local costs", href: "/local-costs" },
]

/* Additional links surfaced only in the mobile drawer. */
export const secondaryLinks: NavLink[] = [
  { label: "Methodology", href: "/methodology" },
  { label: "Recall checks", href: "/recall-checks" },
  { label: "For technicians", href: "/for-technicians" },
  { label: "About", href: "/about" },
]

/* Fat-footer site map. */
export const footerNav: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Calculator", href: "/#calculator-heading" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Methodology", href: "/methodology" },
      { label: "Local repair costs", href: "/local-costs" },
      { label: "Recall checks", href: "/recall-checks" },
      { label: "For technicians", href: "/for-technicians" },
    ],
  },
  /*
   * MAINTENANCE: this column must carry one entry per slug in GUIDE_SLUGS
   * (lib/page-data.ts) — the footer is the only sitewide internal link a
   * guide page gets, so a missing entry orphans that guide.
   *
   * It is written out by hand rather than derived from GUIDE_SLUGS on
   * purpose: this module is imported by client components (site-header.tsx
   * and mobile-drawer.tsx are both "use client"), and lib/page-data.ts is
   * a documented server-only module that pulls in the whole engine data
   * chain (src/data/lifespans, partCosts, laborRates) and does top-level
   * work, so the import would not reliably tree-shake back out of the
   * client bundle. Add the guide here whenever you add one there.
   */
  {
    heading: "Popular guides",
    links: [
      { label: "Refrigerators", href: "/cost-guides/refrigerators" },
      { label: "Washing machines", href: "/cost-guides/washing-machines" },
      { label: "Dishwashers", href: "/cost-guides/dishwashers" },
      { label: "Dryers", href: "/cost-guides/dryers" },
      { label: "Wall ovens", href: "/cost-guides/wall-ovens" },
      { label: "Ranges", href: "/cost-guides/ranges" },
      { label: "Microwaves", href: "/cost-guides/microwaves" },
      { label: "Water heaters", href: "/cost-guides/water-heaters" },
      { label: "Central HVAC", href: "/cost-guides/hvac" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "All cost guides", href: "/cost-guides" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
]
