import { composeDriverSentence, type CalculationResult } from "@/lib/result"

/**
 * The single plain sentence explaining WHY, composed from the two largest
 * dollar drivers with the figures bolded. Never rendered on the withheld path
 * (the parent suppresses it there).
 */
export function DriverSentence({ result }: { result: CalculationResult }) {
  const parts = composeDriverSentence(result)
  return (
    <p className="text-pretty text-(length:--text-lg) leading-relaxed text-(--color-body)">
      {parts.map((p, i) =>
        p.bold ? (
          <strong key={i} className="font-semibold text-(--color-ink) tabular-nums">
            {p.text}
          </strong>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </p>
  )
}
