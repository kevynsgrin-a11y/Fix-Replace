import Link from "next/link"
import { Container } from "@/components/ui/container"

const FAQS = [
  {
    q: "Is this really free?",
    a: "Yes. No sign-up, no paywall, no email gate. The verdict appears instantly on this page. We make money through optional partner links at the bottom of the result — never by holding your answer hostage.",
  },
  {
    q: "How accurate is the verdict?",
    a: "We use Weibull lifespan curves fitted to NAHB and InterNACHI data, localized BLS labor rates, and EIA energy costs. Every result includes a confidence score and shows every assumption. When the data can't support a confident answer, we say so.",
  },
  {
    q: "What if my appliance isn't listed?",
    a: "We cover the 12 major household appliance types that account for most repair-or-replace decisions. If yours isn't listed, the math won't be accurate — we'd rather not guess.",
  },
  {
    q: "Do you store my information?",
    a: "No. Your inputs stay in your browser. We don't track you, and we don't sell data. The only server call is the calculation itself, which is stateless.",
  },
  {
    q: "Can I trust the repair cost estimates?",
    a: "They're based on real part costs and localized labor rates, but every repair is different. Use the verdict as a starting point, then get a second quote if the numbers are close. We show you exactly how we calculated everything.",
  },
  {
    q: "What about recalls?",
    a: "If you provide a UPC, we check CPSC recall data. If there's an active recall, the verdict changes — manufacturers often repair recalled units for free. We never assume a recall exists without checking.",
  },
]

export function FaqSection() {
  return (
    <section className="border-t border-(--color-line) bg-(--color-canvas) py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-balance text-center text-(length:--text-3xl) font-semibold text-(--color-ink)">
            Frequently asked questions
          </h2>

          <div className="mt-10 space-y-4">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-(--radius-md) border border-(--color-line) bg-(--color-surface) [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 text-(length:--text-base) font-semibold text-(--color-ink) transition-colors hover:text-(--color-brand)">
                  {f.q}
                  <span
                    className="shrink-0 text-(length:--text-xl) text-(--color-muted) transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <div className="border-t border-(--color-line) p-5 pt-4">
                  <p className="text-(length:--text-sm) leading-relaxed text-(--color-body)">
                    {f.a}
                  </p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/methodology"
              className="text-(length:--text-sm) font-medium text-(--color-brand) underline decoration-1 underline-offset-2 hover:text-(--color-brand-strong)"
            >
              Read the full methodology →
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
