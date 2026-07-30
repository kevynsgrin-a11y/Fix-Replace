import type { Metadata } from "next"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbList, organizationEntity } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export const metadata: Metadata = {
  title: "Privacy Policy — RepairOrReplace.net",
  description:
    "RepairOrReplace.net collects no personal data. Inputs stay in your browser session. No cookies, no analytics that track individuals, no data sold.",
  alternates: { canonical: `${SITE}/privacy` },
  openGraph: {
    title: "Privacy Policy — RepairOrReplace.net",
    description: "No personal data collected. Inputs stay in your browser session.",
    url: `${SITE}/privacy`,
    images: [{ url: `${SITE}/og?type=editorial&slug=privacy`, width: 1200, height: 630, alt: "Privacy policy" }],
  },
  twitter: { card: "summary_large_image" },
}
