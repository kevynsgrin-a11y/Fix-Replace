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
  alternates: { canonical: `${SITE}/for-technicians` },
  openGraph: {
    title: "For Appliance Repair Professionals",
    description: "How technicians, home inspectors, and service companies can use RepairOrReplace.net with customers.",
    url: `${SITE}/for-technicians`,
    images: [{ url: `${SITE}/og?type=editorial&slug=for-pros`, width: 1200, height: 630, alt: "RepairOrReplace.net for appliance repair professionals" }],
  },
  twitter: { card: "summary_large_image" },
}

export default function ForTechniciansPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "For professionals" }]}
        eyebrow="Professionals"
        heading="For appliance repair professionals"
        lede="Hand customers a direct link to their result, reference the cost guides in your estimates, or use the labor-rate pages to show how local markets compare."
      />
      <Container>
        <main className="mx-auto max-w-[72ch] py-12 pb-24">
          <div className="flex flex-col gap-10">
            <section>
              <h2 className="text-(length:--text-xl) font-semibold text-(--color-ink)">Share a customer link</h2>
              <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-body)">
                After you submit an estimate, the{" "}
                <Link href="/r" className="text-(--color-brand) underline decoration-1 underline-offset-2 hover:text-(--color-brand-strong)">shareable result page</Link>
                {" "}generates a URL you can send to the customer. They see the repair-vs-replace verdict, the math behind it, and the context for your quote — without any signup or app install.
              </p>
            </section>

            <section>
              <h2 className="text-(length:--text-xl) font-semibold text-(--color-ink)">Reference the cost guides in estimates</h2>
              <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-body)">
                The{" "}
                <Link href="/cost-guides" className="text-(--color-brand) underline decoration-1 underline-offset-2 hover:text-(--color-brand-strong)">appliance cost guides</Link>
                {" "}list typical part + labor ranges for every common failure by appliance type. If a customer questions your quote, linking to the relevant guide gives independent third-party context without disclosing your markup.
              </p>
            </section>

            <section>
              <h2 className="text-(length:--text-xl) font-semibold text-(--color-ink)">Local labor-rate pages</h2>
              <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-body)">
                The{" "}
                <Link href="/local-costs" className="text-(--color-brand) underline decoration-1 underline-offset-2 hover:text-(--color-brand-strong)">local cost pages</Link>
                {" "}benchmark each metro against the $24.10/hr BLS national mean. If you operate across multiple markets, the multiplier table shows how pricing varies so you can set consistent margins.
              </p>
            </section>

            <section>
              <h2 className="text-(length:--text-xl) font-semibold text-(--color-ink)">Recall checks before work begins</h2>
              <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-body)">
                The{" "}
                <Link href="/recall-checks" className="text-(--color-brand) underline decoration-1 underline-offset-2 hover:text-(--color-brand-strong)">recall-check page</Link>
                {" "}links directly to CPSC SaferProducts.gov and Recalls.gov. Running a quick check before starting work protects you and your customer — and it is good practice to document that you did.
              </p>
            </section>

            <section>
              <h2 className="text-(length:--text-xl) font-semibold text-(--color-ink)">What this tool does not do</h2>
              <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-body)">
                RepairOrReplace.net is a homeowner decision aid, not a job-management or quoting platform. It does not generate invoices, manage appointments, or track inventory. The verdict is based on published data, not your specific assessment of unit condition — your professional judgment always takes precedence.
              </p>
            </section>
          </div>
        </main>
      </Container>
    </>
  )
}
