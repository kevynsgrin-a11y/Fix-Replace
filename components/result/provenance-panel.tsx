"use client"

import type { CalculateResponse } from "@/lib/result"
import { ChevronDownIcon } from "lucide-react"

export function ProvenancePanel({
  provenance,
  npc,
  className,
}: {
  provenance: CalculateResponse["provenance"]
  npc: CalculateResponse["npc"]
  className?: string
}) {
  return (
    <details
      className={`group rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) print:open ${className ?? ""}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-(--radius-lg) p-5 text-(length:--text-base) font-semibold text-(--color-ink) [&::-webkit-details-marker]:hidden">
        How we calculated this
        <ChevronDownIcon
          aria-hidden="true"
          className="size-5 shrink-0 text-(--color-muted) transition-transform group-open:rotate-180 print:hidden"
        />
      </summary>

      <div className="flex flex-col gap-4 border-t border-(--color-line) px-5 pb-5 pt-4">
        <p className="text-pretty text-(length:--text-sm) leading-relaxed text-(--color-body)">
          Net-present-cost compared over a{" "}
          <strong className="font-semibold text-(--color-ink)">{npc.horizonYears}-year</strong>{" "}
          horizon at a{" "}
          <strong className="font-semibold text-(--color-ink)">
            {Math.round(npc.discountRate * 100)}%
          </strong>{" "}
          discount rate. Figures are estimates, not quotes.
        </p>

        <dl className="flex flex-col divide-y divide-(--color-line)">
          {provenance.map((p, i) => (
            <div key={i} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
              <dt className="text-(length:--text-sm) font-medium text-(--color-ink)">
                {p.label}
              </dt>
              <dd className="text-(length:--text-xs) text-(--color-muted)">{p.source}</dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  )
}
