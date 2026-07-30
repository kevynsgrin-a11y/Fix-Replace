"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { postReport } from "@/lib/result"
import type { CalculateResponse, CalculatePayload } from "@/lib/result"
import { PrinterIcon, DownloadIcon, Share2Icon, CheckIcon } from "lucide-react"

type ShareState = "idle" | "sharing" | "shared" | "disabled" | "error"

export function ResultActions({
  result,
  payload,
  announce,
}: {
  result: CalculateResponse
  payload: CalculatePayload
  announce: (msg: string) => void
}) {
  const [share, setShare] = React.useState<ShareState>("idle")

  function handleSave() {
    const blob = new Blob([JSON.stringify({ payload, result }, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "repair-or-replace-result.json"
    a.click()
    URL.revokeObjectURL(url)
    announce("Result saved to your device.")
  }

  async function handleShare() {
    setShare("sharing")
    const res = await postReport(result)
    if (res.ok) {
      setShare("shared")
      announce("Shareable link created.")
    } else if (res.disabled) {
      // 503 — sharing is turned off. Stop offering an action that can't succeed.
      setShare("disabled")
      announce("Sharing is currently disabled.")
    } else {
      setShare("error")
      announce("Couldn't create a share link. Try again.")
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={handleSave}>
        <DownloadIcon aria-hidden="true" className="size-4" />
        Save
      </Button>

      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <PrinterIcon aria-hidden="true" className="size-4" />
        Print
      </Button>

      {share === "disabled" ? (
        <p
          className="text-(length:--text-xs) leading-snug text-(--color-muted)"
          role="status"
        >
          Sharing is currently disabled.
        </p>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={share === "sharing" || share === "shared"}
        >
          {share === "shared" ? (
            <CheckIcon aria-hidden="true" className="size-4 text-(--color-repair)" />
          ) : (
            <Share2Icon aria-hidden="true" className="size-4" />
          )}
          {share === "sharing" ? "Sharing…" : share === "shared" ? "Link ready" : "Share"}
        </Button>
      )}

      {share === "error" && (
        <span className="text-(length:--text-xs) text-(--color-danger-ink)">
          Couldn&apos;t share — try again.
        </span>
      )}
    </div>
  )
}
