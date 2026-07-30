import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd, breadcrumbList, webPage } from "@/lib/json-ld"
import { getAllMetros } from "@/lib/page-data"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { MultiplierDial } from "@/components/metro/multiplier-dial"

const TITLE = "Appliance repair labor rates by metro"
const DESCRIPTION =
  "Appliance repair labor rates for 22 US metro markets, benchmarked against the $24.10/hr national mean from BLS OEWS 49-9031. Find your city's multiplier."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/local-costs" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/local-costs",
    images: [
      {
        url: `/og?kind=metro&title=${encodeURIComponent("Repair labor rates by metro")}&sub=${encodeURIComponent("22 markets · BLS OEWS 49-9031")}`,
        width: 1200,
        height: 630,
        alt: "Appliance repair labor rates by US metro market",
      },
    ],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}
