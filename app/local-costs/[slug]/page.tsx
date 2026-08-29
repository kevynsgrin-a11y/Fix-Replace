import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  graphLd,
  organizationLd,
  websiteLd,
  webPage,
  faqLd,
  breadcrumbLd,
  jsonLdScript,
} from "@/lib/json-ld"
import { getMetroData, METRO_SLUGS } from "@/lib/page-data"
import { SITE_URL, ogImageUrl } from "@/lib/site"
import { MetroTemplate } from "@/components/metro/metro-template"

interface MetroPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return METRO_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: MetroPageProps): Promise<Metadata> {
  const { slug } = await params
  const data = getMetroData(slug)
  if (!data) return {}

  const shortName = data.name.split(",")[0]
  const title = `${data.name} appliance repair labor rates`
  const description =
    `${shortName} appliance repair labor runs $${data.rate.toFixed(2)}/hr — ` +
    `${data.multiplier.toFixed(2)}× the $${data.nationalMean.toFixed(2)} national mean. See localized repair cost ranges.`
  const url = `${SITE_URL}/local-costs/${data.slug}`
  const ogUrl = ogImageUrl({
    type: "metro",
    title: shortName,
    description: `$${data.rate.toFixed(2)}/hr · ${data.multiplier.toFixed(2)}× national`,
  })

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${data.name} appliance repair labor rate` }],
    },
    twitter: { card: "summary_large_image" },
  }
}

export default async function MetroPage({ params }: MetroPageProps) {
  const { slug } = await params
  const data = getMetroData(slug)
  if (!data) notFound()

  const shortName = data.name.split(",")[0]
  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    webPage({
      url: `/local-costs/${data.slug}`,
      title: `${data.name} appliance repair labor rates`,
      description: `Localized appliance repair cost ranges for ${data.name}.`,
    }),
    faqLd(data.faqs),
    breadcrumbLd([
      { name: "Home", href: "/" },
      { name: "Local costs", href: "/local-costs" },
      { name: shortName, href: `/local-costs/${data.slug}` },
    ]),
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <MetroTemplate data={data} />
    </>
  )
}
