import type { Metadata } from "next"
import type { ReactNode } from "react"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbLd, organizationLd, websiteLd, graphLd, jsonLdScript } from "@/lib/json-ld"
import { ORG, ORG_ADDRESS_LINE, SITE_URL, ogImageUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "RepairOrReplace does not sell your data or build profiles. Calculator inputs stay in your session, no tracking cookies are set, and no analytics scripts load at all.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: "Privacy Policy — RepairOrReplace",
    description: "No tracking cookies, no analytics scripts, no data sold. Your calculator inputs stay in your session.",
    url: `${SITE_URL}/privacy`,
    images: [
      {
        url: ogImageUrl({
          type: "editorial",
          title: "Privacy Policy",
          description: "No tracking cookies, no analytics scripts, no data sold.",
        }),
        width: 1200,
        height: 630,
        alt: "Privacy policy",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
}

const SECTIONS: { heading: string; body: ReactNode }[] = [
  {
    heading: "What we collect",
    body: "Nothing that identifies you. The calculator inputs you enter — appliance type, age, repair quote — are processed in your browser and on our servers to generate a result. They are not stored, logged, or associated with any identifier. There is one narrow exception, and it is not about your inputs: to stop automated abuse, the calculator API holds the IP address a request arrives from in server memory for up to one minute, purely as a request counter. That address is never written to disk, never linked to your inputs, and never used to build a profile of you.",
  },
  {
    heading: "Cookies and tracking",
    body: "We do not set cookies for advertising or individual tracking. The site loads no analytics or tracking scripts at all — nothing measures you across pages, sessions, or visits. If we ever add privacy-respecting, aggregate analytics, we will update this policy before turning them on.",
  },
  {
    heading: "Shareable result links",
    body: "Sharing a result is switched off in the current build. The endpoint that would save a result returns an error for every request, so no result is stored and no share link can be created today. When the feature does ship it will work like this: your result is saved on our servers under a random identifier, and the link carries only that identifier — not your inputs. Anyone holding the link could then load the saved result, so it would be worth sharing only with people you intend to. We will update this policy with the retention period before turning it on.",
  },
  {
    heading: "Third-party links",
    body: "Some of the links in the block that appears after your verdict on the result page are referral links, and we receive a commission if you buy through one. Those links are clearly labelled and never influence the repair-vs-replace calculation. The cost guides and the rest of the editorial pages carry no referral links at all — their outbound links point to sources such as the NAHB, SaferProducts.gov and Recalls.gov, and we earn nothing from them.",
  },
  {
    heading: "Contact",
    body: (
      <>
        This site is operated by {ORG.legalName}. Questions about this policy can be sent to{" "}
        <a href={`mailto:${ORG.email}`} className="text-(--color-brand) underline decoration-1 underline-offset-2">
          {ORG.email}
        </a>{" "}
        or by post to {ORG.legalName}, {ORG_ADDRESS_LINE}. We will respond within 5 business days.
      </>
    ),
  },
]

export default function PrivacyPage() {
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    breadcrumbLd([{ name: "Home", href: "/" }, { name: "Privacy", href: "/privacy" }]),
  )
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
        eyebrow="Legal"
        heading="Privacy policy"
        lede="No tracking cookies, no analytics scripts, no data sold. Your inputs stay in your session."
        provenanceLine="Effective July 1, 2026"
      />
      <Container>
        <div className="mx-auto max-w-[68ch] py-12 pb-24">
          <div className="flex flex-col gap-8">
            {SECTIONS.map((s) => (
              <section key={s.heading}>
                <h2 className="text-(length:--text-lg) font-semibold text-(--color-ink)">{s.heading}</h2>
                <p className="mt-2 text-(length:--text-base) leading-relaxed text-(--color-body)">{s.body}</p>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </>
  )
}
