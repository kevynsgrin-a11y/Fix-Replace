"use client"

import * as React from "react"
import type { CalculatePayload, CalculateResponse } from "@/lib/result"
import { postCalculate } from "@/lib/result"
import { CalculatorCard } from "@/components/home/calculator-card"
import { ResultDocument } from "@/components/result/result-document"
import { ResultError } from "@/components/result/result-error"

type Phase =
  | { name: "form" }
  | { name: "submitting"; payload: CalculatePayload }
  | { name: "result"; payload: CalculatePayload; result: CalculateResponse }
  | { name: "error"; payload: CalculatePayload; error: unknown }

/**
 * Owns the calculator's submit → result/error state machine. The form stays
 * mounted (so inputs are never lost); the result renders below it. Focus moves
 * to the verdict headline on success and to the error heading on failure, and a
 * single polite live region announces outcomes. The submit button relabels to
 * "Recalculate" only after a success — never after a failure.
 */
export function CalculatorExperience() {
  const [phase, setPhase] = React.useState<Phase>({ name: "form" })
  const [announcement, setAnnouncement] = React.useState("")

  const headlineRef = React.useRef<HTMLHeadingElement>(null)
  const errorRef = React.useRef<HTMLHeadingElement>(null)
  const resultRegionRef = React.useRef<HTMLDivElement>(null)

  const announce = React.useCallback((msg: string) => {
    // Clear then set so repeated identical messages re-announce.
    setAnnouncement("")
    requestAnimationFrame(() => setAnnouncement(msg))
  }, [])

  async function runCalculation(payload: CalculatePayload) {
    setPhase({ name: "submitting", payload })
    try {
      const result = await postCalculate(payload)
      setPhase({ name: "result", payload, result })
    } catch (error) {
      setPhase({ name: "error", payload, error })
    }
  }

  // Focus management: move focus to the verdict headline on success, to the
  // error heading on failure — a keyboard user must not re-tab the whole form.
  React.useEffect(() => {
    if (phase.name === "result") {
      announce(`Verdict: ${phase.result.verdictHeadline}`)
      // Scroll the result into view, then focus the headline.
      resultRegionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      headlineRef.current?.focus({ preventScroll: true })
    } else if (phase.name === "error") {
      announce("Something went wrong. See the message below the form.")
      resultRegionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      errorRef.current?.focus({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function handleRetry() {
    if (phase.name === "error") runCalculation(phase.payload)
  }

  function handleAddUpc() {
    // Open the advanced disclosure and focus the UPC field.
    const details = document.getElementById("advanced-recall")
    if (details instanceof HTMLDetailsElement) details.open = true
    document.getElementById("upc")?.focus()
  }

  const hasResult = phase.name === "result"

  return (
    <div className="flex flex-col gap-6">
      {/* Pre-existing polite live region — always in the DOM. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <CalculatorCard
        onSubmit={runCalculation}
        submitting={phase.name === "submitting"}
        submitted={hasResult}
      />

      <div ref={resultRegionRef} className="scroll-mt-24">
        {phase.name === "result" && (
          <ResultDocument
            ref={headlineRef}
            result={phase.result}
            payload={phase.payload}
            announce={announce}
            onAddUpc={handleAddUpc}
          />
        )}
        {phase.name === "error" && (
          <ResultError ref={errorRef} error={phase.error} onRetry={handleRetry} />
        )}
      </div>
    </div>
  )
}
