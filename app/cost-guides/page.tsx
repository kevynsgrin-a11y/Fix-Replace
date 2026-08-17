import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { PageHero } from "@/components/site/page-hero"
import { ApplianceGlyph } from "@/components/ui/appliance-glyph"
import { GUIDE_SLUGS } from "@/lib/page-data"
import {
  graphLd,
  organizationLd,
  websiteLd,
  breadcrumbLd,
  jsonLdScript,
} from "@/lib/json-ld"

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
    images: [
      {
        url: `${SITE}/og?type=guide&title=${encodeURIComponent("Appliance Repair Cost Guides")}&description=${encodeURIComponent("8 appliances · BLS & EIA data")}`,
        width: 1200,
        height: 630,
        alt: "Appliance repair cost guides",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
}

const SUBTITLES: Record<string, string> = {
  refrigerators: "Compressor, fan motor, thermostat, door seal",
  "washing-machines": "Bearings, drain pump, door boot seal",
  dishwashers: "Drain pump, control board, door latch",
  dryers: "Heating element, thermal fuse, motor",
  ranges: "Igniter, gas valve, surface element",
  "wall-ovens": "Bake element, control board, door gasket",
  microwaves: "Magnetron, door switch, turntable motor",
  "water-heaters": "Thermocouple, element, anode rod",
}

export default function CostGuidesHubPage() {
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    breadcrumbLd([
      { name: "Home", href: "/" },
      { name: "Cost guides", href: "/cost-guides" },
    ]),
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />

      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Cost guides" },
        ]}
        eyebrow="Cost guides"
        heading="Appliance repair cost guides"
        lede="Typical part-and-labor costs, brand-tier lifespans, and the repair-vs-replace rule for the eight major home appliances — built from BLS, EIA, and NAHB data."
        provenanceLine="Data reviewed July 19, 2026 · BLS OEWS 49-9031 · NAHB life-expectancy tables"
      />

      <Container className="py-12 lg:py-16">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE_SLUGS.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/cost-guides/${g.slug}`}
                className="group flex h-full items-start gap-4 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand)"
              >
                <span className="shrink-0 text-(--color-brand)">
                  <ApplianceGlyph category={g.category} size={40} />
                </span>
                <span className="min-w-0">
                  <span className="block text-(length:--text-base) font-semibold text-(--color-ink) group-hover:text-(--color-brand)">
                    {g.navLabel}
                  </span>
                  <span className="mt-1 block text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                    {SUBTITLES[g.slug]}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  )
}
