"use client"

/**
 * MultiplierDial — SVG gauge that encodes a labor-rate multiplier
 * on a 0.90×–1.30× scale.
 *
 * - Arc spans 220° (−110° to +110° from the 6 o'clock bottom)
 * - 1.00× baseline is at the arc midpoint
 * - Needle tip sweeps to the multiplier position
 * - Arc left of baseline = green (below average cost)
 * - Arc right of baseline = amber (above average cost)
 * - Scales correctly in both light and dark mode via CSS tokens
 */

import * as React from "react"

const MIN = 0.9
const MAX = 1.3
// Arc spans 220°; starts at 160° (measuring from right / 3 o'clock = 0°)
const START_DEG = 160
const END_DEG = 20 // wraps through 360°
const TOTAL_DEG = 220 // 360 - 140 sweep
const R = 70  // arc radius
const CX = 90
const CY = 90
const NEEDLE_LEN = 54

function degToRad(d: number) {
  return (d * Math.PI) / 180
}

function arcPoint(deg: number, r = R) {
  const rad = degToRad(deg)
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
  }
}

/** Map multiplier to arc degree */
function multToDeg(m: number) {
  const t = (m - MIN) / (MAX - MIN)  // 0→1
  return START_DEG - t * TOTAL_DEG   // clockwise
}

/** SVG arc path string */
function arcPath(startDeg: number, endDeg: number, r = R) {
  const start = arcPoint(startDeg, r)
  const end = arcPoint(endDeg, r)
  const sweep = startDeg > endDeg ? 0 : 1
  const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`
}

interface MultiplierDialProps {
  multiplier: number
  /** Metro name for accessible label */
  metroName: string
  size?: number
}

export function MultiplierDial({
  multiplier,
  metroName,
  size = 180,
}: MultiplierDialProps) {
  const clampedMult = Math.max(MIN, Math.min(MAX, multiplier))
  const needleDeg = multToDeg(clampedMult)
  const baselineDeg = multToDeg(1.0) // always midpoint

  const needleEnd = arcPoint(needleDeg, NEEDLE_LEN)
  const needleBase1 = arcPoint(needleDeg + 90, 7)
  const needleBase2 = arcPoint(needleDeg - 90, 7)

  const isAbove = multiplier >= 1.0

  // Green arc: from START_DEG down to baseline (below-average region)
  const greenPath = arcPath(START_DEG, baselineDeg)
  // Amber arc: from baseline up to END_DEG (above-average region)
  const amberPath = arcPath(baselineDeg, END_DEG)

  const label = `${metroName} labor rate: ${multiplier.toFixed(2)}× national average`

  return (
    <svg
      width={size}
      height={size * 0.85}
      viewBox="0 0 180 153"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>

      {/* Track — full arc */}
      <path
        d={arcPath(START_DEG, END_DEG)}
        fill="none"
        stroke="var(--color-line)"
        strokeWidth={10}
        strokeLinecap="round"
      />

      {/* Green segment (≤ 1.00×) */}
      <path
        d={greenPath}
        fill="none"
        stroke="var(--color-repair)"
        strokeWidth={10}
        strokeLinecap="round"
      />

      {/* Amber segment (> 1.00×) */}
      <path
        d={amberPath}
        fill="none"
        stroke="var(--color-replace)"
        strokeWidth={10}
        strokeLinecap="round"
      />

      {/* Active needle arc (colored) */}
      <path
        d={isAbove ? arcPath(baselineDeg, needleDeg) : arcPath(needleDeg, baselineDeg)}
        fill="none"
        stroke={isAbove ? "var(--color-replace)" : "var(--color-repair)"}
        strokeWidth={10}
        strokeLinecap="butt"
        opacity={0.85}
      />

      {/* Baseline tick */}
      {(() => {
        const inner = arcPoint(baselineDeg, R - 12)
        const outer = arcPoint(baselineDeg, R + 4)
        return (
          <line
            x1={inner.x} y1={inner.y}
            x2={outer.x} y2={outer.y}
            stroke="var(--color-ink)"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.5}
          />
        )
      })()}

      {/* Brand accent ticks at MIN, 1.10, 1.20, MAX */}
      {[MIN, 1.1, 1.2, MAX].map((v) => {
        const d = multToDeg(v)
        const inner = arcPoint(d, R - 8)
        const outer = arcPoint(d, R + 2)
        return (
          <line
            key={v}
            x1={inner.x} y1={inner.y}
            x2={outer.x} y2={outer.y}
            stroke="var(--color-brand)"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.6}
          />
        )
      })}

      {/* Needle */}
      <polygon
        points={`${needleEnd.x},${needleEnd.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
        fill="var(--color-ink)"
      />

      {/* Pivot */}
      <circle cx={CX} cy={CY} r={5} fill="var(--color-ink)" />
      <circle cx={CX} cy={CY} r={2.5} fill="var(--color-canvas)" />

      {/* Scale labels */}
      {[
        { v: 0.9,  label: "0.9×" },
        { v: 1.0,  label: "1.0×" },
        { v: 1.1,  label: "1.1×" },
        { v: 1.2,  label: "1.2×" },
        { v: 1.3,  label: "1.3×" },
      ].map(({ v, label: lbl }) => {
        const d = multToDeg(v)
        const p = arcPoint(d, R + 20)
        return (
          <text
            key={v}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="var(--color-muted)"
            fontFamily="system-ui, sans-serif"
          >
            {lbl}
          </text>
        )
      })}

      {/* Centre readout */}
      <text
        x={CX}
        y={CY + 22}
        textAnchor="middle"
        fontSize="18"
        fontWeight="600"
        fill="var(--color-ink)"
        fontFamily="system-ui, sans-serif"
      >
        {multiplier.toFixed(2)}×
      </text>
      <text
        x={CX}
        y={CY + 36}
        textAnchor="middle"
        fontSize="9"
        fill="var(--color-muted)"
        fontFamily="system-ui, sans-serif"
      >
        vs. national
      </text>
    </svg>
  )
}
