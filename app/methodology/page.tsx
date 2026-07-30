import type { Metadata } from "next"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbList, organizationEntity } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export const metadata: Metadata = {
  title: "Data Sources & Methodology — RepairOrReplace.net",
  description:
    "Every data source, update schedule, and assumption behind RepairOrReplace.net. BLS OEWS, EIA RECS, NAHB, InterNACHI, CPSC — all cited with direct links.",
  alternates: { canonical: `${SITE}/methodology` },
  openGraph: {
    title: "Data Sources & Methodology",
    description: "Full source table and update schedule for every data input used in the repair-vs-replace calculator.",
    url: `${SITE}/methodology`,
    images: [{ url: `${SITE}/og?type=editorial&slug=methodology`, width: 1200, height: 630, alt: "RepairOrReplace.net methodology and data sources" }],
  },
  twitter: { card: "summary_large_image" },
}

const SOURCES = [
  {
    label: "Appliance lifespans",
    source: "NAHB / Bank of America Home Equity Study",
    used: "Weibull scale (η) calibration; median expected life by category",
    updated: "Study vintage 2007; corroborated against InterNACHI 2023",
    link: "https://www.nahb.org/advocacy/industry-news/2007/10/Study-Examines-How-Long-Building-Products-Last",
  },
  {
    label: "Inspection benchmarks",
    source: "InterNACHI Standards of Practice",
    used: "Cross-check on NAHB lifespans; failure-mode catalogue",
    updated: "Reviewed 2023",
    link: "https://www.internachi.org/training/articles/appliance-life-expectancy/",
  },
  {
    label: "Labor wages",
    source: "BLS Occupational Employment and Wage Statistics (OEWS) SOC 49-9031",
    used: "National mean $24.10/hr; metro multipliers for 22 markets",
    updated: "May 2023 release (published April 2024)",
    link: "https://www.bls.gov/oes/current/oes499031.htm",
  },
  {
    label: "Residential electricity & gas rates",
    source: "EIA Residential Energy Consumption Survey (RECS) + Form EIA-861",
    used: "Annual energy spend per appliance; per-state electricity and gas rates",
    updated: "RECS 2020; Form EIA-861 2022",
    link: "https://www.eia.gov/consumption/residential/",
  },
  {
    label: "Replacement cost indices",
    source: "BLS Consumer Price Index — Household appliances (series CUUR0000SEHG)",
    used: "Nominal replacement cost by appliance category, adjusted for inflation",
    updated: "Through April 2026",
    link: "https://data.bls.gov/timeseries/CUUR0000SEHG",
  },
  {
    label: "Recall data",
    source: "CPSC SaferProducts.gov / Recalls.gov API",
    used: "UPC-to-recall lookup when user provides a serial/UPC number",
    updated: "Live — queried at request time",
    link: "https://www.saferproducts.gov/",
  },
  {
    label: "ENERGY STAR baselines",
    source: "EPA ENERGY STAR Certified Products database",
    used: "New-unit energy consumption for efficiency delta calculation",
    updated: "Snapshot June 2026",
    link: "https://www.energystar.gov/productfinder/",
  },
]

export default function MethodologyPage() {
  const ldBc = breadcrumbList([
    { name: "Home", url: SITE },
    { name: "Methodology", url: `${SITE}/methodology` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationEntity(SITE)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBc) }} />

      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Methodology" }]}
        eyebrow="Data sources"
        title="Where every number comes from"
        lede="We cite every data point. If a source updates, the model updates. Nothing is invented."
        provenance="Last reviewed July 19, 2026"
      />

      <Container asChild>
        <main className="mt-12 pb-24">
          <div className="mx-auto max-w-[90ch]">

            {/* Source table — stacks into labelled blocks below 700px */}
            <div
              role="table"
              aria-label="Data sources"
              className="space-y-0 rounded-(--radius-lg) border border-(--color-line) overflow-hidden"
            >
              {/* Header row — hidden below 700px */}
              <div
                role="row"
                aria-hidden
                className="hidden grid-cols-[1fr_2fr_1fr_auto] gap-4 border-b border-(--color-line) bg-(--color-surface-2) px-5 py-3 text-(length:--text-xs) font-semibold uppercase tracking-[0.1em] text-(--color-muted) [display:none] min-[700px]:[display:grid]"
              >
                <div role="columnheader">Data point</div>
                <div role="columnheader">Source</div>
                <div role="columnheader">Used for</div>
                <div role="columnheader">Link</div>
              </div>

              {SOURCES.map((row, i) => (
                <div
                  key={row.label}
                  role="row"
                  className={`flex flex-col gap-1 border-b border-(--color-line) px-5 py-4 last:border-b-0 min-[700px]:grid min-[700px]:grid-cols-[1fr_2fr_1fr_auto] min-[700px]:items-center min-[700px]:gap-4 ${i % 2 === 1 ? "bg-(--color-surface-2)" : "bg-(--color-surface)"}`}
                >
                  {/* mobile label */}
                  <div role="cell" className="text-(length:--text-sm) font-semibold text-(--color-ink)">
                    {row.label}
                  </div>
                  <div role="cell" className="text-(length:--text-sm) text-(--color-muted)">
                    <span className="font-medium text-(--color-ink) min-[700px]:hidden">Source: </span>
                    {row.source}
                    {row.updated && (
                      <span className="mt-0.5 block text-(length:--text-xs) text-(--color-muted)/70">
                        Updated: {row.updated}
                      </span>
                    )}
                  </div>
                  <div role="cell" className="text-(length:--text-sm) text-(--color-muted)">
                    <span className="font-medium text-(--color-ink) min-[700px]:hidden">Used for: </span>
                    {row.used}
                  </div>
                  <div role="cell">
                    <a
                      href={row.link}
                      target="_blank"
                      rel="noreferrer"
                      className="whitespace-nowrap text-(length:--text-xs) font-medium text-(--color-brand) underline underline-offset-2 hover:text-(--color-brand-ink)"
                    >
                      Source &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 space-y-6">
              <h2 className="text-(length:--text-xl) font-semibold text-(--color-ink)">Update policy</h2>
              <p className="text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                BLS OEWS is published annually (typically April). EIA RECS is published
                every four to five years; Form EIA-861 is annual. NAHB lifespan data has
                not been updated since 2007; we cross-reference against InterNACHI&apos;s
                inspection standards (reviewed 2023) and flag any category where the two
                sources diverge by more than two years.
              </p>
              <p className="text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                If you notice a data error or have a more recent source, email{" "}
                <a href="mailto:data@repair-or-replace.net" className="text-(--color-brand) underline underline-offset-2 hover:text-(--color-brand-ink)">
                  data@repair-or-replace.net
                </a>.
                We review and respond to every source suggestion.
              </p>
              <p className="text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                For the model formulas and confidence scoring logic, see{" "}
                <a href="/how-it-works" className="text-(--color-brand) underline underline-offset-2 hover:text-(--color-brand-ink)">
                  How it works
                </a>.
              </p>
            </div>

          </div>
        </main>
      </Container>
    </>
  )
}
