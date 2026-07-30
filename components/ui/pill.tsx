import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const pillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[--radius-pill] border px-3 py-1 text-[length:var(--text-xs)] font-medium [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral:
          "border-[--color-line] bg-[--color-surface] text-[--color-body]",
        brand:
          "border-[color-mix(in_oklab,var(--color-brand)_35%,transparent)] bg-[--color-brand-tint] text-[--color-brand-ink]",
        repair:
          "border-[color-mix(in_oklab,var(--color-repair)_35%,transparent)] bg-[--color-repair-tint] text-[--color-repair-ink]",
        replace:
          "border-[color-mix(in_oklab,var(--color-replace)_35%,transparent)] bg-[--color-replace-tint] text-[--color-replace-ink]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {}

function Pill({ className, variant, ...props }: PillProps) {
  return <span className={cn(pillVariants({ variant }), className)} {...props} />
}

export { Pill, pillVariants }
