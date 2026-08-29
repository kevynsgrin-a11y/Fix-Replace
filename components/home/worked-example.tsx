"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"

type Tone = "repair" | "replace"

interface Example {
  context: string
  verdict: string
  tone: Tone
  detail: string
  /** 0 = definitely repair (left), 100 = definitely replace (right). */
  value: number
}

const EXAMPLES: Example[] = [
  {
    context: "$260 fan motor · 5-yr refrigerator · Chicago",
    verdict: "Repair it",
    tone: "repair",
    detail: "Keeping it costs $367 less over 13 years.",
    value: 26,
  },
  {
    context: "$690 bearing job · 13-yr washer · Boston",
    verdict: "Replace it",
    tone: "replace",
    detail: "Replacing saves $907 over 12 years.",
    value: 96,
  },
  {
    context: "$230 repair · 7-yr dryer · Atlanta",
    verdict: "Lean toward repairing",
    tone: "repair",
    detail: "It's close — $68 apart over 13 years.",
    value: 42,
  },
]

const CYCLE_MS = 4000

/* Geometry: semicircle, center (120,120), radius 96, top half. */
const CX = 120
const CY = 120
const R = 96

export function WorkedExample() {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)

  // Auto-cycle unless paused (hover/focus) or reduced motion (pin to frame 0).
  React.useEffect(() => {
    if (paused || reduced) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % EXAMPLES.length)
    }, CYCLE_MS)
    return () => window.clearInterval(id)
  }, [paused, reduced])

  // If reduced motion turns on, pin to the first frame.
  React.useEffect(() => {
    if (reduced) setIndex(0)
  }, [reduced])

  const active = EXAMPLES[index]
  // Needle rotation: -90deg (left/repair) → +90deg (right/replace).
  const needleAngle = 1.8 * active.value - 90

  return (
    <section
      aria-labelledby="worked-example-heading"
      className="rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 shadow-(--shadow-sm)"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false)
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="worked-example-heading"
          className="text-(length:--text-xs) font-semibold uppercase tracking-[0.14em] text-(--color-muted)"
        >
          Real verdicts, live
        </h2>
        <span className="readout text-(length:--text-2xs) text-(--color-muted)">
          {String(index + 1).padStart(2, "0")} / {String(EXAMPLES.length).padStart(2, "0")}
        </span>
      </div>

      <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Gauge */}
        <div className="relative w-full max-w-[220px] shrink-0 sm:w-[200px]">
          <svg
            viewBox="0 0 240 150"
            className="w-full"
            role="img"
            aria-label={`Verdict gauge pointing ${
              active.value < 40
                ? "toward repair"
                : active.value > 60
                  ? "toward replace"
                  : "near the middle"
            }`}
          >
            <defs>
              <linearGradient id="gauge-track" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-repair)" />
                <stop offset="50%" stopColor="var(--color-uncertain)" />
                <stop offset="100%" stopColor="var(--color-replace)" />
              </linearGradient>
            </defs>

            {/* Track */}
            <path
              d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
              fill="none"
              stroke="url(#gauge-track)"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* End labels */}
            <text
              x={CX - R}
              y={CY + 22}
              textAnchor="middle"
              className="fill-(--color-repair-ink) text-[11px] font-semibold"
            >
              REPAIR
            </text>
            <text
              x={CX + R}
              y={CY + 22}
              textAnchor="middle"
              className="fill-(--color-replace-ink) text-[11px] font-semibold"
            >
              REPLACE
            </text>

            {/* Needle */}
            <g
              style={{
                transform: `rotate(${needleAngle}deg)`,
                transformOrigin: "120px 120px",
                transformBox: "view-box",
                transition: reduced
                  ? "none"
                  : "transform var(--duration-slow) var(--ease-out-quint)",
              }}
            >
              <polygon
                points={`${CX - 5},${CY} ${CX + 5},${CY} ${CX},${CY - (R - 6)}`}
                className="fill-(--color-ink)"
              />
            </g>
            <circle cx={CX} cy={CY} r="9" className="fill-(--color-ink)" />
            <circle cx={CX} cy={CY} r="4" className="fill-(--color-surface)" />
          </svg>
        </div>

        {/* Readout */}
        <div className="min-w-0 flex-1">
          <p className="readout text-(length:--text-2xs) leading-snug text-(--color-muted)">
            {active.context}
          </p>
          <p
            className={cn(
              "mt-1.5 text-(length:--text-xl) font-semibold tracking-[-0.01em]",
              active.tone === "repair"
                ? "text-(--color-repair-ink)"
                : "text-(--color-replace-ink)",
            )}
          >
            {active.verdict}
          </p>
          <p className="mt-1 text-pretty text-(length:--text-sm) leading-relaxed text-(--color-body)">
            {active.detail}
          </p>
        </div>
      </div>

      {/* Dots act as tabs */}
      <div
        role="group"
        aria-label="Choose a worked example"
        className="mt-4 flex items-center justify-center gap-2"
      >
        {EXAMPLES.map((ex, i) => {
          const selected = i === index
          return (
            <button
              key={ex.context}
              type="button"
              aria-pressed={selected}
              aria-label={`Example ${i + 1}: ${ex.verdict}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2.5 rounded-(--radius-pill) transition-all [transition-duration:var(--duration-base)] [transition-timing-function:var(--ease-out-quint)]",
                selected
                  ? "w-7 bg-(--color-brand)"
                  : "w-2.5 bg-(--color-line-strong) hover:bg-(--color-muted)",
              )}
            />
          )
        })}
      </div>
    </section>
  )
}
