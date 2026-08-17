import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/* Brand mark: a bidirectional swap arc, halved into repair vs replace —
 * the two-state verdict encoded as the logo. Functional, not decorative. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-7", className)}
      role="img"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="32"
        height="32"
        rx="8"
        fill="var(--color-brand)"
      />
      <path
        d="M9 13.5a7 7 0 0 1 12.2-3.2M23 18.5a7 7 0 0 1-12.2 3.2"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 6.5v3.8h-3.8M11 25.5v-3.8h3.8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-(--radius-sm) text-(--color-ink)",
        className,
      )}
      aria-label="RepairOrReplace home"
    >
      <LogoMark />
      <span className="text-(length:--text-base) font-semibold tracking-[-0.02em]">
        Repair<span className="text-(--color-muted)">Or</span>Replace
      </span>
    </Link>
  )
}
