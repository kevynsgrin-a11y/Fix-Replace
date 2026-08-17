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

const SECTIONS = [
  {
    heading: "Results are estimates, not advice",
    body: "The repair-vs-replace verdict is a statistical estimate based on published national and regional data. It is not a professional inspection, an engineering assessment, or a guarantee of outcome. Your specific appliance, installer, and market conditions may differ.",
  },
  {
    heading: "No warranty on accuracy",
    body: "We maintain the underlying data and update it when sources publish new figures, but we cannot guarantee that cost ranges, lifespans, or labor rates are accurate for your specific situation. Always obtain real quotes before making a financial decision.",
  },
  {
    heading: "Affiliate links",
    body: "Some links on the site — particularly after the verdict and in cost guides — are referral links. We receive a commission if you make a purchase. These links are labelled and do not influence the calculator output or any editorial content.",
  },
  {
    heading: "Limitation of liability",
    body: "To the maximum extent permitted by law, RepairOrReplace.net is not liable for any financial loss, property damage, or other harm arising from reliance on information provided by this tool.",
  },
  {
    heading: "Changes to these terms",
    body: "We may update these terms at any time. Material changes will be reflected in the effective date below. Continued use of the site after a change constitutes acceptance of the revised terms.",
  },
]

export default function TermsPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Terms of use" }]}
        eyebrow="Legal"
        heading="Terms of use"
        lede="Results are estimates for informational purposes — not professional advice."
        provenanceLine="Effective July 1, 2026"
      />
      <Container>
        <main className="mx-auto max-w-[68ch] py-12 pb-24">
          <div className="flex flex-col gap-8">
            {SECTIONS.map((s) => (
              <section key={s.heading}>
                <h2 className="text-(length:--text-lg) font-semibold text-(--color-ink)">{s.heading}</h2>
                <p className="mt-2 text-(length:--text-base) leading-relaxed text-(--color-body)">{s.body}</p>
              </section>
            ))}
          </div>

          <p className="mt-12 text-(length:--text-xs) text-(--color-muted)">
            Questions?{" "}
            <Link href="/about" className="text-(--color-brand) underline decoration-1 underline-offset-2">
              Contact us via the about page.
            </Link>
          </p>
        </main>
      </Container>
    </>
  )
}
