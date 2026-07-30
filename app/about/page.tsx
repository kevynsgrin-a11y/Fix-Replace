import type { Metadata } from "next"
import Link from "next/link"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbList, organizationEntity } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export const metadata: Metadata = {
  title: "About RepairOrReplace.net — Why This Tool Exists",
  description:
    "RepairOrReplace.net is a free, ad-free, independent decision tool built to answer one question honestly. No affiliate links above the analysis. No data captured.",
  alternates: { canonical: `${SITE}/about` },
  openGraph: {
    title: "About RepairOrReplace.net",
    description: "A free, independent repair-vs-replace calculator with no sign-up wall, no ads, and no lead capture.",
    url: `${SITE}/about`,
    images: [{ url: `${SITE}/og?type=editorial&slug=about`, width: 1200, height: 630, alt: "About RepairOrReplace.net" }],
  },
  twitter: { card: "summary_large_image" },
}
