"use client"

import * as React from "react"
import { ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ResultGauge } from "@/components/result/result-gauge"
import { CountUp } from "@/components/result/count-up"
import {
  confidenceVariant,
  type CalculationResult,
} from "@/lib/result"

const DANGEROUS = ["gas", "high_voltage", "refrigerant"]

const LEVEL_LABEL: Record<string, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  low: "Low confidence",
  suppressed: "Verdict withheld",
}

/**
 * The verdict hero: the sweeping gauge, the headline, a confidence badge, and —
 * when the fault is hazardous — a "Licensed pro required" danger badge placed
 * HERE at the verdict, never buried in a panel below. The headline carries the
 * focus target (tabIndex -1) so success moves focus straight to the answer.
 */
export function VerdictHero({
  result,
  animate,
  headlineRef,
}: {
  result: CalculationResult
  animate: boolean
  headlineRef: React.Ref<HTMLHeadingElement>
}) {
  const { verdict, verdictHeadline, confidence, safety, gaugePosition } = result
  const hazardous = safety.hazards.some((h) => DANGEROUS.includes(h))

  const headlineTint =
    verdict === "repair"
      ? "text-(--color-repair-ink)"
      : verdict === "replace"
        ? "text-(--color-replace-ink)"
        : "text-(--color-ink)"

  return (
    <div className="flex flex-col items-center gap-6 rounded-(--radius-xl) border border-(--color-line) bg-(--color-surface) p-6 shadow-(--shadow-sm) sm:p-8 md:flex-row md:items-center md:gap-10">
      <div className="shrink-0">
        <ResultGauge position={gaugePosition} verdict={verdict} animate={animate} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center md:items-start md:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <Badge variant={confidenceVariant(confidence.level)}>
            {LEVEL_LABEL[confidence.level] ?? "Confidence"}
            {confidence.level !== "suppressed" ? (
              <span className="tabular-nums">
                {" · "}
                <CountUp
                  value={confidence.score}
                  format={(n) => `${Math.round(n)}`}
                  durationMs={700}
                  delayMs={120}
                />
                /100
              </span>
            ) : null}
          </Badge>

          {hazardous ? (
            <Badge variant="danger">
              <ShieldAlert aria-hidden />
              Licensed pro required
            </Badge>
          ) : null}
        </div>

        <h2
          ref={headlineRef}
          tabIndex={-1}
          className={`text-balance text-(length:--text-4xl) font-semibold tracking-[-0.01em] outline-none ${headlineTint}`}
        >
          {verdictHeadline}
        </h2>
      </div>
    </div>
  )
}
