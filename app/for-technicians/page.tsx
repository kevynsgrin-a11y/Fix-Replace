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
  alternates: { canonical: `${SITE}/for-pros` },
  openGraph: {
    title: "For Appliance Repair Professionals",
    description: "How technicians, home inspectors, and service companies can use RepairOrReplace.net with customers.",
    url: `${SITE}/for-pros`,
    images: [{ url: `${SITE}/og?type=editorial&slug=for-pros`, width: 1200, height: 630, alt: "RepairOrReplace.net for appliance repair professionals" }],
  },
  twitter: { card: "summary_large_image" },
}

export default function ForProsPage() {
  const ldBc = breadcrumbList([
    { name: "Home", url: SITE },
    { name: "For professionals", url: `${SITE}/for-pros` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationEntity(SITE)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBc) }} />

      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "For professionals" }]}
        eyebrow="For technicians &amp; inspectors"
        title="A neutral third party you can hand to your customer"
        lede="The hardest conversation in appliance repair is explaining why the honest answer is &ldquo;replace it.&rdquo; A neutral, cite-everything tool makes that conversation easier."
      />

      <Container asChild>
        <main className="mt-12 pb-24">
          <div className="mx-auto max-w-[72ch] space-y-12">

            <section aria-labelledby="share-heading">
              <h2 id="share-heading" className="text-(length:--text-xl) font-semibold text-(--color-ink)">
                Share a result directly
              </h2>
              <p className="mt-3 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                After running an estimate, the result page has a &ldquo;Share&rdquo; button
                that generates a read-only link at <code className="rounded px-1 text-(length:--text-xs) bg-(--color-surface-2)">/r?id=…</code>.
                Send it to the customer before you leave — they can review the math at
                home, share it with a spouse, and come back with an informed decision.
                The link carries no personal data: only the inputs you entered and the
                computed result.
              </p>
            </section>

            <section aria-labelledby="guides-heading">
              <h2 id="guides-heading" className="text-(length:--text-xl) font-semibold text-(--color-ink)">
                Cost guides for each appliance type
              </h2>
              <p className="mt-3 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                Each guide page lists typical repair cost ranges by component, lifespan
                by brand tier, and the repair-vs-replace rule of thumb for that category.
                You can link directly to a guide in a written estimate, or print it to
                leave with the customer.
              </p>
              <Link
                href="/cost-guides"
                className="mt-4 inline-flex items-center gap-1 text-(length:--text-sm) font-medium text-(--color-brand) hover:text-(--color-brand-ink)"
              >
                Browse all cost guides &rarr;
              </Link>
            </section>

            <section aria-labelledby="recalls-heading">
              <h2 id="recalls-heading" className="text-(length:--text-xl) font-semibold text-(--color-ink)">
                Active recall check
              </h2>
              <p className="mt-3 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                The calculator checks the CPSC SaferProducts database when a UPC or model
                number is provided. If you are on-site without network access, the{" "}
                <Link href="/recalls" className="text-(--color-brand) underline underline-offset-2">recalls page</Link>{" "}
                links directly to the CPSC lookup tool so you can check any unit.
              </p>
            </section>

            <section aria-labelledby="data-heading">
              <h2 id="data-heading" className="text-(length:--text-xl) font-semibold text-(--color-ink)">
                Using our data
              </h2>
              <p className="mt-3 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                All data on this site is sourced from public government datasets (BLS,
                EIA, CPSC) and is freely citable. If you reference our cost ranges in
                a written estimate, please link to the relevant guide page and note the
                data date shown in the provenance line. Our{" "}
                <Link href="/methodology" className="text-(--color-brand) underline underline-offset-2">methodology page</Link>{" "}
                has direct links to every primary source.
              </p>
              <p className="mt-3 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                Questions about professional use?{" "}
                <a href="mailto:pro@repair-or-replace.net" className="text-(--color-brand) underline underline-offset-2">pro@repair-or-replace.net</a>
              </p>
            </section>

          </div>
        </main>
      </Container>
    </>
  )
}
