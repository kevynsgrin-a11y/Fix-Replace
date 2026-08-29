"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/lib/use-reduced-motion"
import { Panel } from "@/components/result/panel"
import { CountUp } from "@/components/result/count-up"
import {
  money,
  years,
  type CalculationResult,
  type NpcBreakdown,
} from "@/lib/result"

interface Row {
  label: string
  /** Signed contribution to the total (credits are negative). */
  value: number
}

/** Build signed breakdown rows, dropping anything that rounds to zero. */
function breakdownRows(b: NpcBreakdown): Row[] {
  return [
    { label: "Upfront", value: b.upfront },
    { label: "Energy (present value)", value: b.energyPresentValue },
    { label: "Repeat-failure risk", value: b.riskAdjustment },
    { label: "Residual value credit", value: -b.salvageCredit },
  ].filter((r) => Math.abs(r.value) >= 0.5)
}

function BreakdownList({ rows, total }: { rows: Row[]; total: number }) {
  return (
    <dl className="mt-3 flex flex-col gap-1.5 border-t border-(--color-line) pt-3 text-(length:--text-xs)">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4">
          <dt className="text-(--color-muted)">{r.label}</dt>
          <dd className="readout text-(--color-body)">
            {r.value < 0 ? `\u2212${money(-r.value)}` : money(r.value)}
          </dd>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between gap-4 border-t border-(--color-line) pt-1.5">
        <dt className="font-semibold text-(--color-ink)">Total (today&apos;s dollars)</dt>
        <dd className="readout font-semibold text-(--color-ink)">{money(total)}</dd>
      </div>
    </dl>
  )
}

interface BarProps {
  label: string
  total: number
  /** 0–1 fraction of the widest bar. */
  fraction: number
  tone: "repair" | "replace" | "muted"
  winner: boolean
  delayMs: number
  animate: boolean
}

function Bar({ label, total, fraction, tone, winner, delayMs, animate }: BarProps) {
  const reduced = useReducedMotion()
  const fillWidth = `${Math.max(6, Math.round(fraction * 100))}%`
  const fillTone =
    tone === "repair"
      ? "bg-(--color-repair)"
      : tone === "replace"
        ? "bg-(--color-replace)"
        : "bg-(--color-line-strong)"

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-(length:--text-sm) font-medium text-(--color-ink)">
          {label}
        </span>
        <span className="readout text-(length:--text-base) font-semibold text-(--color-ink)">
          <CountUp value={total} format={money} delayMs={delayMs} />
        </span>
      </div>

      {/* Equal-height track; fill width is proportional to cost. */}
      <div className="relative h-9 overflow-hidden rounded-(--radius-sm) bg-(--color-surface-2)">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-(--radius-sm) transition-[width] [transition-timing-function:var(--ease-out-quint)]",
            animate ? "[transition-duration:var(--duration-slow)]" : "duration-0",
            fillTone,
          )}
          style={{ width: reduced || animate ? fillWidth : "0%" }}
        />
        {winner ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-(--radius-pill) bg-(--color-surface) px-2 py-0.5 text-(length:--text-2xs) font-semibold text-(--color-ink) shadow-(--shadow-xs)">
            Lower cost
          </span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Cost-over-horizon comparison. Equal-height bars, the winner pill overlaid on
 * the bar itself. On the withheld path the winner pill, break-even, and the
 * advantage claim are all suppressed — we still show the modeled totals (dimmed
 * by the parent) but make no confident dollar claim.
 */
export function CostComparison({
  npc,
  withheld,
  animate,
  className,
}: {
  npc: CalculationResult["npc"]
  withheld: boolean
  animate: boolean
  className?: string
}) {
  const max = Math.max(npc.repair, npc.replace, 1)
  const repairWins = npc.repair <= npc.replace
  const advantage = Math.abs(npc.advantageOfReplacing)

  const caption = `Present value over ${years(npc.horizonYears)} at ${(
    npc.discountRate * 100
  ).toFixed(1)}% discount`

  return (
    <Panel title="Cost over the horizon" caption={caption} className={className}>
      <div className="flex flex-col gap-4">
        <Bar
          label="Repair & keep"
          total={npc.repair}
          fraction={npc.repair / max}
          tone={withheld ? "muted" : repairWins ? "repair" : "muted"}
          winner={!withheld && repairWins}
          delayMs={260}
          animate={animate}
        />
        <Bar
          label="Replace now"
          total={npc.replace}
          fraction={npc.replace / max}
          tone={withheld ? "muted" : !repairWins ? "replace" : "muted"}
          winner={!withheld && !repairWins}
          delayMs={340}
          animate={animate}
        />
      </div>

      {withheld ? (
        <p className="mt-4 text-(length:--text-xs) leading-relaxed text-(--color-muted)">
          Because the quote falls outside a plausible range, we&apos;re not
          publishing a dollar advantage or a break-even point for this run.
        </p>
      ) : (
        <p className="mt-4 text-(length:--text-sm) leading-relaxed text-(--color-body)">
          {repairWins ? "Repairing" : "Replacing"} is cheaper by{" "}
          <strong className="font-semibold text-(--color-ink)">
            {money(advantage)}
          </strong>
          {npc.breakEvenMonths !== null ? (
            <>
              {" "}
              · replacing breaks even at{" "}
              <strong className="font-semibold text-(--color-ink)">
                {years(npc.breakEvenMonths / 12)}
              </strong>
            </>
          ) : null}
          .
        </p>
      )}

      {/* Line-item breakdowns — always rendered (also for print), zero rows hidden. */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-(length:--text-2xs) font-semibold uppercase tracking-wide text-(--color-muted)">
            Repair path
          </p>
          <BreakdownList rows={breakdownRows(npc.repairBreakdown)} total={npc.repair} />
        </div>
        <div>
          <p className="text-(length:--text-2xs) font-semibold uppercase tracking-wide text-(--color-muted)">
            Replace path
          </p>
          <BreakdownList rows={breakdownRows(npc.replaceBreakdown)} total={npc.replace} />
        </div>
      </div>
    </Panel>
  )
}
