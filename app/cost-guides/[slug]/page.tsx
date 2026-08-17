import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { GuideTemplate } from "@/components/guide/guide-template"
import { getGuideData, GUIDE_SLUGS } from "@/lib/page-data"
import { graphLd, organizationLd, websiteLd, articleLd, faqLd, breadcrumbLd, jsonLdScript } from "@/lib/json-ld"

const SITE = "https://repair-or-replace.net"

export function generateStaticParams() {
  return GUIDE_SLUGS.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = getGuideData(slug)
  if (!data) return {}
  const title = `${data.label} repair cost guide — RepairOrReplace`
  const description = `Typical ${data.noun} repair costs by part, lifespan by brand tier, DIY vs. pro guidance, and the repair-vs-replace rule — real data, no guesswork.`
  const url = `${SITE}/cost-guides/${slug}`
  const ogUrl = `${SITE}/og?type=guide&title=${encodeURIComponent(`${data.label} repair costs`)}&description=${encodeURIComponent("Typical costs · lifespan · verdict rule")}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [{ url: ogUrl, width: 1200, height: 630, alt: `${data.label} repair cost guide` }] },
    twitter: { card: "summary_large_image" },
  }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = getGuideData(slug)
  if (!data) notFound()

  const ld = graphLd(
    organizationLd(),
    websiteLd(),
    articleLd({ url: `/cost-guides/${slug}`, title: `${data.label} repair cost guide`, description: data.lede, dateModified: "2026-07-19" }),
    faqLd(data.faqs),
    breadcrumbLd([{ name: "Home", href: "/" }, { name: "Cost guides", href: "/cost-guides" }, { name: data.label, href: `/cost-guides/${slug}` }]),
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }} />
      <GuideTemplate data={data} />
    </>
  )
}
