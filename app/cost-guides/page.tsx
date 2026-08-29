import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { PageHero } from "@/components/site/page-hero"
import { ApplianceGlyph } from "@/components/ui/appliance-glyph"
import { GUIDE_SLUGS, getGuideData } from "@/lib/page-data"
import { SITE_URL, ogImageUrl } from "@/lib/site"
import {
  graphLd,
  organizationLd,
  websiteLd,
  breadcrumbLd,
  jsonLdScript,
} from "@/lib/json-ld"

/**
 * Every count and appliance list in the copy below is derived from
 * GUIDE_SLUGS. The hub previously hard-coded "8 major appliances" in four
 * separate strings, so adding a guide to lib/page-data.ts silently left the
 * metadata, the OG card, and the hero lede claiming the wrong number.
 */
const GUIDE_COUNT = GUIDE_SLUGS.length

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty",
]

/** Spelled-out numeral for prose; falls back to digits past twenty. */
function numberWord(n: number): string {
  return n >= 0 && n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n)
}

/** "a, b, and c" — keeps the serial comma the original copy used. */
function humanList(items: readonly string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

/**
 * Lowercases a nav label for mid-sentence use without mangling acronyms —
 * a flat `.toLowerCase()` turned "Central HVAC" into "central hvac". A word
 * that is already all-caps and longer than one character is left alone;
 * single characters ("A", "I") still take the plain lowercase path.
 * lib/page-data.ts documents the same hazard for generated FAQ copy.
 */
function midSentenceLabel(label: string): string {
  return label
    .split(" ")
    .map((w) => (w.length > 1 && w === w.toUpperCase() ? w : w.toLowerCase()))
    .join(" ")
}

const APPLIANCE_NAMES = GUIDE_SLUGS.map((g) => midSentenceLabel(g.navLabel))

/**
 * Google renders roughly the first 155–160 characters of a description.
 * Naming every appliance ran to ~199 and cut off the sourcing
 * line, so name the first few and elide the rest — GUIDE_COUNT still
 * tells the reader how many there are, and the full list is on the page.
 */
const APPLIANCE_LEAD = 5
const APPLIANCE_LIST = humanList(
  APPLIANCE_NAMES.length > APPLIANCE_LEAD
    ? [...APPLIANCE_NAMES.slice(0, APPLIANCE_LEAD), "more"]
    : APPLIANCE_NAMES,
)

export const metadata: Metadata = {
  title: "Appliance Repair Cost Guides — RepairOrReplace",
  description: `Typical repair costs for ${GUIDE_COUNT} major appliances — ${APPLIANCE_LIST}. Real data from BLS, EIA, and NAHB.`,
  alternates: { canonical: `${SITE_URL}/cost-guides` },
  openGraph: {
    title: "Appliance Repair Cost Guides — RepairOrReplace",
    description: `Typical repair costs for ${GUIDE_COUNT} major appliances. Real data, no guesswork.`,
    url: `${SITE_URL}/cost-guides`,
    images: [
      {
        url: ogImageUrl({
          type: "guide",
          title: "Appliance Repair Cost Guides",
          description: `${GUIDE_COUNT} appliances · BLS & EIA data`,
        }),
        width: 1200,
        height: 630,
        alt: "Appliance repair cost guides",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
}

/**
 * Hand-written card subtitles. Any guide missing an entry falls back to its
 * cheapest documented failures, so a new guide never renders a blank card.
 */
const SUBTITLES: Record<string, string> = {
  refrigerators: "Compressor, fan motor, thermostat, door seal",
  "washing-machines": "Bearings, drain pump, door boot seal",
  dishwashers: "Drain pump, control board, door latch",
  dryers: "Heating element, thermal fuse, motor",
  ranges: "Igniter, gas valve, surface element",
  "wall-ovens": "Bake element, control board, door gasket",
  microwaves: "Magnetron, door switch, turntable motor",
  "water-heaters": "Thermocouple, element, anode rod",
  hvac: "Compressor, run capacitor, refrigerant, thermostat",
}

function subtitleFor(slug: string): string {
  const curated = SUBTITLES[slug]
  if (curated) return curated
  const parts = (getGuideData(slug)?.failures ?? []).slice(0, 3).map((f) => f.name)
  if (parts.length === 0) return ""
  return [parts[0], ...parts.slice(1).map((p) => p.toLowerCase())].join(", ")
}

export default function CostGuidesHubPage() {
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    breadcrumbLd([
      { name: "Home", href: "/" },
      { name: "Cost guides", href: "/cost-guides" },
    ]),
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />

      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Cost guides" },
        ]}
        eyebrow="Cost guides"
        heading="Appliance repair cost guides"
        lede={`Typical part-and-labor costs, brand-tier lifespans, and the repair-vs-replace rule for the ${numberWord(GUIDE_COUNT)} major home appliances — built from BLS, EIA, and NAHB data.`}
        provenanceLine="Data reviewed July 19, 2026 · BLS OEWS 49-9031 · NAHB life-expectancy tables"
      />

      <Container className="py-12 lg:py-16">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE_SLUGS.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/cost-guides/${g.slug}`}
                className="group flex h-full items-start gap-4 rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) p-5 transition-colors hover:border-(--color-brand)"
              >
                <span className="shrink-0 text-(--color-brand)">
                  <ApplianceGlyph category={g.category} size={40} />
                </span>
                <span className="min-w-0">
                  <span className="block text-(length:--text-base) font-semibold text-(--color-ink) group-hover:text-(--color-brand)">
                    {g.navLabel}
                  </span>
                  <span className="mt-1 block text-(length:--text-sm) leading-relaxed text-(--color-muted)">
                    {subtitleFor(g.slug)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </>
  )
}
