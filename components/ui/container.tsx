import * as React from "react"
import { cn } from "@/lib/utils"

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  wide?: boolean
  as?: React.ElementType
}

/* Content = 1120px, wide = 1280px. Gutter scales with viewport. */
export function Container({
  wide = false,
  as: Comp = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Comp
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        wide ? "max-w-[--container-wide]" : "max-w-[--container-content]",
        className,
      )}
      {...props}
    />
  )
}
