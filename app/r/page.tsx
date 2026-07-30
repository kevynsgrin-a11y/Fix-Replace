import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { SharedResult } from "@/components/result/shared-result"

const SITE = "https://www.repair-or-replace.net"

export function generateMetadata(): Metadata {
  // Dynamic title/description are set client-side once the result loads.
  // We provide a sensible static fallback for crawlers.
  return {
    title: "Repair-or-replace result — RepairOrReplace.net",
    description:
      "A shared repair-vs-replace estimate. See the net-present cost analysis and verdict for this appliance.",
    openGraph: {
      title: "Repair-or-replace result",
      description: "Net-present cost analysis and repair-vs-replace verdict.",
      url: `${SITE}/r`,
      images: [
        {
          url: `${SITE}/og?type=result`,
          width: 1200,
          height: 630,
          alt: "Repair or replace result",
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  }
}

export default function SharedResultPage() {
  return (
    <Container>
      <main className="py-10 pb-24">
        {/* Breadcrumb-style back link */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-(length:--text-sm) text-(--color-muted)">
            <li>
              <Link href="/" className="hover:text-(--color-ink)">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-(--color-ink)">
              Shared result
            </li>
          </ol>
        </nav>

        {/* Client component that reads ?id= from the URL, fetches the
            result, and renders the full ResultDocument. Falls back to a
            human-readable error if the id is missing or the fetch fails. */}
        <SharedResult />

        {/* Always-visible CTA — run their own calculation */}
        <div className="mt-16 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface-2) p-8 text-center">
          <p className="text-(length:--text-base) font-semibold text-(--color-ink)">
            Get a verdict for your appliance
          </p>
          <p className="mt-2 text-(length:--text-sm) text-(--color-muted)">
            This result was shared with you. Run your own numbers — free, no sign-up.
          </p>
          <div className="mt-5 flex justify-center">
            <Button href="/" size="lg">
              Open the calculator
            </Button>
          </div>
        </div>
      </main>
    </Container>
  )
}
