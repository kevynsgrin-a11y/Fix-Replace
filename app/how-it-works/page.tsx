import type { Metadata } from "next"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { breadcrumbLd, organizationLd, websiteLd, graphLd, jsonLdScript } from "@/lib/json-ld"

const SITE = "https://repair-or-replace.net"

export const metadata: Metadata = {
  title: "How RepairOrReplace Works — The Math Behind the Verdict",
  description:
    "Net-present cost, Weibull reliability, and BLS labor data combined into one honest repair-vs-replace answer. Read the formulas, assumptions, and data sources.",
  alternates: { canonical: `${SITE}/how-it-works` },
  openGraph: {
    title: "How RepairOrReplace Works",
    description: "The net-present cost math, Weibull reliability model, and BLS data behind every verdict.",
    url: `${SITE}/how-it-works`,
    images: [{ url: `${SITE}/og?type=editorial&slug=how-it-works`, width: 1200, height: 630, alt: "How RepairOrReplace works" }],
  },
  twitter: { card: "summary_large_image" },
}

const STEPS: { id: string; heading: string; body: string }[] = [
  {
    id: "inputs",
    heading: "Step 1 — You provide the basics",
    body: "Appliance category, rough age, and the technician's quoted repair price. Brand tier, failed component, and your metro area sharpen the estimate but are optional.",
  },
  {
    id: "weibull",
    heading: "Step 2 — Weibull survival probability",
    body: "We fit a two-parameter Weibull distribution to NAHB appliance lifespan surveys. The survival function S(t) = exp(−(t/η)^β) gives the probability the appliance is still running at age t. Scale parameter η is the characteristic life; shape β controls whether failures accelerate with age.",
  },
  {
    id: "npc",
    heading: "Step 3 — Net-present-cost comparison",
    body: "We compute two 10-year cost streams: (A) repair cost + expected future costs over the remaining life, discounted at 5 %/yr; (B) replacement cost now. Repair costs include parts, localized BLS OEWS 49-9031 labor, and a repeat-failure probability premium. If NPC(repair) < NPC(replace), the model recommends repair.",
  },
  {
    id: "energy",
    heading: "Step 4 — Energy penalty",
    body: "When an Energy Star flag is available, the annual energy cost delta between the current appliance and a replacement is folded into the NPC replace stream using EIA state residential rate data.",
  },
  {
    id: "confidence",
    heading: "Step 5 — Confidence scoring",
    body: "We score how many optional fields were filled, weight them by their effect on the NPC delta, and report a 0–100 confidence figure. A low score means the verdict is directionally correct but the margin may shift with more data.",
  },
]

export default function HowItWorksPage() {
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    breadcrumbLd([{ name: "Home", href: "/" }, { name: "How it works", href: "/how-it-works" }]),
  )
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "How it works" }]}
        eyebrow="Methodology"
        heading="How the math works"
        lede="Weibull survival curves, localized labor rates, and net-present cost — every step is open and citable."
        provenanceLine="Model reviewed July 19, 2026 · BLS OEWS 49-9031 · NAHB Housing Survey · EIA residential rates"
      />
      <Container>
        <main className="mx-auto max-w-[72ch] py-12 pb-24">
          <ol className="flex flex-col gap-12">
            {STEPS.map((step) => (
              <li key={step.id} id={step.id} className="scroll-mt-20">
                <h2 className="text-(length:--text-xl) font-semibold text-(--color-ink)">{step.heading}</h2>
                <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-body)">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-16 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface-2) px-6 py-8">
            <h2 className="text-(length:--text-lg) font-semibold text-(--color-ink)">Limits and assumptions</h2>
            <ul className="mt-4 flex flex-col gap-3 text-(length:--text-sm) leading-relaxed text-(--color-body)">
              <li>Labor rates use metropolitan area means from BLS OEWS. Rural rates may differ by ±15 %.</li>
              <li>Lifespan curves are fitted to NAHB survey medians. Individual units vary widely by usage and maintenance.</li>
              <li>Energy savings assume replacement with a mid-tier Energy Star model. Actual savings depend on the unit chosen.</li>
              <li>Repeat-failure probabilities are derived from appliance-specific failure mode prevalence data, not per-unit condition.</li>
            </ul>
          </div>
        </main>
      </Container>
    </>
  )
}
