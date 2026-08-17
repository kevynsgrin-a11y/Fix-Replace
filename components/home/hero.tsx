import Link from "next/link"
import { Pill } from "@/components/ui/pill"

const STATS = [
  { value: "12", unit: "major appliance types" },
  { value: "22", unit: "metro labor markets" },
  { value: "<60s", unit: "to a verdict" },
]

export function Hero() {
  return (
    <div className="flex max-w-[52ch] flex-col">
      <p className="text-(length:--text-xs) font-semibold uppercase tracking-[0.14em] text-(--color-brand-ink)">
        Free appliance decision tool
      </p>

      <h1 className="mt-3 text-balance">
        <span className="block text-(length:--text-xl) font-semibold tracking-[-0.01em]">
          <span className="text-(--color-repair-ink)">Repair it</span>
          <span className="text-(--color-muted)"> or </span>
          <span className="text-(--color-replace-ink)">replace it?</span>
        </span>
        <span className="mt-1 block text-(length:--text-4xl) text-(--color-ink)">
          Get a straight answer.
        </span>
      </h1>

      <p className="mt-5 text-pretty text-(length:--text-lg) leading-relaxed text-(--color-body)">
        Enter your appliance, its age, and the technician&apos;s quote. We run
        the net-present-cost math on real data and hand you an honest verdict
        {" — "}no guesswork, no lead-capture wall.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <Pill variant="repair" className="whitespace-nowrap">
          No sign-up
        </Pill>
        <Pill variant="brand" className="whitespace-nowrap">
          Free, no ads on your result
        </Pill>
      </div>

      <p className="mt-3 text-(length:--text-xs) text-(--color-muted)">
        Data:{" "}
        <Link
          href="/methodology"
          className="font-medium text-(--color-body) underline decoration-(--color-line-strong) underline-offset-2 hover:text-(--color-brand-ink) hover:decoration-(--color-brand)"
        >
          NAHB · InterNACHI · BLS · EIA · CPSC
        </Link>
      </p>

      <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-(--color-line) pt-6">
        {STATS.map((s) => (
          <div key={s.unit} className="flex flex-col-reverse gap-1">
            <dt className="text-(length:--text-xs) leading-snug text-(--color-muted)">
              {s.unit}
            </dt>
            <dd className="readout text-(length:--text-3xl) font-semibold text-(--color-ink)">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
