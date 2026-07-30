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

export default function TermsPage() {
  const ldBc = breadcrumbList([
    { name: "Home", url: SITE },
    { name: "Terms", url: `${SITE}/terms` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationEntity(SITE)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBc) }} />

      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Terms" }]}
        eyebrow="Terms of use"
        title="Estimates, not advice"
        lede="RepairOrReplace.net produces statistical estimates based on public data. It does not inspect your appliance and cannot replace a qualified technician."
        provenance="Last updated July 19, 2026"
      />

      <Container>
        <main className="mt-12 pb-24">
          <div className="mx-auto max-w-[72ch] space-y-10 text-(length:--text-sm) leading-relaxed text-(--color-muted)">

            {[
              {
                heading: "Informational use only",
                body: "The output of this calculator is an estimate for informational purposes only. It is not professional appliance repair advice, engineering analysis, or a safety inspection. Always consult a qualified, licensed technician before making decisions involving gas lines, electrical systems, or refrigerant handling.",
              },
              {
                heading: "Accuracy",
                body: "We maintain our data diligently, but repair costs vary by region, technician, and part availability. The estimates shown may not reflect current market conditions in your area. We make no warranty that any output is accurate, complete, or current.",
              },
              {
                heading: "Safety",
                body: "The safety warnings shown in results are general guidance derived from component classifications, not an assessment of your specific situation. A gas leak, electrical fault, or refrigerant release is a safety emergency — contact a licensed professional immediately and do not attempt DIY repair.",
              },
              {
                heading: "Partner links",
                body: "Partner links are labelled and optional. We are not responsible for the products, pricing, or service quality of any linked company. Clicking a partner link does not constitute an endorsement.",
              },
              {
                heading: "Recall information",
                body: "Recall data is sourced from the CPSC SaferProducts database. We do not guarantee that all active recalls are captured or that the data is current at the moment you use the tool. Always verify directly with the CPSC at saferproducts.gov.",
              },
              {
                heading: "Limitation of liability",
                body: "To the maximum extent permitted by applicable law, RepairOrReplace.net and its operators shall not be liable for any damages arising from your use of, or reliance on, the estimates produced by this tool.",
              },
              {
                heading: "Contact",
                body: "Questions about these terms: legal@repair-or-replace.net.",
              },
            ].map(({ heading, body }) => (
              <section key={heading}>
                <h2 className="mb-2 text-(length:--text-base) font-semibold text-(--color-ink)">{heading}</h2>
                <p>{body}</p>
              </section>
            ))}

            <p>
              See also:{" "}
              <Link href="/privacy" className="text-(--color-brand) underline underline-offset-2">Privacy policy</Link>{" "}
              &middot;{" "}
              <Link href="/methodology" className="text-(--color-brand) underline underline-offset-2">Methodology</Link>
            </p>

          </div>
        </main>
      </Container>
    </>
  )
}
