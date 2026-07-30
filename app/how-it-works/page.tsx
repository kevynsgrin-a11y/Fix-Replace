import type { Metadata } from "next"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { jsonLd, breadcrumbList, organizationEntity } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export const metadata: Metadata = {
  title: "How RepairOrReplace.net Works — The Math Behind the Verdict",
  description:
    "Net-present cost, Weibull reliability, and BLS labor data combined into one honest repair-vs-replace answer. Read the formulas, assumptions, and data sources.",
  alternates: { canonical: `${SITE}/how-it-works` },
  openGraph: {
    title: "How RepairOrReplace.net Works",
    description: "The net-present cost math, Weibull reliability model, and BLS data behind every verdict.",
    url: `${SITE}/how-it-works`,
    images: [{ url: `${SITE}/og?type=editorial&slug=how-it-works`, width: 1200, height: 630, alt: "How RepairOrReplace.net works" }],
  },
  twitter: { card: "summary_large_image" },
}

export default function HowItWorksPage() {
  const ldBc = breadcrumbList([
    { name: "Home", url: SITE },
    { name: "How it works", url: `${SITE}/how-it-works` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationEntity(SITE)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBc) }} />

      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "How it works" }]}
        eyebrow="Methodology overview"
        title="The math behind the verdict"
        lede="RepairOrReplace.net runs a net-present cost comparison between keeping-and-repairing and replacing now. Here is every formula, assumption, and data source in plain language."
        provenance="Model reviewed July 2026 · BLS OEWS 49-9031 · EIA RECS · NAHB · InterNACHI"
      />

      <Container asChild>
        <main className="mt-12 pb-24">
          <div className="mx-auto max-w-[72ch] space-y-16">

            {/* Step 1 — NPC */}
            <section aria-labelledby="npc-heading">
              <h2 id="npc-heading" className="text-(length:--text-2xl) font-semibold text-(--color-ink)">
                Step 1 — Net-present cost of each path
              </h2>
              <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-muted)">
                We discount all future costs to today&apos;s dollars using a 5 % real
                discount rate (the 10-year TIPS yield plus a small uncertainty
                premium). For the <strong className="text-(--color-ink)">repair path</strong>:
              </p>
              {/* Formula block */}
              <div className="mt-4 overflow-x-auto rounded-(--radius-md) border border-(--color-line) bg-(--color-surface-2) px-5 py-4 font-mono text-(length:--text-sm) text-(--color-ink)">
                <p>NPC<sub className="text-[0.7em]">repair</sub> = Q + &Sigma;<sub className="text-[0.7em]">t=1&hellip;H</sub> [p<sub className="text-[0.7em]">fail,t</sub> &times; E[C<sub className="text-[0.7em]">next</sub>]] / (1+r)<sup className="text-[0.7em]">t</sup> + E<sub className="text-[0.7em]">old</sub> &times; H / (1+r)<sup className="text-[0.7em]">H/2</sup></p>
              </div>
              <dl className="mt-4 space-y-2 text-(length:--text-sm)">
                {[
                  ["Q", "The technician quote you entered."],
                  ["H", "Planning horizon in years — the longer of the two appliances' expected remaining life (min 8, max 20)."],
                  ["p_fail,t", "Weibull probability the appliance fails in year t, conditioned on surviving to today."],
                  ["E[C_next]", "Expected cost of the next repair, drawn from BLS-adjusted part + labor distributions."],
                  ["r", "Real discount rate: 0.05."],
                  ["E_old", "Annual energy spend for the current unit, localized to your metro's EIA electricity/gas rate."],
                ].map(([sym, desc]) => (
                  <div key={sym as string} className="flex gap-3">
                    <dt className="w-20 shrink-0 font-mono font-medium text-(--color-ink)">{sym}</dt>
                    <dd className="text-(--color-muted)">{desc}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Step 2 — Weibull */}
            <section aria-labelledby="weibull-heading">
              <h2 id="weibull-heading" className="text-(length:--text-2xl) font-semibold text-(--color-ink)">
                Step 2 — Weibull reliability model
              </h2>
              <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-muted)">
                We use a two-parameter Weibull distribution to model each appliance category&apos;s
                failure-time distribution. The shape parameter &beta; controls whether
                failures accelerate with age (&beta;&nbsp;&gt;&nbsp;1) or follow a roughly
                flat hazard rate (&beta;&nbsp;&asymp;&nbsp;1). Scale &eta; is calibrated so
                the median survival equals the NAHB/InterNACHI median lifespan for that category.
              </p>
              <div className="mt-4 overflow-x-auto rounded-(--radius-md) border border-(--color-line) bg-(--color-surface-2) px-5 py-4 font-mono text-(length:--text-sm) text-(--color-ink)">
                <p>S(t) = exp(&minus;(t / &eta;)<sup className="text-[0.7em]">&beta;</sup>)</p>
                <p className="mt-2">f(t) = (&beta;/&eta;) &times; (t/&eta;)<sup className="text-[0.7em]">&beta;&minus;1</sup> &times; exp(&minus;(t/&eta;)<sup className="text-[0.7em]">&beta;</sup>)</p>
              </div>
              <p className="mt-4 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                Conditional survival — given the appliance is already <em>a</em> years old —
                is S(a+t)/S(a). This is what drives the 12-, 24-, and 36-month survival
                percentages shown in the result.
              </p>
            </section>

            {/* Step 3 — Labor */}
            <section aria-labelledby="labor-heading">
              <h2 id="labor-heading" className="text-(length:--text-2xl) font-semibold text-(--color-ink)">
                Step 3 — Labor rate localisation
              </h2>
              <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-muted)">
                The national mean wage for SOC 49-9031 (home appliance repairers) is
                <strong className="text-(--color-ink)"> $24.10/hr</strong> (BLS OEWS,
                May 2023). We multiply every labor-time estimate by each metro&apos;s
                ratio to this baseline. A 1.23&times; Boston multiplier means labor
                costs 23 % more than average in that market.{" "}
                <a href="https://www.bls.gov/oes/current/oes499031.htm" target="_blank" rel="noreferrer" className="text-(--color-brand) underline underline-offset-2 hover:text-(--color-brand-ink)">
                  BLS source table &rarr;
                </a>
              </p>
            </section>

            {/* Step 4 — Energy */}
            <section aria-labelledby="energy-heading">
              <h2 id="energy-heading" className="text-(length:--text-2xl) font-semibold text-(--color-ink)">
                Step 4 — Energy cost delta
              </h2>
              <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-muted)">
                Annual energy spend for the old unit comes from EIA RECS appliance-level
                consumption estimates, adjusted for age-related efficiency degradation
                (typically 0.5 –1.5 % per year after year 8). The new-unit figure uses
                the current ENERGY STAR&reg; baseline for that category. The difference
                compounds over the planning horizon and is discounted back to present value.
                Electricity and gas rates are localized via EIA residential rates by census division.{" "}
                <a href="https://www.eia.gov/consumption/residential/" target="_blank" rel="noreferrer" className="text-(--color-brand) underline underline-offset-2 hover:text-(--color-brand-ink)">
                  EIA RECS &rarr;
                </a>
              </p>
            </section>

            {/* Step 5 — Confidence */}
            <section aria-labelledby="conf-heading">
              <h2 id="conf-heading" className="text-(length:--text-2xl) font-semibold text-(--color-ink)">
                Step 5 — Confidence scoring
              </h2>
              <p className="mt-3 text-(length:--text-base) leading-relaxed text-(--color-muted)">
                The confidence score (0–100) penalises for: missing age (−15), no component
                selected (−10), very low or implausibly high quotes relative to expected
                repair cost (−20 each), and no location specified (−8). A score below 40
                triggers the <em>suppressed</em> path — we show the analysis but dim it
                and suppress absolute-dollar claims, because the inputs are too uncertain
                to stand behind. Scores 40–59 are <em>low</em>, 60–79 <em>moderate</em>,
                80+ <em>high</em>.
              </p>
            </section>

            {/* Limitations */}
            <section aria-labelledby="limits-heading">
              <h2 id="limits-heading" className="text-(length:--text-2xl) font-semibold text-(--color-ink)">
                What this model does not do
              </h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                <li>It does not inspect your appliance. The verdict is only as good as the quote and age you enter.</li>
                <li>It does not account for sentimental value, lease agreements, or permit requirements for gas line work.</li>
                <li>It does not replace a second opinion from a licensed technician on safety-related faults.</li>
                <li>Recall data comes from the CPSC database. A clear result means no <em>current</em> match — recalls can be issued at any time.</li>
              </ul>
              <p className="mt-4 text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                For the full source list and update schedule, see the{" "}
                <a href="/methodology" className="text-(--color-brand) underline underline-offset-2 hover:text-(--color-brand-ink)">
                  methodology page
                </a>.
              </p>
            </section>

          </div>
        </main>
      </Container>
    </>
  )
}
