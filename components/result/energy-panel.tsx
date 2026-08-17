"use client"

import { Panel } from "@/components/result/panel"
import { CountUp } from "@/components/result/count-up"
import type { CalculateResponse } from "@/lib/result"

export function EnergyPanel({
  energy,
  animate,
  className,
}: {
  energy: CalculateResponse["energy"]
  animate: boolean
  className?: string
}) {
  const savings = energy.annualSavings
  const hasGas = energy.gasRate != null && energy.gasRate > 0

  return (
    <Panel
      title="Energy"
      subtitle={
        energy.localized
          ? "Using local utility rates for your metro."
          : "Using national average utility rates."
      }
      className={className}
    >
      <div className="flex flex-col gap-1">
        <span className="text-(length:--text-xs) uppercase tracking-wide text-(--color-muted)">
          {savings >= 0 ? "A new unit saves about" : "A new unit costs about"}
        </span>
        <span className="readout text-(length:--text-3xl) font-semibold text-(--color-ink)">
          <CountUp value={Math.abs(savings)} prefix="$" animate={animate} />
          <span className="text-(length:--text-lg) text-(--color-muted)">/yr</span>
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-(--color-line) pt-4">
        <div className="flex flex-col gap-0.5">
          <dt className="text-(length:--text-xs) text-(--color-muted)">Current unit</dt>
          <dd className="readout text-(length:--text-base) font-medium text-(--color-ink)">
            ${Math.round(energy.annualOldCost)}/yr
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-(length:--text-xs) text-(--color-muted)">Replacement</dt>
          <dd className="readout text-(length:--text-base) font-medium text-(--color-ink)">
            ${Math.round(energy.annualNewCost)}/yr
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-(length:--text-xs) text-(--color-muted)">Electricity</dt>
          <dd className="readout text-(length:--text-base) font-medium text-(--color-ink)">
            ${energy.electricityRate.toFixed(3)}
            <span className="text-(length:--text-xs) text-(--color-muted)"> /kWh</span>
          </dd>
        </div>
        {hasGas && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-(length:--text-xs) text-(--color-muted)">Natural gas</dt>
            <dd className="readout text-(length:--text-base) font-medium text-(--color-ink)">
              ${energy.gasRate!.toFixed(2)}
              <span className="text-(length:--text-xs) text-(--color-muted)"> /therm</span>
            </dd>
          </div>
        )}
      </dl>
    </Panel>
  )
}
