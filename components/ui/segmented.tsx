"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SegmentedOption {
  value: string
  label: string
}

export interface SegmentedProps {
  name: string
  options: SegmentedOption[]
  value: string
  onValueChange: (value: string) => void
  "aria-label": string
  className?: string
}

/* Segmented radio control.
 * Built on a real radiogroup of native inputs (visually hidden, not removed
 * from the a11y tree) so keyboard + screen-reader semantics are correct. The
 * label carries the visible focus ring via :focus-visible on the input. */
export function Segmented({
  name,
  options,
  value,
  onValueChange,
  className,
  ...props
}: SegmentedProps) {
  return (
    <div
      role="radiogroup"
      aria-label={props["aria-label"]}
      className={cn(
        "inline-flex rounded-(--radius-sm) border border-(--color-line) bg-(--color-surface-2) p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const checked = opt.value === value
        const id = `${name}-${opt.value}`
        return (
          <label
            key={opt.value}
            htmlFor={id}
            className={cn(
              "relative cursor-pointer rounded-[calc(var(--radius-sm)-3px)] px-3.5 py-1.5 text-(length:--text-sm) font-medium",
              "transition-colors [transition-duration:var(--duration-fast)] [transition-timing-function:var(--ease-out-quint)]",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--color-ring)",
              checked
                ? "bg-(--color-surface) text-(--color-ink) shadow-(--shadow-xs)"
                : "text-(--color-muted) hover:text-(--color-body)",
            )}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onValueChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        )
      })}
    </div>
  )
}
