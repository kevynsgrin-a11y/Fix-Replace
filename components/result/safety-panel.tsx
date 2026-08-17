"use client"

import { Panel } from "@/components/result/panel"
import type { CalculateResponse } from "@/lib/result"
import { ShieldAlertIcon, ShieldCheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function SafetyPanel({
  safety,
  className,
}: {
  safety: CalculateResponse["safety"]
  className?: string
}) {
  const hasHazard = safety.professionalRequired || safety.hazards.length > 0

  return (
    <Panel
      title="Safety"
      className={cn(
        hasHazard && "border-(--color-danger) bg-(--color-danger-tint)",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {hasHazard ? (
          <ShieldAlertIcon
            aria-hidden="true"
            className="mt-0.5 size-6 shrink-0 text-(--color-danger-ink)"
          />
        ) : (
          <ShieldCheckIcon
            aria-hidden="true"
            className="mt-0.5 size-6 shrink-0 text-(--color-repair-ink)"
          />
        )}
        <div className="flex flex-col gap-2">
          <p
            className={cn(
              "text-(length:--text-lg) font-semibold",
              hasHazard ? "text-(--color-danger-ink)" : "text-(--color-repair-ink)",
            )}
          >
            {safety.professionalRequired
              ? "Licensed pro required"
              : hasHazard
                ? "Handle with care"
                : "No special hazards flagged"}
          </p>

          {safety.messages.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {safety.messages.map((m, i) => (
                <li
                  key={i}
                  className="text-pretty text-(length:--text-sm) leading-relaxed text-(--color-body)"
                >
                  {m}
                </li>
              ))}
            </ul>
          )}

          {safety.diySuppressed && (
            <p className="text-(length:--text-sm) leading-relaxed text-(--color-body)">
              We&apos;ve withheld any DIY suggestion for this repair — the risk isn&apos;t
              worth it.
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
}
