import type { Metadata } from "next"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbLd, organizationLd, websiteLd, graphLd, jsonLdScript } from "@/lib/json-ld"
import { SITE_URL, ogImageUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: "Data Sources & Methodology — RepairOrReplace",
  description:
    "Every data source, update schedule, and assumption behind RepairOrReplace. BLS OEWS, EIA RECS, NAHB, InterNACHI, CPSC — all cited with direct links.",
  alternates: { canonical: `${SITE_URL}/methodology` },
  openGraph: {
    title: "Data Sources & Methodology",
    description: "Full source table and update schedule for every data input used in the repair-vs-replace calculator.",
    url: `${SITE_URL}/methodology`,
    images: [
      {
        url: ogImageUrl({
          type: "editorial",
          title: "Where every number comes from",
          description: "BLS, EIA, NAHB, InterNACHI and CPSC — every input cited and dated.",
        }),
        width: 1200,
        height: 630,
        alt: "RepairOrReplace methodology and data sources",
      },
    ],
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
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    breadcrumbLd([{ name: "Home", href: "/" }, { name: "Methodology", href: "/methodology" }]),
  )
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Methodology" }]}
        eyebrow="Data sources"
        heading="Where every number comes from"
        lede="We cite every data point. If a source updates, the model updates. Nothing is invented."
        provenanceLine="Last reviewed July 19, 2026"
      />
      <Container>
        <div className="py-12 pb-24">
          {/* Responsive source table: stacks below 700 px */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-(length:--text-sm)">
              <thead>
                <tr className="border-b border-(--color-line) text-left text-(length:--text-xs) font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                  <th className="pb-3 pr-6">What it powers</th>
                  <th className="pb-3 pr-6">Source</th>
                  <th className="pb-3 pr-6">Used for</th>
                  <th className="pb-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((row) => (
                  <tr key={row.label} className="border-b border-(--color-line) align-top">
                    <td className="py-4 pr-6 font-medium text-(--color-ink)">{row.label}</td>
                    <td className="py-4 pr-6 text-(--color-body)">
                      <a href={row.link} className="text-(--color-brand) underline decoration-1 underline-offset-2 hover:text-(--color-brand-strong)" target="_blank" rel="noopener noreferrer">
                        {row.source}
                      </a>
                    </td>
                    <td className="py-4 pr-6 text-(--color-body)">{row.used}</td>
                    <td className="py-4 text-(--color-muted)">{row.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked version visible only below 700 px */}
          <dl className="mt-0 flex flex-col gap-6 [display:none] max-[700px]:[display:flex]">
            {SOURCES.map((row) => (
              <div key={row.label} className="rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-4">
                <dt className="font-semibold text-(--color-ink)">{row.label}</dt>
                <dd className="mt-1 text-(length:--text-sm) text-(--color-body)">
                  <a href={row.link} className="text-(--color-brand) underline" target="_blank" rel="noopener noreferrer">{row.source}</a>
                </dd>
                <dd className="mt-1 text-(length:--text-xs) text-(--color-muted)">{row.used}</dd>
                <dd className="mt-1 text-(length:--text-xs) text-(--color-muted)">{row.updated}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </>
  )
}
