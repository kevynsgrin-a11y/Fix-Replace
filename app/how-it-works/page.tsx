import type { Metadata } from "next"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { jsonLd, breadcrumbList, organizationEntity } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export const metadata: Metadata = {
  title: "How RepairOrReplace.net Works — The Math Behind the Verdict",
  description:
    "Net-present cost, Weibull reliability, and BLS labor data combined into one honest repair-vs-replace answer. Read the formulas, assumptions, and data sources.",
  alternates: { canonical: `${SITE}/how-it-works` },
  openGraph: {
    title: "How RepairOrReplace.net Works",
    description: "The net-present cost math, Weibull reliability model, and BLS data behind every verdict.",
    url: `${SITE}/how-it-works`,
    images: [{ url: `${SITE}/og?type=editorial&slug=how-it-works`, width: 1200, height: 630, alt: "How RepairOrReplace.net works" }],
  },
  twitter: { card: "summary_large_image" },
}
