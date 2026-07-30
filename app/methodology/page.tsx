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
