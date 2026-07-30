import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { PageHero } from "@/components/site/page-hero"
import { ApplianceGlyph } from "@/components/ui/appliance-glyph"
import { GUIDE_SLUGS } from "@/lib/page-data"
import { graphLd, organizationLd, websiteLd, breadcrumbLd, jsonLdScript } from "@/lib/json-ld"

const SITE = "https://repair-or-replace.net"

export const metadata: Metadata = {
  title: "Appliance Repair Cost Guides — RepairOrReplace",
  description:
    "Typical repair costs for 8 major appliances — refrigerator, washer, dishwasher, dryer, range, wall oven, microwave, and water heater. Real data from BLS, EIA, and NAHB.",
  alternates: { canonical: `${SITE}/cost-guides` },
  openGraph: {
    title: "Appliance Repair Cost Guides — RepairOrReplace",
    description: "Typical repair costs for 8 major appliances. Real data, no guesswork.",
    url: `${SITE}/cost-guides`,
    images: [{ url: `${SITE}/og?type=guide&title=${encodeURIComponent("Appliance Repair Cost Guides")}&description=${encodeURIComponent("8 appliances · BLS & EIA data")}`, width: 1200, height: 630, alt: "Appliance repair cost guides" }],
  },
  twitter: { card: "summary_large_image" },
}
