"use client"

import { Panel } from "@/components/result/panel"
import { CountUp } from "@/components/result/count-up"
import type { CalculateResponse } from "@/lib/result"
import { useReducedMotion } from "@/lib/use-reduced-motion"
import { cn } from "@/lib/utils"

const HORIZONS = [
  { key: "survival12Months", label: "12 months" },
  { key: "survival24Months", label: "24 months" },
  { key: "survival36Months", label: "36 months" },
] as const

export function RulPanel({
  rul,
  animate,
  className,
}: {
  rul: CalculateResponse["rul"]
  animate: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  // Median at or below ~1 month of remaining life is effectively past expected life.
  const pastLife = rul.medianRemainingYears <= 0.08

  return (
    <Panel
      title="Remaining useful life"
      subtitle="Modeled with a Weibull survival curve for this appliance type and age."
      className={className}
    >
      {pastLife ? (
        <div className="flex flex-col gap-3">
          <p className="text-(length:--text-lg) font-semibold text-(--color-ink)">
            Past expected life
          </p>
          <p className="text-pretty text-(length:--text-sm) leading-relaxed text-(--color-body)">
            This unit has already outlived the typical lifespan for its type. A repair may
            buy you a few more <strong className="font-semibold text-(--color-ink)">months</strong>,
            not years — expect failures to cluster from here on, and weigh any quote against
            how soon you&apos;d be replacing it anyway.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-baseline gap-2">
            <span className="readout text-(length:--text-3xl) font-semibold text-(--color-ink)">
              <CountUp value={rul.medianRemainingYears} decimals={1} animate={animate} />
            </span>
            <span className="text-(length:--text-sm) text-(--color-muted)">
              median years remaining
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-(length:--text-xs) font-medium uppercase tracking-wide text-(--color-muted)">
              Chance it survives the next…
            </p>
            {HORIZONS.map((h) => {
              const pct = Math.round(rul[h.key] * 100)
              return (
                <div key={h.key} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-(length:--text-sm) text-(--color-body)">{h.label}</span>
                    <span className="readout text-(length:--text-sm) font-semibold text-(--color-ink)">
                      <CountUp value={pct} suffix="%" animate={animate} />
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-(--radius-pill) bg-(--color-surface-3)"
                    role="img"
                    aria-label={`${pct}% chance of surviving ${h.label}`}
                  >
                    <div
                      className={cn(
                        "h-full rounded-(--radius-pill) bg-(--color-brand) transition-[width] ease-(--ease-out-quint)",
                        animate ? "duration-[900ms]" : "duration-0",
                      )}
                      // Start at 0% so the CSS width transition has something to
                      // animate from — a constant width never fires a transition.
                      // Reduced-motion users skip straight to the true value,
                      // which the duration-0 class above keeps instant.
                      style={{ width: reduced || animate ? `${pct}%` : "0%" }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Panel>
  )
}
