import Link from "next/link"
import { Container } from "@/components/ui/container"

const STEPS = [
  {
    num: "1",
    title: "You enter the basics",
    body: "Appliance type, age, and the technician's quote. The rest (brand tier, failed part, location) sharpen the estimate but aren't required.",
  },
  {
    num: "2",
    title: "We run the net-present-cost math",
    body: "Weibull lifespan curves, localized labor rates, energy costs, and repeat-failure risk — all on real NAHB, BLS, and EIA data. No guesswork.",
  },
  {
    num: "3",
    title: "You get a straight answer",
    body: "Repair it, replace it, or hold off. With the dollar figures, confidence score, and every assumption laid bare so you can decide.",
  },
]

export function HowItWorks() {
  return (
    <section className="border-t border-(--color-line) bg-(--color-canvas) py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-(length:--text-3xl) font-semibold text-(--color-ink)">
            How it works
          </h2>
          <p className="mt-3 text-pretty text-(length:--text-lg) text-(--color-body)">
            Three steps. No sign-up. Your verdict stays on this page.
          </p>
        </div>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.num} className="flex flex-col gap-3">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--color-brand-tint) text-(length:--text-xl) font-semibold text-(--color-brand-ink)"
                aria-hidden
              >
                {s.num}
              </div>
              <h3 className="text-(length:--text-lg) font-semibold text-(--color-ink)">
                {s.title}
              </h3>
              <p className="text-(length:--text-sm) leading-relaxed text-(--color-body)">
                {s.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <Link
            href="/how-it-works"
            className="text-(length:--text-sm) font-medium text-(--color-brand) underline decoration-1 underline-offset-2 hover:text-(--color-brand-strong)"
          >
            Read the full methodology →
          </Link>
        </div>
      </Container>
    </section>
  )
}
