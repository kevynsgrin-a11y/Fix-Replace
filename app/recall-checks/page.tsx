import type { Metadata } from "next"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbLd, organizationLd, websiteLd, graphLd, jsonLdScript } from "@/lib/json-ld"
import { SITE_URL, ogImageUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: "Appliance Recall Check — Federal Recall Resources",
  description:
    "Check any appliance for an open federal recall. Direct links to CPSC SaferProducts.gov, Recalls.gov, and manufacturer lookup tools. No account required.",
  alternates: { canonical: `${SITE_URL}/recall-checks` },
  openGraph: {
    title: "Appliance Recall Check",
    description: "Check any appliance for an open federal recall via CPSC SaferProducts.gov and Recalls.gov.",
    url: `${SITE_URL}/recall-checks`,
    images: [
      {
        url: ogImageUrl({
          type: "editorial",
          title: "Check your appliance for an open recall",
          description: "CPSC SaferProducts.gov, Recalls.gov and manufacturer lookups — free, no account.",
        }),
        width: 1200,
        height: 630,
        alt: "Appliance recall check resources",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
}

const RECALL_RESOURCES = [
  {
    name: "CPSC SaferProducts.gov",
    description: "The official U.S. Consumer Product Safety Commission recall database. Search by product type, brand, or model number. Includes all recalls since 2011.",
    href: "https://www.saferproducts.gov/",
    note: "Free · No account required",
  },
  {
    name: "Recalls.gov",
    description: "Multi-agency portal combining CPSC, FDA, NHTSA, and USDA recalls. Useful when you are unsure which agency governs your appliance.",
    href: "https://www.recalls.gov/",
    note: "Free · Covers appliances, vehicles, food, medications",
  },
  {
    name: "CPSC recall search (direct)",
    description: "Direct search on recalls.cpsc.gov — faster for appliance-specific lookups. You can filter by category, year, and hazard type.",
    href: "https://www.cpsc.gov/Recalls",
    note: "Free · Filterable by hazard type",
  },
  {
    name: "CPSC email alerts",
    description: "Subscribe to receive recall notices by product category. Useful if you want to be notified when a recall is issued for your appliance type.",
    href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Recall-Guidance/Recall-Firm-Responsibilities",
    note: "Free subscription available",
  },
]

export default function RecallChecksPage() {
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    breadcrumbLd([{ name: "Home", href: "/" }, { name: "Recall check", href: "/recall-checks" }]),
  )
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Recall check" }]}
        eyebrow="Safety"
        heading="Check your appliance for an open recall"
        lede="Before you repair or keep a failing appliance, check whether a federal recall is open. These are the official resources — no account required."
      />
      <Container>
        <div className="py-12 pb-24">
          <ul className="flex flex-col gap-4">
            {RECALL_RESOURCES.map((resource) => (
              <li key={resource.name}>
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-2 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand)"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-(--color-ink) group-hover:text-(--color-brand)">{resource.name}</span>
                    <span className="shrink-0 text-(length:--text-xs) text-(--color-muted)">{resource.note}</span>
                  </div>
                  <p className="text-(length:--text-sm) leading-relaxed text-(--color-body)">{resource.description}</p>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface-2) px-6 py-6">
            <h2 className="text-(length:--text-base) font-semibold text-(--color-ink)">If your appliance has an open recall</h2>
            <p className="mt-2 text-(length:--text-sm) leading-relaxed text-(--color-body)">
              Contact the manufacturer directly — recall remedies are free to the consumer and may include a free repair, replacement, or refund depending on the hazard. Do not attempt to fix a recalled unit yourself; the recall process typically covers the certified remedy.
            </p>
          </div>
        </div>
      </Container>
    </>
  )
}
