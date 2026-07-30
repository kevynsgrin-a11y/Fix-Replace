import type { Metadata } from "next"
import Link from "next/link"
import { getAllMetroData } from "@/lib/page-data"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { jsonLd, breadcrumbList, organizationEntity } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export const metadata: Metadata = {
  title: "Local Appliance Repair Rates by Metro Area",
  description:
    "BLS OEWS 49-9031 labor rates for six major metros. Compare what technicians charge in New York, LA, Chicago, Boston, Miami, and Minneapolis vs the $24.10/hr national mean.",
  alternates: { canonical: `${SITE}/local-rates` },
  openGraph: {
    title: "Local Appliance Repair Rates by Metro Area",
    description:
      "BLS OEWS 49-9031 labor rates for six major metros — updated 2026.",
    url: `${SITE}/local-rates`,
    images: [
      {
        url: `${SITE}/og?type=hub&hub=local-rates`,
        width: 1200,
        height: 630,
        alt: "Local appliance repair labor rates by metro area",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
}

export default function LocalRatesHub() {
  const metros = getAllMetroData()

  const ldBc = breadcrumbList([
    { name: "Home", url: SITE },
    { name: "Local rates", url: `${SITE}/local-rates` },
  ])

  const repairWins = metros.filter((m) => m.multiplier < 1)
  const repairLoses = metros.filter((m) => m.multiplier >= 1)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationEntity(SITE)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBc) }}
      />

      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Local rates" }]}
        eyebrow="Labor markets"
        title="What technicians charge in your city"
        lede="Labor is the biggest variable in any repair quote. These rates come directly from BLS OEWS 49-9031 (appliance repair workers) — the same source we use when you enter your metro in the calculator."
        provenance="Data: BLS OEWS 49-9031 · May 2023 release · National mean $24.10/hr"
      />

      <Container asChild>
        <main className="mt-12 pb-24">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...repairLoses, ...repairWins].map((metro) => {
              const above = metro.multiplier >= 1
              const pct = Math.abs((metro.multiplier - 1) * 100).toFixed(0)
              return (
                <Link
                  key={metro.slug}
                  href={`/local-rates/${metro.slug}`}
                  className="group flex flex-col gap-2 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand) hover:bg-(--color-surface-2) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand)"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-(length:--text-base) font-semibold text-(--color-ink)">
                      {metro.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-(length:--text-xs) font-semibold ${
                        above
                          ? "bg-(--color-replace-subtle) text-(--color-replace)"
                          : "bg-(--color-repair-subtle) text-(--color-repair)"
                      }`}
                    >
                      {above ? "+" : "-"}{pct}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="readout text-(length:--text-2xl) font-semibold text-(--color-ink)">
                      ${metro.ratePerHour.toFixed(2)}
                    </span>
                    <span className="text-(length:--text-xs) text-(--color-muted)">/hr mean</span>
                  </div>
                  <p className="text-(length:--text-xs) text-(--color-muted)">
                    {metro.multiplier.toFixed(2)}× national avg ·{" "}
                    {above ? "above" : "below"} the $24.10/hr baseline
                  </p>
                  <span className="mt-1 text-(length:--text-xs) font-medium text-(--color-brand) transition-colors group-hover:text-(--color-brand-ink)">
                    See local cost ranges &rarr;
                  </span>
                </Link>
              )
            })}
          </div>

          {/* national context */}
          <div className="mt-12 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface-2) p-6">
            <h2 className="text-(length:--text-base) font-semibold text-(--color-ink)">
              Why labor rates vary
            </h2>
            <p className="mt-2 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
              BLS groups appliance repair workers under SOC 49-9031. Wages reflect
              local cost of living, union density, and technician supply — not
              service quality. The calculator multiplies every labor-hour estimate
              by the metro&apos;s multiplier relative to the $24.10/hr national mean,
              so a $260 Chicago quote implies different labor content than the same
              dollar figure in Miami.{" "}
              <a
                href="https://www.bls.gov/oes/current/oes499031.htm"
                target="_blank"
                rel="noreferrer"
                className="text-(--color-brand) underline underline-offset-2 hover:text-(--color-brand-ink)"
              >
                Full BLS OEWS table &rarr;
              </a>
            </p>
          </div>
        </main>
      </Container>
    </>
  )
}
