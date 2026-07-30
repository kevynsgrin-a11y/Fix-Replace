import type { Metadata } from "next"
import Link from "next/link"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbList, organizationEntity } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export const metadata: Metadata = {
  title: "Terms of Use — RepairOrReplace.net",
  description:
    "RepairOrReplace.net provides estimates, not professional advice. Results are for informational purposes. Read the full terms before relying on any output.",
  alternates: { canonical: `${SITE}/terms` },
  openGraph: {
    title: "Terms of Use — RepairOrReplace.net",
    description: "Results are estimates for informational purposes, not professional appliance repair advice.",
    url: `${SITE}/terms`,
    images: [{ url: `${SITE}/og?type=editorial&slug=terms`, width: 1200, height: 630, alt: "Terms of use" }],
  },
  twitter: { card: "summary_large_image" },
}
