"use client"

import * as React from "react"
import type { CalculateResponse, CalculatePayload } from "@/lib/result"
import { isWithheld } from "@/lib/result"
import { useReducedMotion } from "@/lib/use-reduced-motion"
import { cn } from "@/lib/utils"

import { VerdictHero } from "@/components/result/verdict-hero"
import { DriverSentence } from "@/components/result/driver-sentence"
import { CostComparison } from "@/components/result/cost-comparison"
import { RulPanel } from "@/components/result/rul-panel"
import { RepairCostPanel } from "@/components/result/repair-cost-panel"
import { EnergyPanel } from "@/components/result/energy-panel"
import { ConfidencePanel } from "@/components/result/confidence-panel"
import { SafetyPanel } from "@/components/result/safety-panel"
import { RecallPanel } from "@/components/result/recall-panel"
import { ProvenancePanel } from "@/components/result/provenance-panel"
import { PartnerLinks } from "@/components/result/partner-links"
import { ResultActions } from "@/components/result/result-actions"

export const ResultDocument = React.forwardRef<
  HTMLHeadingElement,
  {
    result: CalculateResponse
    payload: CalculatePayload
    announce: (msg: string) => void
    onAddUpc: () => void
  }
>(function ResultDocument({ result, payload, announce, onAddUpc }, headlineRef) {
  const reduced = useReducedMotion()
  // Gate count-up / sweep until after mount so numbers reserve width first.
  const [animate, setAnimate] = React.useState(false)
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(!reduced))
    return () => cancelAnimationFrame(id)
  }, [reduced])

  const withheld = isWithheld(result)
  const hasHazard =
    result.safety.professionalRequired || result.safety.hazards.length > 0

  return (
    <div className="flex flex-col gap-6">
      <VerdictHero result={result} animate={animate} headlineRef={headlineRef} />

      {/* One plain sentence — suppressed entirely on the withheld path. */}
      {!withheld && <DriverSentence result={result} />}

      {/* Withheld banner — sets the honest frame before any figures. */}
      {withheld && (
        <div className="rounded-(--radius-md) border border-(--color-warn) bg-(--color-warn-tint) px-4 py-3">
          <p className="text-pretty text-(length:--text-sm) leading-relaxed text-(--color-warn-ink)">
            Shown for reference only — we can&apos;t stand behind these figures with the
            quote you entered.
          </p>
        </div>
      )}

      <ResultActions result={result} payload={payload} announce={announce} />

      {/* Analysis — dimmed on the withheld path so it never reads as confident. */}
      <div
        className={cn(
          "grid grid-cols-12 gap-4 transition-opacity",
          withheld && "opacity-[0.78]",
        )}
      >
        {/* Safety moves FIRST and spans full width when a hazard exists. */}
        {hasHazard && (
          <SafetyPanel safety={result.safety} className="col-span-12" />
        )}

        <CostComparison
          npc={result.npc}
          withheld={withheld}
          animate={animate}
          className="col-span-12 lg:col-span-7"
        />
        <RulPanel
          rul={result.rul}
          animate={animate}
          className="col-span-12 lg:col-span-5"
        />

        <RepairCostPanel
          repairCost={result.repairCost}
          animate={animate}
          className="col-span-12 sm:col-span-6"
        />
        <EnergyPanel
          energy={result.energy}
          animate={animate}
          className="col-span-12 sm:col-span-6"
        />

        <ConfidencePanel
          confidence={result.confidence}
          className="col-span-12 sm:col-span-6"
        />

        {/* Recall: half-width invitation when not checked; otherwise status. */}
        <RecallPanel
          recall={result.recall}
          onAddUpc={onAddUpc}
          className="col-span-12 sm:col-span-6"
        />

        {/* Safety in its normal slot when there is no hazard to escalate. */}
        {!hasHazard && (
          <SafetyPanel safety={result.safety} className="col-span-12 sm:col-span-6" />
        )}

        <ProvenancePanel
          provenance={result.provenance}
          npc={result.npc}
          className="col-span-12"
        />
      </div>

      {/* Partner links LAST, on a flatter surface. */}
      <PartnerLinks monetization={result.monetization} />
    </div>
  )
})
