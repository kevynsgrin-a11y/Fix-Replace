import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd, breadcrumbList, webPage } from "@/lib/json-ld"
import { getAllMetros } from "@/lib/page-data"
import { PageHero } from "@/components/site/page-hero"
import { Container } from "@/components/ui/container"
import { MultiplierDial } from "@/components/metro/multiplier-dial"

const TITLE = "Appliance repair labor rates by metro"
const DESCRIPTION =
  "Appliance repair labor rates for 22 US metro markets, benchmarked against the $24.10/hr national mean from BLS OEWS 49-9031. Find your city's multiplier."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/local-costs" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/local-costs",
    images: [
      {
        url: `/og?kind=metro&title=${encodeURIComponent("Repair labor rates by metro")}&sub=${encodeURIComponent("22 markets · BLS OEWS 49-9031")}`,
        width: 1200,
        height: 630,
        alt: "Appliance repair labor rates by US metro market",
      },
    ],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}

export default function LocalCostsHubPage() {
  const metros = getAllMetros()
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Local repair costs" },
  ]

  return (
    <>
      <JsonLd
        data={webPage({
          title: TITLE,
          description: DESCRIPTION,
          path: "/local-costs",
          breadcrumbs: crumbs,
        })}
      />
      <JsonLd data={breadcrumbList(crumbs)} />

      <PageHero
        breadcrumbs={crumbs}
        eyebrow="Local repair costs"
        title="What a repair visit costs where you live"
        lede="Labor is the biggest variable in any repair quote. These markets are benchmarked against the $24.10/hr national mean for appliance repairers (BLS OEWS 49-9031, May 2025)."
        provenance="Data reviewed July 19, 2026 · BLS OEWS 49-9031 · EIA residential rates"
      />

      <Container className="pb-16">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metros.map((m) => (
            <li key={m.slug}>
              <Link
                href={`/local-costs/${m.slug}`}
                className="group flex items-center gap-4 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-line-strong) hover:bg-(--color-surface-2)"
              >
                <MultiplierDial
                  multiplier={m.multiplier}
                  size={72}
                  className="shrink-0"
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-(length:--text-base) font-semibold text-(--color-ink) group-hover:underline">
                    {m.name}, {m.state}
                  </span>
                  <span className="readout text-(length:--text-sm) text-(--color-muted)">
                    ${m.meanHourlyWage.toFixed(2)}/hr ·{" "}
                    <span
                      className={
                        m.multiplier > 1
                          ? "text-(--color-replace)"
                          : "text-(--color-repair)"
                      }
                    >
                      {m.multiplier.toFixed(2)}×
                    </span>{" "}
                    national
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 max-w-prose text-(length:--text-sm) leading-relaxed text-(--color-muted)">
          Your metro isn&apos;t listed? The calculator accepts any ZIP code and
          interpolates a labor rate from the nearest benchmarked market.{" "}
          <Link href="/#calculator" className="font-medium text-(--color-brand-ink) underline underline-offset-2">
            Run your numbers
          </Link>
          .
        </p>
      </Container>
    </>
  )
}
