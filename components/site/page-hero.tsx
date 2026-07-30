/**
 * PageHero — shared page-header shell used by guides, metros, editorial, and 404.
 * The illustration slot is anchored to the content column, not the viewport,
 * so it never drifts from its copy at wide widths.
 */
import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { cn } from "@/lib/utils"

export interface Crumb {
  label: string
  href?: string
}

interface PageHeroProps {
  /** Breadcrumb trail. Last item is the current page (no href). */
  crumbs?: Crumb[]
  /** Small text above the h1, e.g. "Cost guide · Refrigerators" */
  eyebrow?: string
  /** Primary heading (preferred prop name). */
  heading?: string
  /** Alias for heading — used by older editorial page templates. */
  title?: string
  /** Paragraph below the heading */
  lede?: string
  /** Data provenance / date line */
  provenanceLine?: string
  /** Alias for provenanceLine — used by older editorial page templates. */
  provenance?: string
  /** Optional SVG/illustration anchored to the right of the content column */
  illustration?: React.ReactNode
  /** Tailwind class overrides on the outer section */
  className?: string
}

export function PageHero({
  crumbs,
  eyebrow,
  heading,
  title,
  lede,
  provenanceLine,
  provenance,
  illustration,
  className,
}: PageHeroProps) {
  const resolvedHeading = heading ?? title ?? ""
  const resolvedProvenance = provenanceLine ?? provenance
  const resolvedCrumbs = crumbs ?? []
  return (
    <section
      className={cn(
        "border-b border-(--color-line) bg-(--color-surface) py-10 lg:py-14",
        className,
      )}
    >
      <Container>
        {/* Breadcrumbs */}
        {resolvedCrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex flex-wrap items-center gap-1 text-(length:--text-xs) text-(--color-muted)">
            {resolvedCrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <span aria-hidden className="select-none text-(--color-line-strong)">
                    /
                  </span>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-(--color-ink) transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-(--color-ink)">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        )}

        {/* Two-column layout: copy left, illustration right (content-column anchored) */}
        <div className="flex items-start gap-10">
          <div className="min-w-0 flex-1 max-w-[52ch]">
            {eyebrow && (
              <p className="mb-2 text-(length:--text-xs) font-semibold uppercase tracking-[0.14em] text-(--color-brand)">
                {eyebrow}
              </p>
            )}
            <h1 className="text-balance text-(length:--text-4xl) font-semibold leading-[1.12] tracking-[-0.02em] text-(--color-ink)">
              {resolvedHeading}
            </h1>
            {lede && (
              <p className="mt-4 text-(length:--text-lg) leading-relaxed text-(--color-muted) max-w-[44ch]">
                {lede}
              </p>
            )}
            {resolvedProvenance && (
              <p className="mt-5 text-(length:--text-xs) text-(--color-muted) tabular-nums">
                {resolvedProvenance}
              </p>
            )}
          </div>

          {/* Illustration — anchored inside the content column, not the viewport */}
          {illustration && (
            <div
              className="hidden shrink-0 lg:block"
              aria-hidden
            >
              {illustration}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
