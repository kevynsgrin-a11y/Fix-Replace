import * as React from "react"
import { cn } from "@/lib/utils"

interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  title: string
  /** Short descriptor shown under the title. */
  caption?: string
  /** Optional element pinned to the top-right of the header (e.g. a badge). */
  action?: React.ReactNode
  /** Renders the header's heading at this level for a correct outline. */
  headingLevel?: "h2" | "h3"
}

/**
 * The shared analysis-panel shell: a titled card on the standard surface. Used
 * for every block in the result grid so spacing, borders, and heading rhythm
 * stay consistent and the document reads as one instrument.
 */
export function Panel({
  title,
  caption,
  action,
  headingLevel: Heading = "h3",
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 shadow-(--shadow-xs)",
        className,
      )}
      {...props}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <Heading className="text-(length:--text-sm) font-semibold uppercase tracking-[0.08em] text-(--color-muted)">
            {title}
          </Heading>
          {caption ? (
            <p className="text-(length:--text-xs) text-(--color-muted)">{caption}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </section>
  )
}
