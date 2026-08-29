/**
 * GuideTemplate — shared layout for every appliance cost-guide page.
 * Pure server component; no client interactivity needed.
 */
import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { PageHero } from "@/components/site/page-hero"
import { ApplianceGlyph } from "@/components/ui/appliance-glyph"
import { Callout } from "@/components/ui/callout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GuideData } from "@/lib/page-data"
import { GUIDE_SLUGS, getMetroHubData } from "@/lib/page-data"
import { cn } from "@/lib/utils"

const HAZARD_LABEL: Record<string, string> = {
  gas: "Gas — pro only",
  high_voltage: "High voltage — pro only",
  refrigerant: "Refrigerant — licensed",
  water: "Water — DIY possible",
}
const HAZARD_VARIANT: Record<string, "danger" | "neutral"> = {
  gas: "danger",
  high_voltage: "danger",
  refrigerant: "neutral",
  water: "neutral",
}

/**
 * Featured markets for the guide-page metro rail.
 *
 * Hand-picked by market size, not by wage. Ranking the 22 published markets by
 * mean wage promotes Seattle and Washington DC over Los Angeles, Chicago and
 * Miami — which optimises for where labor moves the bill most, but these chips
 * exist to pass internal link equity, and that follows search volume. The six
 * below are the largest US appliance markets we publish.
 *
 * Filtered against the published set so a chip can never point at a market with
 * no page; /local-costs lists all 22 and the trailing "All markets" chip goes
 * there.
 */
const FEATURED_METRO_SLUGS = [
  "new-york",
  "los-angeles",
  "chicago",
  "dallas",
  "houston",
  "miami",
]
const METRO_LINKS = FEATURED_METRO_SLUGS.map((slug) =>
  getMetroHubData().find((m) => m.slug === slug),
).filter((m): m is NonNullable<typeof m> => Boolean(m))

interface GuideTemplateProps {
  data: GuideData
}

export function GuideTemplate({ data }: GuideTemplateProps) {
  const {
    slug,
    category,
    label,
    noun,
    article,
    provenance,
    sources,
    lede,
    lifespanRows,
    failures,
    repairRule,
    faqs,
  } = data

  const otherGuides = GUIDE_SLUGS.filter((g) => g.slug !== slug)

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Cost guides", href: "/cost-guides" },
          { label },
        ]}
        eyebrow={`Cost guide · ${label}`}
        heading={`${label} repair cost guide`}
        lede={lede}
        provenanceLine={`${provenance} · ${sources}`}
        illustration={
          <ApplianceGlyph
            category={category}
            size={120}
            className="text-(--color-brand) opacity-60"
          />
        }
      />

      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-prose">
          {/* ── Lifespan table ───────────────────────────────────── */}
          <section aria-labelledby="lifespan-heading" className="mb-12">
            <h2 id="lifespan-heading" className="mb-1 text-(length:--text-2xl) font-semibold text-(--color-ink)">
              How long does {article} {noun} last?
            </h2>
            <p className="mb-5 text-(length:--text-sm) text-(--color-muted)">
              Median lifespan by brand tier, from NAHB field data. Source:{" "}
              <a
                href="https://www.nahb.org/news-and-economics/housing-economics/special-studies/study-of-life-expectancy-of-home-components"
                target="_blank"
                rel="noopener noreferrer"
                className="text-(--color-brand) underline underline-offset-2"
              >
                NAHB Study of Life Expectancy of Home Components
              </a>
              .
            </p>
            <div className="overflow-x-auto rounded-(--radius-md) border border-(--color-line)">
              <table className="w-full text-(length:--text-sm)">
                <thead>
                  <tr className="border-b border-(--color-line) bg-(--color-surface-2)">
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-(--color-ink)">Brand tier</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-(--color-ink)">Typical lifespan</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-(--color-ink)">Midpoint</th>
                  </tr>
                </thead>
                <tbody>
                  {lifespanRows.map((row, i) => (
                    <tr
                      key={row.tier}
                      className={cn(
                        "border-b border-(--color-line) last:border-0",
                        i % 2 === 0 ? "bg-(--color-surface)" : "bg-(--color-surface-2)",
                      )}
                    >
                      <td className="px-4 py-3 text-(--color-ink)">{row.tier}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-(--color-ink)">{row.range}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-(--color-muted)">{row.midpoint} yrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Common failures ──────────────────────────────────── */}
          <section aria-labelledby="failures-heading" className="mb-12">
            <h2 id="failures-heading" className="mb-1 text-(length:--text-2xl) font-semibold text-(--color-ink)">
              Common {noun} repairs and typical costs
            </h2>
            <p className="mb-5 text-(length:--text-sm) text-(--color-muted)">
              Cost ranges include parts and labor at the national mean rate ($24.10/hr, BLS OEWS 49-9031).
              Your local rate may differ — see{" "}
              <Link href="/local-costs" className="text-(--color-brand) underline underline-offset-2">
                local repair costs
              </Link>
              .
            </p>
            <div className="overflow-x-auto rounded-(--radius-md) border border-(--color-line)">
              <table className="w-full text-(length:--text-sm)">
                <thead>
                  <tr className="border-b border-(--color-line) bg-(--color-surface-2)">
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-(--color-ink)">Repair / part</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-(--color-ink)">Typical cost</th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-(--color-ink)">DIY?</th>
                  </tr>
                </thead>
                <tbody>
                  {failures.map((f, i) => (
                    <tr
                      key={f.name}
                      className={cn(
                        "border-b border-(--color-line) last:border-0",
                        i % 2 === 0 ? "bg-(--color-surface)" : "bg-(--color-surface-2)",
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="text-(--color-ink)">{f.name}</span>
                        {f.hazard && (
                          <Badge
                            variant={HAZARD_VARIANT[f.hazard] ?? "neutral"}
                            className="ml-2"
                          >
                            {HAZARD_LABEL[f.hazard] ?? f.hazard}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-(--color-ink)">{f.costRange}</td>
                      <td className="px-4 py-3 text-(--color-muted)">
                        {f.diyFriendly ? "Possible" : f.hazard ? "No — licensed pro" : "Varies"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Repair vs replace rule ────────────────────────────── */}
          <section aria-labelledby="rule-heading" className="mb-12">
            <h2 id="rule-heading" className="mb-4 text-(length:--text-2xl) font-semibold text-(--color-ink)">
              The repair-vs-replace rule for {noun}s
            </h2>
            <Callout variant="info">
              <p className="text-(length:--text-sm) leading-relaxed text-(--color-ink)">{repairRule}</p>
            </Callout>
            <p className="mt-4 text-(length:--text-sm) text-(--color-muted)">
              Rules of thumb are starting points. For a precise answer based on your unit&apos;s
              age, the actual quote, and your local labor rate, use the calculator.
            </p>
            <div className="mt-5">
              <Button href="/" size="md">
                Get my verdict &rarr;
              </Button>
            </div>
          </section>

          {/* ── FAQ ──────────────────────────────────────────────── */}
          <section aria-labelledby="faq-heading" className="mb-12">
            <h2 id="faq-heading" className="mb-5 text-(length:--text-2xl) font-semibold text-(--color-ink)">
              Frequently asked questions
            </h2>
            <div className="divide-y divide-(--color-line) rounded-(--radius-md) border border-(--color-line)">
              {faqs.map((faq) => (
                <details key={faq.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="text-(length:--text-sm) font-medium text-(--color-ink)">{faq.q}</span>
                    <span aria-hidden className="shrink-0 text-(--color-muted) transition-transform group-open:rotate-45">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" />
                      </svg>
                    </span>
                  </summary>
                  {/* The <div> is load-bearing: the print stylesheet forces
                      collapsed disclosures open via `details > div`. */}
                  <div>
                    <p className="mt-3 text-(length:--text-sm) leading-relaxed text-(--color-muted)">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* ── Metro rail ───────────────────────────────────────── */}
          <section aria-labelledby="metro-heading" className="mb-12">
            <h2 id="metro-heading" className="mb-3 text-(length:--text-lg) font-semibold text-(--color-ink)">
              Local labor rates
            </h2>
            <p className="mb-4 text-(length:--text-sm) text-(--color-muted)">
              Repair costs vary by market. See what {noun} repairs cost in your metro.
            </p>
            <div className="flex flex-wrap gap-2">
              {METRO_LINKS.map((m) => (
                <Link
                  key={m.slug}
                  href={`/local-costs/${m.slug}`}
                  className="rounded-(--radius-sm) border border-(--color-line) bg-(--color-surface-2) px-3 py-1.5 text-(length:--text-xs) font-medium text-(--color-ink) transition-colors hover:border-(--color-brand) hover:text-(--color-brand)"
                >
                  {m.shortName}
                </Link>
              ))}
              <Link
                href="/local-costs"
                className="rounded-(--radius-sm) border border-(--color-line) px-3 py-1.5 text-(length:--text-xs) font-medium text-(--color-muted) transition-colors hover:text-(--color-ink)"
              >
                All markets &rarr;
              </Link>
            </div>
          </section>

          {/* ── Federal recall check link ─────────────────────────── */}
          <Callout variant="warn" className="mb-12">
            <p className="text-(length:--text-sm) text-(--color-ink)">
              Before any repair, check whether your unit has an open recall.{" "}
              <a
                href="https://www.saferproducts.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2"
              >
                Search SaferProducts.gov (CPSC)
              </a>{" "}
              and{" "}
              <a
                href="https://recalls.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline underline-offset-2"
              >
                Recalls.gov
              </a>
              . Our calculator can check by UPC when you supply one.
            </p>
          </Callout>

          {/* ── CTA band ─────────────────────────────────────────── */}
          <div className="rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface-2) px-6 py-8 text-center">
            <p className="mb-1 text-(length:--text-xs) font-semibold uppercase tracking-[0.14em] text-(--color-brand)">
              Ready for a verdict?
            </p>
            <p className="mb-5 text-balance text-(length:--text-xl) font-semibold text-(--color-ink)">
              Enter your quote and get the net-present-cost math.
            </p>
            <Button href="/" size="lg">
              Get my verdict &rarr;
            </Button>
            <p className="mt-3 text-(length:--text-xs) text-(--color-muted)">Free. No sign-up. No ads on your result.</p>
          </div>

          {/* ── Other guides ─────────────────────────────────────── */}
          <nav aria-label="Other appliance guides" className="mt-12">
            <p className="mb-3 text-(length:--text-xs) font-semibold uppercase tracking-[0.14em] text-(--color-muted)">
              Other guides
            </p>
            <div className="flex flex-wrap gap-2">
              {otherGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/cost-guides/${g.slug}`}
                  className="rounded-(--radius-sm) border border-(--color-line) px-3 py-1.5 text-(length:--text-xs) text-(--color-muted) transition-colors hover:text-(--color-ink)"
                >
                  {g.navLabel}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </Container>
    </>
  )
}
