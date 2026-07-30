"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"
import type { Verdict } from "@/lib/result"

interface ResultGaugeProps {
  /** 0 = strongly repair, 100 = strongly replace. Null = withheld. */
  position: number | null
  verdict: Verdict
  /** When false the needle holds at center; the parent flips this on after mount
   *  so the sweep plays only once layout (and number width) is reserved. */
  animate?: boolean
  className?: string
}

/* Semicircle geometry. */
const CX = 140
const CY = 140
const R = 112

const needleTint: Record<Verdict, string> = {
  repair: "fill-(--color-repair-ink)",
  replace: "fill-(--color-replace-ink)",
  uncertain: "fill-(--color-muted)",
}

/**
 * The verdict gauge. On reveal the needle sweeps from the neutral center to
 * `position`, tinted by the verdict. Reduced motion pins it to the final angle
 * with no sweep. A null position (withheld) renders an intentionally
 * indeterminate face — dimmed track, no needle, a centered dash — so we never
 * imply a precise reading we can't stand behind.
 */
export function ResultGauge({ position, verdict, animate = true, className }: ResultGaugeProps) {
  const reduced = usePrefersReducedMotion()
  const withheld = position === null
  const target = withheld ? 50 : position
  const targetAngle = 1.8 * target - 90

  // Sweep: hold centered until `animate` flips on (post-mount), then transition.
  const [angle, setAngle] = React.useState(reduced ? targetAngle : -0)
  React.useEffect(() => {
    if (reduced) {
      setAngle(targetAngle)
      return
    }
    if (!animate) return
    // Two rAFs so the initial (centered) frame paints before we transition.
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAngle(targetAngle)),
    )
    return () => cancelAnimationFrame(id)
  }, [targetAngle, reduced, animate])

  const readingLabel = withheld
    ? "indeterminate — verdict withheld"
    : target < 40
      ? "toward repairing"
      : target > 60
        ? "toward replacing"
        : "near break-even"

  return (
    <div className={cn("relative w-full max-w-[300px]", className)}>
      <svg
        viewBox="0 0 280 176"
        className="w-full"
        role="img"
        aria-label={`Repair-or-replace gauge pointing ${readingLabel}`}
      >
        <defs>
          <linearGradient id="result-gauge-track" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-repair)" />
            <stop offset="50%" stopColor="var(--color-uncertain)" />
            <stop offset="100%" stopColor="var(--color-replace)" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="url(#result-gauge-track)"
          strokeWidth="18"
          strokeLinecap="round"
          className={cn(withheld && "opacity-35")}
        />

        {/* Break-even tick at 50 */}
        <line
          x1={CX}
          y1={CY - R - 9}
          x2={CX}
          y2={CY - R + 9}
          stroke="var(--color-surface)"
          strokeWidth="3"
          className={cn(withheld && "opacity-40")}
        />

        {/* End labels */}
        <text
          x={CX - R}
          y={CY + 24}
          textAnchor="middle"
          className="fill-(--color-repair-ink) text-[13px] font-semibold"
        >
          REPAIR
        </text>
        <text
          x={CX + R}
          y={CY + 24}
          textAnchor="middle"
          className="fill-(--color-replace-ink) text-[13px] font-semibold"
        >
          REPLACE
        </text>

        {withheld ? (
          <text
            x={CX}
            y={CY - 22}
            textAnchor="middle"
            className="fill-(--color-muted) text-[40px] font-semibold"
          >
            &ndash;
          </text>
        ) : (
          <>
            {/* Needle */}
            <g
              style={{
                transform: `rotate(${angle}deg)`,
                transformOrigin: "140px 140px",
                transformBox: "view-box",
                transition: reduced
                  ? "none"
                  : "transform var(--duration-slow) var(--ease-out-quint)",
              }}
            >
              <polygon
                points={`${CX - 6},${CY} ${CX + 6},${CY} ${CX},${CY - (R - 8)}`}
                className={needleTint[verdict]}
              />
            </g>
            <circle cx={CX} cy={CY} r="12" className={needleTint[verdict]} />
            <circle cx={CX} cy={CY} r="5.5" className="fill-(--color-surface)" />
          </>
        )}
      </svg>
    </div>
  )
}
