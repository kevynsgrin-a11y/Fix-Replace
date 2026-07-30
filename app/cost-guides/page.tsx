import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { PageHero } from "@/components/site/page-hero"
import { ApplianceGlyph } from "@/components/ui/appliance-glyph"
import { GUIDE_SLUGS, getGuideData } from "@/lib/page-data"
import {
  graphLd,
  organizationLd,
  websiteLd,
  breadcrumbLd,
  jsonLdScript,
} from "@/lib/json-ld"

const SITE = "https://repair-or-replace.net"

const OG = `${SITE}/og?type=guide&title=${encodeURIComponent(
  "Appliance Repair Cost Guides",
)}&description=${encodeURIComponent("8 appliances · BLS & EIA data")}`

export const metadata: Metadata = {
  title: "Appliance Repair Cost Guides — RepairOrReplace",
  description:
    "Typical repair costs for 8 major appliances — refrigerator, washer, dishwasher, dryer, range, wall oven, microwave, and water heater. Real data from BLS, EIA, and NAHB.",
  alternates: { canonical: `${SITE}/cost-guides` },
  openGraph: {
    title: "Appliance Repair Cost Guides — RepairOrReplace",
    description: "Typical repair costs for 8 major appliances. Real data, no guesswork.",
    url: `${SITE}/cost-guides`,
    images: [{ url: OG, width: 1200, height: 630, alt: "Appliance repair cost guides" }],
  },
  twitter: { card: "summary_large_image" },
}

export default function CostGuidesHub() {
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    breadcrumbLd([
      { name: "Home", href: "/" },
      { name: "Cost guides", href: "/cost-guides" },
    ]),
  )

  const guides = GUIDE_SLUGS.map((slug) => getGuideData(slug)!).filter(Boolean)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }}
      />
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Cost guides" }]}
        eyebrow="Cost guides"
        heading="Appliance repair cost guides"
        lede="Lifespan by brand tier, typical repair costs, DIY vs. pro guidance, and the repair-vs-replace rule for every major home appliance."
        provenanceLine="Data reviewed July 19, 2026 · BLS OEWS 49-9031 · NAHB · EIA residential rates"
      />
      <Container>
        <main className="py-12 pb-24">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {GUIDE_SLUGS.map((slug) => {
              const guide = getGuideData(slug)
              if (!guide) return null
              return (
              <li key={slug}>
                <Link
                  href={`/cost-guides/${slug}`}
                  className="group flex flex-col gap-4 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand) hover:bg-(--color-surface-2)"
                >
                  <ApplianceGlyph category={guide.category} size={36} className="text-(--color-brand)" />
                  <div>
                    <p className="font-semibold text-(--color-ink)">{guide.title}</p>
                    <p className="mt-0.5 text-(length:--text-xs) text-(--color-muted)">Repair costs · lifespan · verdict rule</p>
                  </div>
                </Link>
              </li>
              )
            })}
          </ul>

          <div className="mt-12 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface-2) px-6 py-8 text-center">
            <p className="text-balance text-(length:--text-xl) font-semibold text-(--color-ink)">
              Have a quote in hand?
            </p>
            <p className="mt-2 text-(length:--text-sm) text-(--color-muted)">
              Enter your numbers and get a precise net-present-cost verdict in under a minute.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-12 items-center justify-center rounded-(--radius-md) bg-(--color-brand) px-6 text-(length:--text-base) font-medium text-(--color-on-brand) transition-colors hover:bg-(--color-brand-strong)"
            >
              Get my verdict &rarr;
            </Link>
          </div>
        </main>
      </Container>
    </>
  )
}
