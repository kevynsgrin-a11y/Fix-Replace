import Link from "next/link"
import { Container } from "@/components/ui/container"

const PRINCIPLES = [
  {
    title: "No lead-capture wall",
    body: "Your verdict appears instantly on this page. We never hold your answer hostage for an email address.",
  },
  {
    title: "No ads on your result",
    body: "The verdict screen is clean. Partner links live at the bottom, plainly labelled, and never influence the math.",
  },
  {
    title: "Every assumption shown",
    body: "Discount rate, lifespan curves, labor rates, energy costs — all visible in the provenance panel. You can audit every number.",
  },
  {
    title: "Honest about uncertainty",
    body: "When the data can't support a confident verdict, we say so. We'd rather withhold an answer than give you a false one.",
  },
]

export function TrustSection() {
  return (
    <section className="border-t border-(--color-line) bg-(--color-surface) py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-(length:--text-3xl) font-semibold text-(--color-ink)">
            Neutral by design
          </h2>
          <p className="mt-3 text-pretty text-(length:--text-lg) text-(--color-body)">
            We don't sell appliances, repairs, or your data. The math is the product.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="rounded-(--radius-md) border border-(--color-line) bg-(--color-canvas) p-6"
            >
              <h3 className="text-(length:--text-base) font-semibold text-(--color-ink)">
                {p.title}
              </h3>
              <p className="mt-2 text-(length:--text-sm) leading-relaxed text-(--color-body)">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/about"
            className="text-(length:--text-sm) font-medium text-(--color-brand) underline decoration-1 underline-offset-2 hover:text-(--color-brand-strong)"
          >
            Read our neutrality pledge →
          </Link>
        </div>
      </Container>
    </section>
  )
}
