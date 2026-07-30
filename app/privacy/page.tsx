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

export default function PrivacyPage() {
  const ldBc = breadcrumbList([
    { name: "Home", url: SITE },
    { name: "Privacy", url: `${SITE}/privacy` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationEntity(SITE)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBc) }} />

      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
        eyebrow="Privacy policy"
        title="We do not collect your data"
        lede="Short version: your inputs stay in your browser. Nothing is stored on our servers. No account, no email, no tracking."
        provenance="Last updated July 19, 2026"
      />

      <Container>
        <main className="mt-12 pb-24">
          <div className="mx-auto max-w-[72ch] space-y-10 text-(length:--text-sm) leading-relaxed text-(--color-muted)">

            {[
              {
                heading: "What we collect",
                body: "Nothing that identifies you. The calculator inputs you enter (appliance type, age, quote, metro) are sent to our server only to compute the verdict and are not stored. We do not use cookies for tracking. We do not have user accounts.",
              },
              {
                heading: "Shared results",
                body: "If you use the Share button, the result inputs and computed output are stored temporarily to generate a shareable link. This data is stored for 30 days and then deleted automatically. The link contains no personal information.",
              },
              {
                heading: "Server logs",
                body: "Our hosting provider (Vercel) retains standard HTTP access logs (IP address, request path, timestamp) for up to 30 days for security and abuse prevention. We do not join these logs to your calculator inputs.",
              },
              {
                heading: "Partner links",
                body: "Partner links at the bottom of result pages may set their own cookies when you click through to their sites. We are not responsible for third-party privacy practices. These links are clearly labelled and optional.",
              },
              {
                heading: "Analytics",
                body: "We use aggregate, anonymised page-view counts to understand which guides are read most. This data is not tied to individual users and contains no input data.",
              },
              {
                heading: "Your rights",
                body: "Because we do not store personal data, there is nothing to delete or export. If you have a question about a specific interaction, email privacy@repair-or-replace.net.",
              },
            ].map(({ heading, body }) => (
              <section key={heading}>
                <h2 className="mb-2 text-(length:--text-base) font-semibold text-(--color-ink)">{heading}</h2>
                <p>{body}</p>
              </section>
            ))}

          </div>
        </main>
      </Container>
    </>
  )
}
