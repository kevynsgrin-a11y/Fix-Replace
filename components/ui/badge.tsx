import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[--radius-xs] border px-2 py-0.5 text-[length:var(--text-2xs)] font-semibold uppercase tracking-wide [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral:
          "border-[--color-line-strong] bg-[--color-surface-2] text-[--color-body]",
        brand:
          "border-transparent bg-[--color-brand-tint] text-[--color-brand-ink]",
        repair:
          "border-transparent bg-[--color-repair-tint] text-[--color-repair-ink]",
        replace:
          "border-transparent bg-[--color-replace-tint] text-[--color-replace-ink]",
        uncertain:
          "border-transparent bg-[--color-surface-3] text-[--color-uncertain]",
        danger:
          "border-transparent bg-[color-mix(in_oklab,var(--color-danger)_16%,transparent)] text-[--color-danger-ink]",
        warn: "border-transparent bg-[color-mix(in_oklab,var(--color-warn)_16%,transparent)] text-[--color-warn]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
