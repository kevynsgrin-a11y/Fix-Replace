import type { Metadata } from "next"
import Link from "next/link"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Page not found — RepairOrReplace.net",
  description: "The page you requested does not exist.",
}

const QUICK_LINKS = [
  { href: "/", label: "Calculator — get a verdict" },
  { href: "/cost-guides", label: "Cost guides by appliance" },
  { href: "/local-costs", label: "Local labor rates by metro" },
  { href: "/how-it-works", label: "How the math works" },
  { href: "/methodology", label: "Data sources" },
]

export default function NotFound() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "404" }]}
        eyebrow="404"
        heading="Nothing here"
        lede="The page you requested does not exist. It may have moved, or the link may be wrong."
      />

      <Container>
        <main className="mt-12 pb-24">
          <div className="mx-auto max-w-[52ch]">
            <nav aria-label="Suggested pages">
              <ul className="space-y-2">
                {QUICK_LINKS.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center justify-between rounded-(--radius-md) border border-(--color-line) bg-(--color-surface) px-4 py-3 text-(length:--text-sm) font-medium text-(--color-ink) transition-colors hover:border-(--color-brand) hover:bg-(--color-surface-2) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand)"
                    >
                      {label}
                      <span aria-hidden className="text-(--color-muted)">&rarr;</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-8">
              <Button href="/" size="lg" block>
                Go to the calculator
              </Button>
            </div>
          </div>
        </main>
      </Container>
    </>
  )
}
