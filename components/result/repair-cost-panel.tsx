"use client"

import { Panel } from "@/components/result/panel"
import { CountUp } from "@/components/result/count-up"
import type { CalculateResponse } from "@/lib/result"
import { money } from "@/lib/result"

export function RepairCostPanel({
  repairCost,
  animate,
  className,
}: {
  repairCost: CalculateResponse["repairCost"]
  animate: boolean
  className?: string
}) {
  const repeatPct = Math.round(repairCost.repeatFailureProbability * 100)
  const riskUplift = Math.max(0, repairCost.expected - repairCost.quote)

  return (
    <Panel
      title="Expected repair cost"
      subtitle="Your quote, adjusted for the risk of a repeat failure."
      className={className}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-(length:--text-xs) uppercase tracking-wide text-(--color-muted)">
            Your quote
          </span>
          <span className="readout text-(length:--text-2xl) font-semibold text-(--color-ink)">
            <CountUp value={repairCost.quote} prefix="$" animate={animate} />
          </span>
        </div>
        <span aria-hidden="true" className="text-(length:--text-xl) text-(--color-muted)">
          &rarr;
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-(length:--text-xs) uppercase tracking-wide text-(--color-muted)">
            Risk-adjusted
          </span>
          <span className="readout text-(length:--text-2xl) font-semibold text-(--color-replace-ink)">
            <CountUp value={repairCost.expected} prefix="$" animate={animate} />
          </span>
        </div>
      </div>

      <p className="mt-4 text-pretty text-(length:--text-sm) leading-relaxed text-(--color-body)">
        We estimate a{" "}
        <strong className="font-semibold text-(--color-ink)">{repeatPct}%</strong> chance
        of another failure needing roughly{" "}
        <strong className="font-semibold text-(--color-ink)">
          {money(repairCost.subsequentRepairCost)}
        </strong>{" "}
        more work.
        {riskUplift > 1 && (
          <>
            {" "}
            That pushes the true expected cost about{" "}
            <strong className="font-semibold text-(--color-ink)">
              {money(riskUplift)}
            </strong>{" "}
            above the sticker quote.
          </>
        )}
      </p>
    </Panel>
  )
}
