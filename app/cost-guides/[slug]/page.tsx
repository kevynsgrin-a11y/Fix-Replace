import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { GuideTemplate } from "@/components/guide/guide-template"
import {
  getGuideData,
  getAllGuideSlugs,
  type GuideSlug,
} from "@/lib/page-data"
import {
  articleSchema,
  faqSchema,
  breadcrumbSchema,
  ORG_SCHEMA,
  WEBSITE_SCHEMA,
} from "@/lib/json-ld"

const SITE = "https://repair-or-replace.net"

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!getAllGuideSlugs().includes(slug as GuideSlug)) return {}
  const data = getGuideData(slug as GuideSlug)
  const title = `${data.title} Repair Costs — RepairOrReplace`
  const description = `Typical ${data.plural} repair costs by part, lifespan by brand tier, DIY vs. pro guidance, and the repair-vs-replace rule — real data, no guesswork.`
  const url = `${SITE}/cost-guides/${slug}`
  const ogUrl = `${SITE}/og?title=${encodeURIComponent(`${data.title} Repair Costs`)}&sub=${encodeURIComponent("Typical costs · lifespan · repair vs. replace rule")}&eyebrow=Cost+Guide`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${data.title} repair cost guide — RepairOrReplace.net` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: ogUrl, alt: `${data.title} repair cost guide — RepairOrReplace.net` }],
    },
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!getAllGuideSlugs().includes(slug as GuideSlug)) notFound()
  const data = getGuideData(slug as GuideSlug)

  const jsonLdScripts = [
    ORG_SCHEMA,
    WEBSITE_SCHEMA,
    articleSchema({
      url: `/cost-guides/${slug}`,
      headline: `${data.title} Repair Costs`,
      description: `Typical ${data.plural} repair costs, lifespan by brand tier, and the repair-vs-replace rule.`,
      dateModified: "2026-07-19",
    }),
    faqSchema(data.faqs),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Cost guides", url: "/cost-guides" },
      { name: data.title },
    ]),
  ]

  return (
    <>
      {jsonLdScripts.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <GuideTemplate data={data} />
    </>
  )
}
