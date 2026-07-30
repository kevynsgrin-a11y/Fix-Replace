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

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
        eyebrow="About"
        heading="Why this tool exists"
        lede="One question — repair or replace? — deserves a straight answer grounded in real data, not a sales funnel."
      />
      <Container>
        <main className="mx-auto max-w-[68ch] py-12 pb-24">
          <div className="flex flex-col gap-8 text-(length:--text-base) leading-relaxed text-(--color-body)">
            <p>
              RepairOrReplace.net runs net-present-cost math on your appliance situation and tells you which option costs less over the remaining useful life. It uses real data from the Bureau of Labor Statistics, the Energy Information Administration, and NAHB housing surveys — not invented averages or affiliate-padded estimates.
            </p>
            <p>
              There are no ads, no email walls, no partner links above the analysis, and no data captured. Your inputs stay in your browser session and are discarded when you close the tab.
            </p>
            <p>
              Partner links appear after the verdict, clearly labelled, so you can act on the recommendation if you choose. They never influence the calculation. The model would recommend repair even if every partner link on the page were a retailer selling replacements.
            </p>
            <p>
              The methodology is fully open. Every formula, data source, and assumption is documented at{" "}
              <Link href="/methodology" className="text-(--color-brand) underline decoration-1 underline-offset-2 hover:text-(--color-brand-strong)">/methodology</Link>
              . If you find an error, the contact information is in the footer.
            </p>
          </div>
        </main>
      </Container>
    </>
  )
}
