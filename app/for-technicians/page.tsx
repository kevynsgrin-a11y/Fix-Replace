import type { Metadata } from "next"
import Link from "next/link"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbList, organizationEntity } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export const metadata: Metadata = {
  title: "For Appliance Repair Professionals — RepairOrReplace.net",
  description:
    "Hand a customer a link to their result. Reference our cost guides in your estimates. Technicians, inspectors, and service companies — here is how to use this tool professionally.",
  alternates: { canonical: `${SITE}/for-technicians` },
  openGraph: {
    title: "For Appliance Repair Professionals",
    description: "How technicians, home inspectors, and service companies can use RepairOrReplace.net with customers.",
    url: `${SITE}/for-technicians`,
    images: [{ url: `${SITE}/og?type=editorial&slug=for-pros`, width: 1200, height: 630, alt: "RepairOrReplace.net for appliance repair professionals" }],
  },
  twitter: { card: "summary_large_image" },
}
