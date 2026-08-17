import * as React from "react"
import {
  Info,
  TriangleAlert,
  OctagonAlert,
  Wrench,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type CalloutVariant = "info" | "warn" | "danger" | "repair" | "replace"

const config: Record<
  CalloutVariant,
  { icon: LucideIcon; wrap: string; iconColor: string; title: string }
> = {
  info: {
    icon: Info,
    wrap: "border-[color-mix(in_oklab,var(--color-brand)_28%,transparent)] bg-(--color-brand-tint)",
    iconColor: "text-(--color-brand-ink)",
    title: "text-(--color-brand-ink)",
  },
  warn: {
    icon: TriangleAlert,
    wrap: "border-[color-mix(in_oklab,var(--color-warn)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-warn)_10%,var(--color-surface))]",
    iconColor: "text-(--color-warn)",
    title: "text-(--color-warn)",
  },
  danger: {
    icon: OctagonAlert,
    wrap: "border-[color-mix(in_oklab,var(--color-danger)_30%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_9%,var(--color-surface))]",
    iconColor: "text-(--color-danger-ink)",
    title: "text-(--color-danger-ink)",
  },
  repair: {
    icon: Wrench,
    wrap: "border-[color-mix(in_oklab,var(--color-repair)_30%,transparent)] bg-(--color-repair-tint)",
    iconColor: "text-(--color-repair-ink)",
    title: "text-(--color-repair-ink)",
  },
  replace: {
    icon: ShoppingCart,
    wrap: "border-[color-mix(in_oklab,var(--color-replace)_30%,transparent)] bg-(--color-replace-tint)",
    iconColor: "text-(--color-replace-ink)",
    title: "text-(--color-replace-ink)",
  },
}

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CalloutVariant
  title?: string
  icon?: boolean
}

export function Callout({
  variant = "info",
  title,
  icon = true,
  className,
  children,
  ...props
}: CalloutProps) {
  const c = config[variant]
  const Icon = c.icon
  return (
    <div
      className={cn(
        "flex gap-3 rounded-(--radius-md) border p-4 text-(length:--text-sm) text-(--color-body)",
        c.wrap,
        className,
      )}
      {...props}
    >
      {icon && (
        <Icon
          aria-hidden="true"
          className={cn("mt-0.5 size-5 shrink-0", c.iconColor)}
        />
      )}
      <div className="flex flex-col gap-1">
        {title && (
          <p className={cn("font-semibold", c.title)}>{title}</p>
        )}
        <div className="[&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
      </div>
    </div>
  )
}
