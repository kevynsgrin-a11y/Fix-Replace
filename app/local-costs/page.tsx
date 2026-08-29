import type { Metadata } from "next"
import Link from "next/link"
import {
  graphLd,
  organizationLd,
  websiteLd,
  breadcrumbLd,
  jsonLdScript,
} from "@/lib/json-ld"
import { getMetroHubData } from "@/lib/page-data"
import { SITE_URL, ogImageUrl } from "@/lib/site"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"

const TITLE = "Appliance repair labor rates by metro"
const DESCRIPTION =
  "Appliance repair labor rates for major US metro markets, benchmarked against the national mean from BLS OEWS 49-9031. Find your city's multiplier."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/local-costs` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/local-costs`,
    images: [
      {
        url: ogImageUrl({
          type: "metro",
          title: "Repair labor rates by metro",
          description: "BLS OEWS 49-9031",
        }),
        width: 1200,
        height: 630,
        alt: "Appliance repair labor rates by US metro market",
      },
    ],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}

export default function LocalCostsHubPage() {
  const metros = getMetroHubData()
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    breadcrumbLd([
      { name: "Home", href: "/" },
      { name: "Local costs", href: "/local-costs" },
    ]),
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />

      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Local costs" },
        ]}
        eyebrow="Local labor costs"
        heading="Appliance repair labor rates by metro"
        lede="Repair bills are mostly labor, and technician wages vary widely by market. These are the mean hourly rates for major US metros, each with a multiplier applied to the national baseline cost."
        provenanceLine="BLS OEWS 49-9031 · Mean hourly wage survey · Data reviewed July 19, 2026"
      />

      <Container className="py-12 lg:py-16">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metros.map((m) => {
            const pct = Math.round((m.multiplier - 1) * 100)
            const above = m.multiplier >= 1
            return (
              <li key={m.slug}>
                <Link
                  href={`/local-costs/${m.slug}`}
                  className="group flex h-full flex-col rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand)"
                >
                  <span className="text-(length:--text-base) font-semibold text-(--color-ink) group-hover:text-(--color-brand)">
                    {m.shortName}
                  </span>
                  <span className="mt-3 flex items-baseline gap-2">
                    <span className="text-(length:--text-2xl) font-semibold tabular-nums text-(--color-ink)">
                      ${m.wage.toFixed(2)}
                    </span>
                    <span className="text-(length:--text-xs) text-(--color-muted)">/hr mean</span>
                  </span>
                  <span className="mt-1 text-(length:--text-xs) text-(--color-muted)">
                    {m.multiplier.toFixed(2)}× national · {above ? "+" : ""}
                    {pct}% {above ? "above" : "below"} mean
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Container>
    </>
  )
}
