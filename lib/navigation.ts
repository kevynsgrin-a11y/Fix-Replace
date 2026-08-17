export interface NavLink {
  label: string
  href: string
}

/* Exactly 4 primary links carried by the desktop header. */
export const primaryLinks: NavLink[] = [
  { label: "Calculator", href: "/calculator" },
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
      { label: "Calculator", href: "/calculator" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Methodology", href: "/methodology" },
      { label: "Local repair costs", href: "/local-costs" },
      { label: "Recall checks", href: "/recall-checks" },
      { label: "For technicians", href: "/for-technicians" },
    ],
  },
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
