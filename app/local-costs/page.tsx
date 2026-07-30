import type { Metadata } from "next"
import Link from "next/link"
import { graphLd, organizationLd, websiteLd, breadcrumbLd, jsonLdScript } from "@/lib/json-ld"
import { getMetroHubData, NATIONAL_MEAN_WAGE } from "@/lib/page-data"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { MultiplierDial } from "@/components/metro/multiplier-dial"

const SITE = "https://repair-or-replace.net"
const TITLE = "Appliance repair labor rates by metro"
const DESCRIPTION =
  "Appliance repair labor costs for 6 US metro markets, benchmarked against the $24.10/hr national mean from BLS OEWS 49-9031. Find your city's multiplier."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE}/local-costs` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE}/local-costs`,
    images: [{ url: `${SITE}/og?type=metro&title=${encodeURIComponent("Repair labor by metro")}&description=${encodeURIComponent("6 markets · BLS OEWS 49-9031")}`, width: 1200, height: 630, alt: "Appliance repair labor rates by metro" }],
  },
  twitter: { card: "summary_large_image" },
}

export default function LocalCostsHubPage() {
  const metros = getMetroHubData()
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    breadcrumbLd([{ name: "Home", href: "/" }, { name: "Local costs", href: "/local-costs" }]),
  )
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Local costs" }]}
        eyebrow="Labor rates"
        heading="Appliance repair costs by metro"
        lede={`Labor is the largest variable in any repair bill. These ${metros.length} markets are benchmarked against the $${NATIONAL_MEAN_WAGE.toFixed(2)}/hr national mean from BLS OEWS 49-9031.`}
        provenanceLine="BLS OEWS 49-9031 May 2023 release · reviewed July 19, 2026"
      />
      <Container>
        <main className="py-12 pb-24">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metros.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/local-costs/${m.slug}`}
                  className="group flex flex-col gap-4 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand) hover:bg-(--color-surface-2)"
                >
                  <div>
                    <p className="font-semibold text-(--color-ink)">{m.shortName}</p>
                    <p className="mt-0.5 text-(length:--text-xs) text-(--color-muted)">{m.name}</p>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <MultiplierDial multiplier={m.multiplier} size={56} />
                    <div className="text-right">
                      <p className="text-(length:--text-xl) font-semibold tabular-nums text-(--color-ink)">
                        ${m.wage.toFixed(2)}<span className="text-(length:--text-xs) font-normal text-(--color-muted)">/hr</span>
                      </p>
                      <p className="text-(length:--text-xs) text-(--color-muted)">BLS mean wage</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </main>
      </Container>
    </>
  )
}
