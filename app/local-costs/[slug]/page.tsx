import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { JsonLd, breadcrumbList, faqPage, webPage } from "@/lib/json-ld"
import { getMetroData, METRO_SLUGS } from "@/lib/page-data"
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

  const title = `${data.name} appliance repair labor rates`
  const description =
    `${data.name} appliance repair labor runs $${data.meanHourlyWage.toFixed(2)}/hr — ` +
    `${data.multiplier.toFixed(2)}× the $24.10 national mean. See localized repair cost ranges for 12 appliances.`

  return {
    title,
    description,
    alternates: { canonical: `/local-costs/${data.slug}` },
    openGraph: {
      title,
      description,
      url: `/local-costs/${data.slug}`,
      images: [
        {
          url: `/og?kind=metro&title=${encodeURIComponent(data.name)}&sub=${encodeURIComponent(`$${data.meanHourlyWage.toFixed(2)}/hr · ${data.multiplier.toFixed(2)}× national`)}`,
          width: 1200,
          height: 630,
          alt: `${data.name} appliance repair labor rate — $${data.meanHourlyWage.toFixed(2)} per hour`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function MetroPage({ params }: MetroPageProps) {
  const { slug } = await params
  const data = getMetroData(slug)
  if (!data) notFound()

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Local repair costs", href: "/local-costs" },
    { label: data.name },
  ]

  return (
    <>
      <JsonLd
        data={webPage({
          title: `${data.name} appliance repair labor rates`,
          description: `Localized appliance repair cost ranges for ${data.name}, ${data.state}.`,
          path: `/local-costs/${data.slug}`,
          breadcrumbs: crumbs,
        })}
      />
      <JsonLd data={breadcrumbList(crumbs)} />
      <JsonLd data={faqPage(data.faq)} />
      <MetroTemplate data={data} />
    </>
  )
}
