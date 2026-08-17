"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import type { CalculationResult, CalculatePayload } from "@/lib/result"
import { ResultDocument } from "@/components/result/result-document"
import { Button } from "@/components/ui/button"

type Status = "idle" | "loading" | "success" | "error-missing" | "error-fetch"

export function SharedResult() {
  const params = useSearchParams()
  const id = params.get("id")

  const [status, setStatus] = React.useState<Status>(id ? "loading" : "error-missing")
  const [result, setResult] = React.useState<CalculationResult | null>(null)
  const [payload, setPayload] = React.useState<CalculatePayload | null>(null)
  const [errorKind, setErrorKind] = React.useState<"network" | "server" | null>(null)

  React.useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setStatus("loading")
      try {
        const res = await fetch(`/api/report?id=${encodeURIComponent(id!)}`)
        if (cancelled) return
        if (!res.ok) {
          setErrorKind(res.status >= 500 ? "server" : "network")
          setStatus("error-fetch")
          return
        }
        const data = await res.json()
        if (cancelled) return
        // The report endpoint returns { result, payload } when sharing is enabled.
        setResult(data.result ?? data)
        setPayload(data.payload ?? null)
        setStatus("success")
      } catch {
        if (!cancelled) {
          setErrorKind("network")
          setStatus("error-fetch")
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  if (status === "loading") {
    return (
      <div className="flex min-h-64 items-center justify-center" aria-live="polite" aria-busy>
        <p className="text-(length:--text-sm) text-(--color-muted)">Loading result&hellip;</p>
      </div>
    )
  }

  if (status === "error-missing") {
    return (
      <div
        role="alert"
        className="rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-8 text-center"
      >
        <h1 className="text-(length:--text-xl) font-semibold text-(--color-ink)">
          No result ID supplied
        </h1>
        <p className="mt-2 text-(length:--text-sm) text-(--color-muted)">
          This link is missing the result identifier. Check that you copied the full URL.
        </p>
        <div className="mt-5 flex justify-center">
          <Button href="/">Run the calculator</Button>
        </div>
      </div>
    )
  }

  if (status === "error-fetch") {
    const msg =
      errorKind === "server"
        ? "Our pricing service is having a moment — the shared result could not be loaded."
        : "We couldn\u2019t reach our servers. Check your connection and try again."
    return (
      <div
        role="alert"
        className="rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-8 text-center"
      >
        <h1 className="text-(length:--text-xl) font-semibold text-(--color-ink)">
          Result unavailable
        </h1>
        <p className="mt-2 text-(length:--text-sm) text-(--color-muted)">{msg}</p>
        <div className="mt-5 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => { setStatus("loading"); setErrorKind(null) }}
          >
            Retry
          </Button>
          <Button href="/">Run the calculator</Button>
        </div>
      </div>
    )
  }

  if (status === "success" && result && payload) {
    return (
      <ResultDocument
        result={result}
        payload={payload}
        announce={() => {}}
        onAddUpc={() => {}}
      />
    )
  }

  return null
}
