import type { Metadata } from "next"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbList, organizationEntity } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export const metadata: Metadata = {
  title: "Appliance Recall Check — Federal Recall Resources",
  description:
    "Check any appliance for an open federal recall. Direct links to CPSC SaferProducts.gov, Recalls.gov, and manufacturer lookup tools. No account required.",
  alternates: { canonical: `${SITE}/recalls` },
  openGraph: {
    title: "Appliance Recall Check",
    description: "Check any appliance for an open federal recall via CPSC SaferProducts.gov and Recalls.gov.",
    url: `${SITE}/recalls`,
    images: [{ url: `${SITE}/og?type=editorial&slug=recalls`, width: 1200, height: 630, alt: "Appliance recall check resources" }],
  },
  twitter: { card: "summary_large_image" },
}

const RECALL_RESOURCES = [
  {
    name: "CPSC SaferProducts.gov",
    description: "The official U.S. Consumer Product Safety Commission recall database. Search by product type, brand, or model number. Includes all recalls since 2011.",
    href: "https://www.saferproducts.gov/",
    note: "Free · No account required",
  },
  {
    name: "Recalls.gov",
    description: "Multi-agency portal combining CPSC, FDA, NHTSA, and USDA recalls. Useful when you are unsure which agency governs your appliance.",
    href: "https://www.recalls.gov/",
    note: "Free · Covers appliances, vehicles, food, medications",
  },
  {
    name: "CPSC recall search (direct)",
    description: "Direct search on recalls.cpsc.gov — faster for appliance-specific lookups. You can filter by category, year, and hazard type.",
    href: "https://www.cpsc.gov/Recalls",
    note: "Free · Filterable by hazard type",
  },
  {
    name: "CPSC email alerts",
    description: "Subscribe to receive recall notices by product category. Useful if you want to be notified when a recall is issued for your appliance type.",
    href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Recall-Guidance/Recall-Firm-Responsibilities",
    note: "Free subscription available",
  },
]
