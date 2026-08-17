"use client"

import { Panel } from "@/components/result/panel"
import { Button } from "@/components/ui/button"
import type { CalculateResponse } from "@/lib/result"
import { cn } from "@/lib/utils"
import { AlertOctagonIcon, ShieldCheckIcon, SearchIcon, HelpCircleIcon } from "lucide-react"

export function RecallPanel({
  recall,
  onAddUpc,
  className,
}: {
  recall: CalculateResponse["recall"]
  onAddUpc: () => void
  className?: string
}) {
  // NO UPC SUPPLIED — an invitation, never "unavailable".
  if (recall.status === "not_checked") {
    return (
      <Panel title="Recall check" className={className}>
        <div className="flex items-start gap-3">
          <SearchIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-(--color-muted)" />
          <div className="flex flex-col items-start gap-3">
            <p className="text-pretty text-(length:--text-sm) leading-relaxed text-(--color-body)">
              Check this unit for open safety recalls. Enter its UPC and we&apos;ll match it
              against the CPSC database.
            </p>
            <Button variant="outline" size="sm" onClick={onAddUpc}>
              Add a UPC
            </Button>
          </div>
        </div>
      </Panel>
    )
  }

  const meta = {
    active: {
      Icon: AlertOctagonIcon,
      tone: "text-(--color-danger-ink)",
      wrap: "border-(--color-danger) bg-(--color-danger-tint)",
      title:
        recall.matches.length === 1
          ? "1 open recall found"
          : `${recall.matches.length} open recalls found`,
    },
    clear: {
      Icon: ShieldCheckIcon,
      tone: "text-(--color-repair-ink)",
      wrap: "",
      title: "No open recalls",
    },
    unavailable: {
      Icon: HelpCircleIcon,
      tone: "text-(--color-muted)",
      wrap: "",
      title: "Recall lookup unavailable",
    },
  }[recall.status]

  return (
    <Panel title="Recall check" className={cn(meta.wrap, className)}>
      <div className="flex items-start gap-3">
        <meta.Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", meta.tone)} />
        <div className="flex flex-col gap-2">
          <p className={cn("text-(length:--text-base) font-semibold", meta.tone)}>{meta.title}</p>

          {recall.matches.length > 0 && (
            <ul className="flex flex-col gap-2">
              {recall.matches.map((m, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="text-(length:--text-sm) font-medium text-(--color-ink)">
                    {m.company} — {m.productType}
                  </span>
                  <span className="text-(length:--text-xs) text-(--color-muted)">
                    Hazard: {m.hazard}
                  </span>
                  <span className="text-(length:--text-xs) text-(--color-muted)">
                    {m.recallNumber} · {m.recallDate}
                  </span>
                  {m.url && (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-fit text-(length:--text-xs) font-medium text-(--color-brand) underline-offset-2 hover:underline"
                    >
                      View CPSC notice
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}

          {recall.note && (
            <p className="text-pretty text-(length:--text-sm) leading-relaxed text-(--color-body)">
              {recall.note}
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
}
