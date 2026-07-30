"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-(--radius-pill) border transition-colors",
          "[transition-duration:var(--duration-base)] [transition-timing-function:var(--ease-out-quint)]",
          "disabled:cursor-not-allowed disabled:opacity-55",
          checked
            ? "border-transparent bg-(--color-brand)"
            : "border-(--color-line-strong) bg-(--color-surface-3)",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-4 rounded-full bg-(--color-knob) shadow-(--shadow-xs) transition-transform",
            "[transition-duration:var(--duration-base)] [transition-timing-function:var(--ease-out-quint)]",
            checked ? "translate-x-[22px]" : "translate-x-[3px]",
          )}
        />
      </button>
    )
  },
)
Switch.displayName = "Switch"

export { Switch }
