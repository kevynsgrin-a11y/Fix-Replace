/**
 * MetroTemplate — shared RSC layout for all 6 metro labor-cost pages.
 *
 * Sections:
 * 1. PageHero (breadcrumb · eyebrow · h1 · lede · multiplier dial)
 * 2. Rate stat banner
 * 3. Localized cost table (repair jobs linked to their guide pages)
 * 4. FAQ (4 questions anchored in the metro's own numbers)
 * 5. Sibling-metro chips (never self-linking)
 * 6. CTA band
 */

import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { PageHero } from "@/components/site/page-hero"
import { MultiplierDial } from "@/components/metro/multiplier-dial"
import { TableWrapper, Th, Td } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { fmtUSD } from "@/lib/result"
import type { MetroData } from "@/lib/page-data"

interface MetroTemplateProps {
  data: MetroData
}

export function MetroTemplate({ data }: MetroTemplateProps) {
  const {
    slug,
    name,
    rate,
    multiplier,
    nationalMean,
    costRows,
    faqs,
    siblings,
  } = data

  const pctDiff = ((multiplier - 1) * 100).toFixed(0)
  const aboveBelow = multiplier >= 1 ? "above" : "below"
  const shortName = name.split(",")[0]

  const lede = `Appliance repair technicians in ${shortName} earn a mean $${rate.toFixed(2)}/hr (BLS OEWS 49-9031) — ${Math.abs(parseFloat(pctDiff))}% ${aboveBelow} the national average of $${nationalMean.toFixed(2)}/hr. Every cost estimate on this page uses that verified rate.`

  return (
    <>
      {/* 1. Hero */}
      <PageHero
        breadcrumbs={[
          { label: "Local costs", href: "/local-costs" },
          { label: shortName },
        ]}
        eyebrow="Local labor costs"
        heading={`Appliance repair costs in ${shortName}`}
        lede={lede}
        provenance={`BLS OEWS 49-9031 · Mean hourly wage survey · Data reviewed July 19, 2026`}
        illustration={
          <MultiplierDial multiplier={multiplier} metroName={name} />
        }
      />

      <Container className="py-16">
        <div className="mx-auto flex max-w-[72ch] flex-col gap-16">

          {/* 2. Rate stat banner */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Mean hourly wage", value: `$${rate.toFixed(2)}` },
              { label: "vs. national mean", value: `${multiplier >= 1 ? "+" : ""}${pctDiff}%` },
              { label: "National mean", value: `$${nationalMean.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-(--radius-md) border border-(--color-line) bg-(--color-surface) p-4 text-center"
              >
                <div className="readout text-(length:--text-2xl) font-semibold text-(--color-ink)">
                  {value}
                </div>
                <div className="mt-1 text-(length:--text-xs) text-(--color-muted)">{label}</div>
              </div>
            ))}
          </div>

          {/* 3. Localized cost table */}
          <section aria-labelledby={`${slug}-costs-heading`}>
            <h2
              id={`${slug}-costs-heading`}
              className="mb-4 text-(length:--text-xl) font-semibold text-(--color-ink)"
            >
              Typical repair costs in {shortName}
            </h2>
            <p className="mb-4 text-(length:--text-sm) text-(--color-muted)">
              Calculated by applying the {shortName} labor multiplier ({multiplier.toFixed(2)}×) to
              national baseline cost ranges. Enter your actual quote in the{" "}
              <Link href="/" className="underline decoration-(--color-line) underline-offset-2 hover:decoration-(--color-ink)">
                calculator
              </Link>{" "}
              for a personalized net-present-cost analysis.
            </p>
            <TableWrapper aria-label={`Typical appliance repair costs in ${shortName}`}>
              <table className="w-full text-(length:--text-sm)">
                <thead>
                  <tr>
                    <Th>Repair</Th>
                    <Th align="right">Estimated range</Th>
                    <Th>Guide</Th>
                  </tr>
                </thead>
                <tbody>
                  {costRows.map((row) => (
                    <tr key={row.guideSlug} className="border-t border-(--color-line)">
                      <Td>{row.repair}</Td>
                      <Td align="right" className="readout whitespace-nowrap">
                        {fmtUSD(row.low)}–{fmtUSD(row.high)}
                      </Td>
                      <Td>
                        <Link
                          href={`/cost-guides/${row.guideSlug}`}
                          className="text-(--color-brand) underline decoration-(--color-line) underline-offset-2 hover:decoration-(--color-brand)"
                        >
                          Full guide ↗
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          </section>

          {/* 4. FAQ */}
          <section aria-labelledby={`${slug}-faq-heading`}>
            <h2
              id={`${slug}-faq-heading`}
              className="mb-6 text-(length:--text-xl) font-semibold text-(--color-ink)"
            >
              Frequently asked questions
            </h2>
            <dl className="flex flex-col divide-y divide-(--color-line) rounded-(--radius-lg) border border-(--color-line)">
              {faqs.map((faq, i) => (
                <details key={i} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <dt className="text-(length:--text-sm) font-medium text-(--color-ink)">{faq.q}</dt>
                    <span aria-hidden className="shrink-0 text-(--color-muted) transition-transform group-open:rotate-180">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </summary>
                  <dd className="mt-3 text-(length:--text-sm) leading-relaxed text-(--color-muted)">{faq.a}</dd>
                </details>
              ))}
            </dl>
          </section>

          {/* 5. Sibling-metro chips */}
          <section aria-labelledby={`${slug}-markets-heading`}>
            <h2
              id={`${slug}-markets-heading`}
              className="mb-4 text-(length:--text-xl) font-semibold text-(--color-ink)"
            >
              Other markets
            </h2>
            <nav aria-label="Other metro labor-cost pages">
              <ul className="flex flex-wrap gap-2">
                {siblings.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/local-costs/${s.slug}`}
                      className="inline-flex items-center rounded-(--radius-md) border border-(--color-line) bg-(--color-surface) px-3 py-1.5 text-(length:--text-sm) text-(--color-ink) transition-colors hover:border-(--color-brand) hover:text-(--color-brand)"
                    >
                      {s.name.split(",")[0]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </section>

          {/* 6. CTA band */}
          <section
            aria-labelledby={`${slug}-cta-heading`}
            className="-mx-4 rounded-(--radius-lg) bg-(--color-surface-2) px-4 py-8 sm:mx-0"
          >
            <h2
              id={`${slug}-cta-heading`}
              className="mb-2 text-(length:--text-xl) font-semibold text-(--color-ink)"
            >
              Get your personalized verdict
            </h2>
            <p className="mb-5 max-w-[52ch] text-(length:--text-sm) text-(--color-muted)">
              Enter your actual quote and the calculator applies the {shortName} labor rate,
              net-present-cost math, and remaining useful life to give you a specific repair-or-replace recommendation.
            </p>
            <Link href="/">
              <Button size="sm">Run the calculator</Button>
            </Link>
          </section>

        </div>
      </Container>
    </>
  )
}
