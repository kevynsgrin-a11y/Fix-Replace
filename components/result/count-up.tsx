"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"

interface CountUpProps {
  value: number
  /** Format the numeric value into its display string. Overrides prefix/suffix/decimals. */
  format?: (n: number) => string
  /** Convenience formatter: fixed decimals with a prefix and/or suffix. */
  decimals?: number
  prefix?: string
  suffix?: string
  /** Animation duration in ms. */
  durationMs?: number
  /** Delay before starting, in ms (lets the gauge lead). */
  delayMs?: number
  /** When false, renders the final value immediately (no count). */
  animate?: boolean
  className?: string
}

/**
 * Counts from 0 to `value` on mount, easing out. Critically, it reserves the
 * FINAL formatted width up front (an invisible, aria-hidden copy of the end
 * string) so digits never reflow the layout while ticking — bars and numbers
 * stay locked. Reduced motion snaps straight to the final value.
 */
export function CountUp({
  value,
  format,
  decimals,
  prefix = "",
  suffix = "",
  durationMs = 900,
  delayMs = 240,
  animate = true,
  className,
}: CountUpProps) {
  const reduced = usePrefersReducedMotion()
  const fmt = React.useCallback(
    (n: number) =>
      format
        ? format(n)
        : `${prefix}${n.toLocaleString("en-US", {
            minimumFractionDigits: decimals ?? 0,
            maximumFractionDigits: decimals ?? 0,
          })}${suffix}`,
    [format, prefix, suffix, decimals],
  )
  const [display, setDisplay] = React.useState(() => (reduced || !animate ? value : 0))
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (reduced || !animate) {
      setDisplay(value)
      return
    }
    let start: number | null = null
    let timer: number
    const tick = (now: number) => {
      if (start === null) start = now
      const t = Math.min(1, (now - start) / durationMs)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(value * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setDisplay(value)
    }
    timer = window.setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick)
    }, delayMs)
    return () => {
      window.clearTimeout(timer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, durationMs, delayMs, reduced, animate])

  return (
    <span className={cn("relative inline-grid", className)}>
      {/* Width reservation: the final string, laid out but invisible. */}
      <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
        {fmt(value)}
      </span>
      {/* Live animated value, overlaid in the same grid cell. */}
      <span className="col-start-1 row-start-1 whitespace-nowrap tabular-nums">
        {fmt(display)}
      </span>
    </span>
  )
}
