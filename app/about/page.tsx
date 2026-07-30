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
  const ldBc = breadcrumbList([
    { name: "Home", url: SITE },
    { name: "About", url: `${SITE}/about` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationEntity(SITE)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBc) }} />

      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
        eyebrow="About"
        title="Neutral by design"
        lede="RepairOrReplace.net exists because the appliance industry has a structural incentive to push you toward replacement. We have no such incentive."
      />

      <Container>
        <main className="mt-12 pb-24">
          <div className="mx-auto max-w-[72ch] space-y-10 text-(length:--text-base) leading-relaxed text-(--color-muted)">

            <p>
              Every manufacturer, retailer, and extended-warranty seller makes more
              money when you replace. Every independent repair technician makes more
              money when you repair. Neither is a neutral source. We are a third party
              with no stake in the outcome.
            </p>

            <div>
              <h2 className="mb-3 text-(length:--text-xl) font-semibold text-(--color-ink)">What we do</h2>
              <p>
                We run a net-present cost calculation — the same framework a financial
                analyst would use — against real cost data. We show you the math, cite
                every source, and hand you a verdict. If the inputs are too uncertain to
                stand behind, we say so explicitly and dim the numbers rather than
                projecting false precision.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-(length:--text-xl) font-semibold text-(--color-ink)">How we are funded</h2>
              <p>
                Partner links — to retailers and service marketplaces — appear at the
                bottom of result pages, after the analysis, clearly labelled. They are
                optional and non-influential: the verdict is computed before any
                monetization logic runs, and the partner section renders identically
                regardless of the verdict. We never adjust a recommendation based on
                affiliate economics.
              </p>
              <p className="mt-3">
                No sign-up. No email capture. No advertising above the analysis.
                No countdown timers. No invented statistics.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-(length:--text-xl) font-semibold text-(--color-ink)">Data</h2>
              <p>
                All data comes from public government sources: BLS, EIA, NAHB, CPSC.
                We link to every primary source. If you find a data error, email{" "}
                <a href="mailto:data@repair-or-replace.net" className="text-(--color-brand) underline underline-offset-2">data@repair-or-replace.net</a>{" "}
                and we will review it. For the full source list, see the{" "}
                <Link href="/methodology" className="text-(--color-brand) underline underline-offset-2">methodology page</Link>.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-(length:--text-xl) font-semibold text-(--color-ink)">For professionals</h2>
              <p>
                If you are a technician, home inspector, or service company and want
                to embed the calculator or reference our data, see the{" "}
                <Link href="/for-technicians" className="text-(--color-brand) underline underline-offset-2">For professionals</Link>{" "}
                page.
              </p>
            </div>

          </div>
        </main>
      </Container>
    </>
  )
}
