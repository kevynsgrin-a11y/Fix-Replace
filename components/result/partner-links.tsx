"use client"

import type { CalculateResponse } from "@/lib/result"
import { ExternalLinkIcon } from "lucide-react"

export function PartnerLinks({
  monetization,
}: {
  monetization: CalculateResponse["monetization"]
}) {
  const links = monetization.affiliateLinks ?? []
  const leadGen = monetization.leadGen ?? []
  if (links.length === 0 && leadGen.length === 0) return null

  return (
    // Deliberately flatter than the analysis panels: no elevation, muted surface,
    // so these read as optional and clearly separate from the verdict.
    <section
      aria-labelledby="partner-heading"
      className="rounded-(--radius-lg) bg-(--color-surface-2) p-5 print:hidden"
    >
      <h2
        id="partner-heading"
        className="text-(length:--text-sm) font-semibold text-(--color-body)"
      >
        Optional next steps
      </h2>
      <p className="mt-1 text-(length:--text-xs) leading-relaxed text-(--color-muted)">
        {monetization.disclosure}
      </p>

      {links.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {links.map((l, i) => (
            <li key={i}>
              <a
                href={l.url}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-(--radius-sm) border border-(--color-line) bg-(--color-surface) px-4 py-3 text-(length:--text-sm) text-(--color-ink) transition-colors hover:bg-(--color-surface-2)"
              >
                <span>
                  {l.label}
                  <span className="text-(--color-muted)"> · {l.merchant}</span>
                </span>
                <ExternalLinkIcon aria-hidden="true" className="size-4 shrink-0 text-(--color-muted)" />
              </a>
            </li>
          ))}
        </ul>
      )}

      {leadGen.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {leadGen.map((g, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-(--radius-sm) border border-dashed border-(--color-line) px-4 py-3 text-(length:--text-sm) text-(--color-body)"
            >
              <span>{g.label}</span>
              <span className="readout shrink-0 text-(length:--text-xs) text-(--color-muted)">
                est. ${g.estimatedInvoiceLow}&ndash;${g.estimatedInvoiceHigh}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
