"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TableWrapperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  "aria-label": string
}

/* Horizontally scrollable table region.
 * - Keyboard focusable (tabindex=0) so users can scroll it with the keyboard.
 * - role="region" + aria-label announces it as a landmark.
 * - Scroll-shadow cues on left/right edges that self-hide when you reach
 *   either end (and never show when there's nothing to scroll). */
export function TableWrapper({
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: TableWrapperProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const [edges, setEdges] = React.useState({ left: false, right: false })

  const update = React.useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const max = scrollWidth - clientWidth
    setEdges({
      left: scrollLeft > 1,
      right: scrollLeft < max - 1,
    })
  }, [])

  React.useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [update])

  return (
    <div className={cn("relative", className)}>
      {/* left cue */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 rounded-l-(--radius-md) transition-opacity [transition-duration:var(--duration-base)]",
          "bg-gradient-to-r from-[color-mix(in_oklab,var(--color-ink)_14%,transparent)] to-transparent",
          edges.left ? "opacity-100" : "opacity-0",
        )}
      />
      {/* right cue */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-r-(--radius-md) transition-opacity [transition-duration:var(--duration-base)]",
          "bg-gradient-to-l from-[color-mix(in_oklab,var(--color-ink)_14%,transparent)] to-transparent",
          edges.right ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={scrollerRef}
        role="region"
        tabIndex={0}
        aria-label={ariaLabel}
        className="overflow-x-auto rounded-(--radius-md) border border-(--color-line)"
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn(
        "w-full border-collapse text-(length:--text-sm)",
        className,
      )}
      {...props}
    />
  )
}

function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-(--color-line) bg-(--color-surface-2) px-4 py-2.5 text-left font-semibold text-(--color-ink)",
        className,
      )}
      {...props}
    />
  )
}

function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "border-b border-(--color-line) px-4 py-2.5 text-(--color-body)",
        className,
      )}
      {...props}
    />
  )
}

export { Table, Th, Td }
