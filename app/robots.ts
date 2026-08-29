import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // robots.txt paths are PREFIX matches, not exact ones, so every entry
        // here must be checked against the real route list before it is added.
        // "/api/" is the only rule we need, and the trailing slash keeps it
        // scoped to the route group it names.
        //
        // "/api/" — app/api/* returns JSON with no content value (the catalog
        // endpoint is a plain GET). It was blocked by the old static
        // public/robots.txt; deleting that file made it crawlable, so the
        // block moves here.
        //
        // Deliberately NOT blocked:
        //
        // "/og" — this is the route that generates every Open Graph card on
        // the site. Twitterbot, facebookexternalhit and LinkedInBot all obey
        // robots.txt, so disallowing it strips the preview image from every
        // social share. It returns a PNG, not indexable text, so there is
        // nothing to keep out of the index in the first place.
        //
        // "/r" (the shared-verdict view) — app/r/layout.tsx sets
        // robots: { index: false, follow: false }. A crawl block would stop
        // the crawler from ever fetching the page and seeing that noindex,
        // which is the classic disallow+noindex conflict: a blocked URL can
        // still be indexed as a bare URL with no snippet. The meta noindex is
        // the correct and sufficient control here — do not add a crawl block
        // back alongside it.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
