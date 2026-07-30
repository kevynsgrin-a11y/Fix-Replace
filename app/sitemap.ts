import type { MetadataRoute } from "next"
import { GUIDE_SLUGS } from "@/lib/page-data"
import { METRO_SLUGS } from "@/lib/page-data"

const SITE = "https://repair-or-replace.net"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  const static_pages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/cost-guides`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/local-costs`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/recall-checks`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/for-technicians`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ]

  const guide_pages: MetadataRoute.Sitemap = GUIDE_SLUGS.map((g) => ({
    url: `${SITE}/cost-guides/${g.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.85,
  }))

  const metro_pages: MetadataRoute.Sitemap = METRO_SLUGS.map((slug) => ({
    url: `${SITE}/local-costs/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...static_pages, ...guide_pages, ...metro_pages]
}
