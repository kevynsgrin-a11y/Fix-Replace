import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { PageHero } from "@/components/site/page-hero"
import { ApplianceGlyph } from "@/components/ui/appliance-glyph"
import { GUIDE_SLUGS, type GuideSlug } from "@/lib/page-data"
import { ORG_SCHEMA, WEBSITE_SCHEMA, breadcrumbSchema } from "@/lib/json-ld"

const SITE = "https://repair-or-replace.net"

const GUIDE_LABELS: Record<GuideSlug, { title: string; sub: string }> = {
  "refrigerator":    { title: "Refrigerator",    sub: "Compressor, fan motor, thermostat" },
  "washing-machine": { title: "Washing Machine",  sub: "Bearings, pump, door boot seal" },
  "dishwasher":      { title: "Dishwasher",       sub: "Drain pump, control board, door latch" },
  "dryer":           { title: "Dryer",            sub: "Heating element, thermal fuse, motor" },
  "range":           { title: "Range",            sub: "Igniter, gas valve, surface element" },
  "wall-oven":       { title: "Wall Oven",        sub: "Bake element, control board, door gasket" },
  "microwave":       { title: "Microwave",        sub: "Magnetron, door switch, turntable motor" },
  "water-heater":    { title: "Water Heater",     sub: "Thermocouple, element, anode rod" },
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
        breadcrumbs={[{ label: "Cost guides" }]}
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
