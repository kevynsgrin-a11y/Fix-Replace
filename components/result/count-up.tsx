"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"

interface CountUpProps {
  value: number
  /** Format the numeric value into its display string. */
  format: (n: number) => string
  /** Animation duration in ms. */
  durationMs?: number
  /** Delay before starting, in ms (lets the gauge lead). */
  delayMs?: number
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
  durationMs = 900,
  delayMs = 240,
  className,
}: CountUpProps) {
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = React.useState(() => (reduced ? value : 0))
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (reduced) {
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
  }, [value, durationMs, delayMs, reduced])

  return (
    <span className={cn("relative inline-grid", className)}>
      {/* Width reservation: the final string, laid out but invisible. */}
      <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">
        {format(value)}
      </span>
      {/* Live animated value, overlaid in the same grid cell. */}
      <span className="col-start-1 row-start-1 whitespace-nowrap tabular-nums">
        {format(display)}
      </span>
    </span>
  )
}
