import * as React from "react"
import { cn } from "@/lib/utils"

/* Forces a fixed color scheme for its subtree regardless of the active theme,
 * so the components page can show light and dark side by side. Applies the
 * `.dark` class + a canvas background so tokens resolve correctly. */
export function ThemeScope({
  scheme,
  className,
  children,
}: {
  scheme: "light" | "dark"
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        scheme === "dark" ? "dark" : "",
        "bg-[--color-canvas] text-[--color-body]",
        className,
      )}
      data-theme={scheme}
    >
      {children}
    </div>
  )
}
