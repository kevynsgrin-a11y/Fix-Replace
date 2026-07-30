"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

/* Theme toggle.
 * - aria-pressed reflects whether dark mode is active.
 * - The accessible label describes what activating the control will DO
 *   ("Switch to dark theme"), not just its name.
 * - Renders a stable shell before mount to avoid hydration mismatch. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"
  const label = !mounted
    ? "Toggle color theme"
    : isDark
      ? "Switch to light theme"
      : "Switch to dark theme"

  return (
    <button
      type="button"
      aria-pressed={mounted ? isDark : undefined}
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-[--radius-sm] border border-[--color-line] bg-[--color-surface] text-[--color-body]",
        "transition-colors [transition-duration:var(--duration-fast)] [transition-timing-function:var(--ease-out-quint)]",
        "hover:bg-[--color-surface-2] hover:text-[--color-ink]",
        className,
      )}
    >
      {isDark ? (
        <Sun aria-hidden="true" className="size-[18px]" />
      ) : (
        <Moon aria-hidden="true" className="size-[18px]" />
      )}
    </button>
  )
}

/* Inline labelled theme row for the mobile drawer. */
export function ThemeToggleRow() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === "dark"
  const label = !mounted
    ? "Toggle color theme"
    : isDark
      ? "Switch to light theme"
      : "Switch to dark theme"

  return (
    <div className="flex items-center justify-between rounded-[--radius-sm] border border-[--color-line] bg-[--color-surface] px-4 py-3">
      <span
        id="drawer-theme-label"
        className="text-[length:var(--text-sm)] font-medium text-[--color-ink]"
      >
        Theme
      </span>
      <button
        type="button"
        aria-pressed={mounted ? isDark : undefined}
        aria-label={label}
        aria-describedby="drawer-theme-label"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "inline-flex items-center gap-2 rounded-[--radius-sm] border border-[--color-line-strong] bg-[--color-surface-2] px-3 py-1.5",
          "text-[length:var(--text-sm)] font-medium text-[--color-ink]",
          "transition-colors [transition-duration:var(--duration-fast)] hover:bg-[--color-surface-3]",
        )}
      >
        {isDark ? (
          <Sun aria-hidden="true" className="size-4" />
        ) : (
          <Moon aria-hidden="true" className="size-4" />
        )}
        {mounted ? (isDark ? "Dark" : "Light") : "Theme"}
      </button>
    </div>
  )
}
