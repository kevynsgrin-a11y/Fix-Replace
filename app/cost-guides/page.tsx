import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { PageHero } from "@/components/site/page-hero"
import { ApplianceGlyph } from "@/components/ui/appliance-glyph"
import { GUIDE_SLUGS } from "@/lib/page-data"
import { graphLd, organizationLd, websiteLd, breadcrumbLd, jsonLdScript } from "@/lib/json-ld"

const SITE = "https://repair-or-replace.net"

export const metadata: Metadata = {
  title: "Appliance Repair Cost Guides — RepairOrReplace",
  description:
    "Typical repair costs for 8 major appliances — refrigerator, washer, dishwasher, dryer, range, wall oven, microwave, and water heater. Real data from BLS, EIA, and NAHB.",
  alternates: { canonical: `${SITE}/cost-guides` },
  openGraph: {
    title: "Appliance Repair Cost Guides — RepairOrReplace",
    description: "Typical repair costs for 8 major appliances. Real data, no guesswork.",
    url: `${SITE}/cost-guides`,
    images: [{ url: `${SITE}/og?type=guide&title=${encodeURIComponent("Appliance Repair Cost Guides")}&description=${encodeURIComponent("8 appliances · BLS & EIA data")}`, width: 1200, height: 630, alt: "Appliance repair cost guides" }],
  },
  twitter: { card: "summary_large_image" },
}

export default function CostGuidesHub() {
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    breadcrumbLd([{ name: "Home", href: "/" }, { name: "Cost guides", href: "/cost-guides" }]),
  )
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Cost guides" }]}
        eyebrow="Cost guides"
        heading="Appliance repair cost guides"
        lede="Lifespan data by brand tier, typical repair costs, DIY vs. pro guidance, and the repair-vs-replace rule for every major home appliance."
        provenanceLine="Data reviewed July 19, 2026 · BLS OEWS 49-9031 · NAHB · EIA residential rates"
      />
      <Container>
        <main className="py-12 pb-24">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {GUIDE_SLUGS.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/cost-guides/${g.slug}`}
                  className="group flex flex-col gap-4 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand) hover:bg-(--color-surface-2)"
                >
                  <ApplianceGlyph category={g.category} size={36} className="text-(--color-brand)" />
                  <div>
                    <p className="font-semibold text-(--color-ink)">{g.navLabel}</p>
                    <p className="mt-0.5 text-(length:--text-xs) text-(--color-muted)">Repair costs · lifespan · verdict rule</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-12 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface-2) px-6 py-8 text-center">
            <p className="text-balance text-(length:--text-xl) font-semibold text-(--color-ink)">Have a quote in hand?</p>
            <p className="mt-2 text-(length:--text-sm) text-(--color-muted)">Enter your numbers and get a precise net-present-cost verdict in under 60 seconds.</p>
            <Link href="/" className="mt-5 inline-flex h-12 items-center justify-center rounded-(--radius-md) bg-(--color-brand) px-6 text-(length:--text-base) font-medium text-(--color-on-brand) transition-colors hover:bg-(--color-brand-strong)">
              Get my verdict &rarr;
            </Link>
          </div>
        </main>
      </Container>
    </>
  )
}

export const metadata: Metadata = {
  title: "Appliance Repair Cost Guides — RepairOrReplace",
  description:
    "Typical repair costs for 8 major appliances — refrigerator, washer, dishwasher, dryer, range, wall oven, microwave, and water heater. Real data from BLS, EIA, and NAHB.",
  alternates: { canonical: `${SITE}/cost-guides` },
  openGraph: {
    title: "Appliance Repair Cost Guides — RepairOrReplace",
    description: "Typical repair costs for 8 major appliances. Real data, no guesswork.",
    url: `${SITE}/cost-guides`,
    images: [{
      url: `${SITE}/og?title=${encodeURIComponent("Appliance Repair Cost Guides")}&sub=${encodeURIComponent("8 appliances · real BLS & EIA data")}&eyebrow=Cost+Guides`,
      width: 1200, height: 630,
      alt: "Appliance repair cost guides — RepairOrReplace.net",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Appliance Repair Cost Guides — RepairOrReplace",
    description: "Typical repair costs for 8 major appliances. Real data, no guesswork.",
    images: [{ url: `${SITE}/og?title=${encodeURIComponent("Appliance Repair Cost Guides")}&sub=${encodeURIComponent("8 appliances · real BLS & EIA data")}&eyebrow=Cost+Guides`, alt: "Appliance repair cost guides" }],
  },
}

const jsonLdScripts = [
  ORG_SCHEMA,
  WEBSITE_SCHEMA,
  breadcrumbSchema([{ name: "Home", url: "/" }, { name: "Cost guides" }]),
]

export default function CostGuidesPage() {
  return (
    <>
      {jsonLdScripts.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <PageHero
        crumbs={[{ label: "Cost guides" }]}
        eyebrow="Cost guides"
        heading="Appliance repair cost guides"
        lede="Real repair costs for 8 major appliances — organized by part, brand tier, and labor market. Every number is sourced from BLS OEWS, EIA residential rates, and NAHB housing surveys."
      />
      <Container className="py-16">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GUIDE_SLUGS.map((slug) => {
            const { title, sub } = GUIDE_LABELS[slug]
            return (
              <li key={slug}>
                <Link
                  href={`/cost-guides/${slug}`}
                  className="group flex h-full flex-col gap-3 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand)"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-surface-2) text-(--color-ink) transition-colors group-hover:bg-(--color-brand) group-hover:text-white">
                      <ApplianceGlyph id={slug} size={20} aria-hidden />
                    </span>
                    <span className="text-(length:--text-sm) font-semibold text-(--color-ink)">
                      {title}
                    </span>
                  </div>
                  <p className="text-(length:--text-xs) text-(--color-muted)">{sub}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      </Container>
    </>
  )
}
