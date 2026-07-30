"use client"

import { Panel } from "@/components/result/panel"
import type { CalculateResponse } from "@/lib/result"
import { CheckIcon, AlertTriangleIcon } from "lucide-react"

export function ConfidencePanel({
  confidence,
  className,
}: {
  confidence: CalculateResponse["confidence"]
  className?: string
}) {
  return (
    <Panel
      title="Confidence"
      subtitle={`${confidence.score}/100 — ${confidence.level}`}
      className={className}
    >
      {confidence.factors.length > 0 && (
        <ul className="flex flex-col gap-2">
          {confidence.factors.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-(length:--text-sm) text-(--color-body)">
              <CheckIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-(--color-repair)"
              />
              <span className="text-pretty leading-snug">{f}</span>
            </li>
          ))}
        </ul>
      )}

      {confidence.warnings.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 border-t border-(--color-line) pt-3">
          {confidence.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-(length:--text-sm) text-(--color-body)">
              <AlertTriangleIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-(--color-warn)"
              />
              <span className="text-pretty leading-snug">{w}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
