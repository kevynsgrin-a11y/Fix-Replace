import * as React from "react"
import { cn } from "@/lib/utils"

/* Forces a fixed color scheme for its subtree regardless of the active site
 * theme, so the components page can show light and dark side by side.
 *
 * - `data-theme` re-asserts the matching token set (see globals.css), which
 *   works even when this scope is nested inside a `.dark` ancestor.
 * - The `dark` class is mirrored for the dark scope so any `.dark`-scoped
 *   utility styling also resolves.
 * - `color-scheme` + a canvas background keep form controls and the surface
 *   consistent with the forced theme. */
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
      data-theme={scheme}
      className={cn(
        scheme === "dark" && "dark",
        "bg-[--color-canvas] text-[--color-body] [color-scheme:var(--_cs)]",
        scheme === "dark" ? "[--_cs:dark]" : "[--_cs:light]",
        className,
      )}
    >
      {children}
    </div>
  )
}
