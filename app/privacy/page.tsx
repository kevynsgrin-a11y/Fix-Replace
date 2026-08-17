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

const SECTIONS = [
  {
    heading: "What we collect",
    body: "Nothing. The calculator inputs you enter — appliance type, age, repair quote — are processed in your browser and on our servers to generate a result. They are not stored, logged, or associated with any identifier.",
  },
  {
    heading: "Cookies and tracking",
    body: "We do not set cookies for advertising or individual tracking. We use aggregate, anonymized analytics to understand which pages are visited and whether the site is performing correctly. No personal identifier is captured.",
  },
  {
    heading: "Shareable result links",
    body: "If you use the share feature, your inputs are encoded in the URL itself. We do not store the result server-side — the link is self-contained. Anyone with the URL can see your inputs and result, so share only with people you intend to.",
  },
  {
    heading: "Third-party links",
    body: "Cost guides and the verdict page may link to retailers and service providers. We receive referral commissions on some of these links. Those links are clearly labelled and never influence the repair-vs-replace calculation.",
  },
  {
    heading: "Contact",
    body: "Questions about this policy can be sent to the contact address in the footer. We will respond within 5 business days.",
  },
]

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
        eyebrow="Legal"
        heading="Privacy policy"
        lede="We collect no personal data. Your inputs stay in your browser session."
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
        </main>
      </Container>
    </>
  )
}
