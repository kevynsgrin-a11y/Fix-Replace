import Link from "next/link"
import { Container } from "@/components/ui/container"
import { buttonVariants } from "@/components/ui/button"

export function ConversionBand() {
  return (
    <section className="border-t border-(--color-line) bg-(--color-brand-tint) py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-(length:--text-3xl) font-semibold text-(--color-brand-ink)">
            Stop guessing. Get your verdict.
          </h2>
          <p className="mt-3 text-pretty text-(length:--text-lg) text-(--color-brand-ink)">
            Enter your appliance, its age, and the technician's quote. We'll run the
            net-present-cost math and hand you an honest answer — no sign-up, no
            lead-capture wall.
          </p>
          <div className="mt-8">
            <Link
              href="#calculator-heading"
              className={buttonVariants({ variant: "primary", size: "lg" })}
            >
              Get my verdict
            </Link>
          </div>
          <p className="mt-4 text-(length:--text-sm) text-(--color-brand-ink)">
            Free. No ads on your result. Your answer stays on this page.
          </p>
        </div>
      </Container>
    </section>
  )
}
