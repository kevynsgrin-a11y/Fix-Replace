import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getAllMetroSlugs, getMetroData } from "@/lib/page-data"
import { MetroTemplate } from "@/components/metro/metro-template"
import { jsonLd, breadcrumbList } from "@/lib/json-ld"

const SITE = "https://www.repair-or-replace.net"

export async function generateStaticParams() {
  return getAllMetroSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const metro = getMetroData(slug)
  if (!metro) return {}
  const title = `Appliance Repair Labor Rates — ${metro.name} (${metro.multiplier.toFixed(2)}× national avg)`
  const description = `Local appliance repair costs in ${metro.name}: technicians bill ~$${metro.ratePerHour.toFixed(2)}/hr, ${metro.multiplier >= 1 ? "above" : "below"} the $24.10/hr national mean. Refrigerator, washer, dryer cost ranges — updated 2026.`
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/local-rates/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/local-rates/${slug}`,
      images: [
        {
          url: `${SITE}/og?type=metro&slug=${slug}`,
          width: 1200,
          height: 630,
          alt: `Appliance repair labor rates in ${metro.name}`,
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function MetroPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const metro = getMetroData(slug)
  if (!metro) notFound()

  const ldBreadcrumb = breadcrumbList([
    { name: "Home", url: SITE },
    { name: "Local rates", url: `${SITE}/local-rates` },
    { name: metro.name, url: `${SITE}/local-rates/${slug}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumb) }}
      />
      <MetroTemplate metro={metro} />
    </>
  )
}
