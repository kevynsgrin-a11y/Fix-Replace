"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { CalcError } from "@/lib/result"
import { WifiOffIcon, ServerCrashIcon, CircleAlertIcon } from "lucide-react"

export const ResultError = React.forwardRef<
  HTMLHeadingElement,
  { error: unknown; onRetry: () => void }
>(function ResultError({ error, onRetry }, ref) {
  const kind = error instanceof CalcError ? error.kind : "server"

  const copy = {
    network: {
      Icon: WifiOffIcon,
      heading: "We couldn't reach our servers",
      body: "Check your internet connection and try again — your inputs are still here.",
    },
    server: {
      Icon: ServerCrashIcon,
      heading: "Our pricing service is having a moment",
      body: "This is on us, not you. Give it a few seconds and try again.",
    },
    client: {
      Icon: CircleAlertIcon,
      heading: "Those inputs didn't quite add up",
      body: "Something about the details entered couldn't be processed. Adjust them and try again.",
    },
  }[kind]

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-6"
    >
      <div className="flex items-start gap-3">
        <copy.Icon aria-hidden="true" className="mt-1 size-6 shrink-0 text-(--color-danger-ink)" />
        <div className="flex flex-col gap-1">
          <h2
            ref={ref}
            tabIndex={-1}
            className="text-(length:--text-xl) font-semibold text-(--color-ink) outline-none"
          >
            {copy.heading}
          </h2>
          <p className="text-pretty text-(length:--text-sm) leading-relaxed text-(--color-body)">
            {copy.body}
          </p>
        </div>
      </div>
      <Button variant="primary" size="md" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
})
