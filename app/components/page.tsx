import type { Metadata } from "next"
import { Container } from "@/components/ui/container"
import { ThemeScope } from "@/components/site/theme-scope"
import { PrimitiveGallery } from "@/components/site/primitive-gallery"

export const metadata: Metadata = {
  title: "Design system",
  description:
    "Every RepairOrReplace UI primitive — buttons, cards, badges, callouts, form controls, and data tables — shown in both light and dark themes.",
}

export default function ComponentsPage() {
  return (
    <Container className="py-[--space-16]">
      <header className="mb-[--space-12] max-w-2xl">
        <p className="text-fluid-0 font-medium uppercase tracking-[0.14em] text-[--color-brand]">Design system</p>
        <h1 className="mt-[--space-3] text-fluid-6 font-semibold tracking-[-0.03em] text-balance text-[--color-ink]">
          Component primitives
        </h1>
        <p className="mt-[--space-4] text-fluid-2 leading-relaxed text-[--color-body] text-pretty">
          Every shared primitive that composes the RepairOrReplace interface. Toggle the site theme to inspect any
          component live, or compare the forced light and dark renders side by side at the bottom of the page.
        </p>
      </header>

      {/* Live gallery — follows the active site theme */}
      <PrimitiveGallery />

      {/* Forced dual-theme comparison */}
      <section aria-labelledby="dual-theme" className="mt-[--space-20]">
        <h2 id="dual-theme" className="text-fluid-4 font-semibold tracking-[-0.02em] text-[--color-ink]">
          Both themes, side by side
        </h2>
        <p className="mt-[--space-3] max-w-2xl text-fluid-1 leading-relaxed text-[--color-body]">
          The same primitives rendered in a forced light scope and a forced dark scope, independent of the current site
          theme. Both are first-class — the semantic repair/replace pair holds its contrast in each.
        </p>

        <div className="mt-[--space-8] grid gap-[--space-6] lg:grid-cols-2">
          <div>
            <p className="mb-[--space-4] text-fluid-0 font-medium uppercase tracking-[0.14em] text-[--color-muted]">
              Light
            </p>
            <ThemeScope scheme="light" className="rounded-[--radius-lg] border border-[--color-line] p-[--space-6]">
              <PrimitiveGallery idns="light" />
            </ThemeScope>
          </div>
          <div>
            <p className="mb-[--space-4] text-fluid-0 font-medium uppercase tracking-[0.14em] text-[--color-muted]">
              Dark
            </p>
            <ThemeScope scheme="dark" className="rounded-[--radius-lg] border border-[--color-line] p-[--space-6]">
              <PrimitiveGallery idns="dark" />
            </ThemeScope>
          </div>
        </div>
      </section>
    </Container>
  )
}
