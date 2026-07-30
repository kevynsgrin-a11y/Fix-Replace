import type { Metadata } from "next"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbList, organizationEntity } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export const metadata: Metadata = {
  title: "Appliance Recall Check — Federal Recall Resources",
  description:
    "Check any appliance for an open federal recall. Direct links to CPSC SaferProducts.gov, Recalls.gov, and manufacturer lookup tools. No account required.",
  alternates: { canonical: `${SITE}/recalls` },
  openGraph: {
    title: "Appliance Recall Check",
    description: "Check any appliance for an open federal recall via CPSC SaferProducts.gov and Recalls.gov.",
    url: `${SITE}/recalls`,
    images: [{ url: `${SITE}/og?type=editorial&slug=recalls`, width: 1200, height: 630, alt: "Appliance recall check resources" }],
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

export default function RecallsPage() {
  const ldBc = breadcrumbList([
    { name: "Home", url: SITE },
    { name: "Recalls", url: `${SITE}/recalls` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationEntity(SITE)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBc) }} />

      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Recalls" }]}
        eyebrow="Safety"
        title="Check your appliance for open recalls"
        lede="If a recall exists for your appliance, stop using it and contact the manufacturer. These are the official federal resources — no account required."
        provenance="CPSC database · Live recall data · Updated continuously"
      />

      <Container asChild>
        <main className="mt-12 pb-24">
          <div className="mx-auto max-w-[72ch]">

            <div className="space-y-4">
              {RECALL_RESOURCES.map((r) => (
                <a
                  key={r.name}
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand) hover:bg-(--color-surface-2) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand)"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-(length:--text-base) font-semibold text-(--color-ink) group-hover:text-(--color-brand)">
                      {r.name}
                    </h2>
                    <span className="mt-0.5 shrink-0 text-(length:--text-xs) text-(--color-muted)">{r.note}</span>
                  </div>
                  <p className="mt-2 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                    {r.description}
                  </p>
                  <span className="mt-3 inline-block text-(length:--text-xs) font-medium text-(--color-brand)">
                    Open {r.href.replace("https://", "").replace(/\/$/, "")} &rarr;
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-12 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface-2) p-6">
              <h2 className="text-(length:--text-base) font-semibold text-(--color-ink)">
                How the calculator uses recall data
              </h2>
              <p className="mt-2 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                When you provide a UPC or model number in the &ldquo;Advanced — recall check&rdquo;
                field, the calculator queries the CPSC SaferProducts database in real time.
                An active recall match is surfaced prominently in the result — it does not
                change the net-present cost math, but it is flagged as a strong independent
                reason to replace. If you do not provide a UPC, we show an invitation to
                check — we never say &ldquo;no recalls found&rdquo; for a unit we have not checked.
              </p>
            </div>

          </div>
        </main>
      </Container>
    </>
  )
}
