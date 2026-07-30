import type { MetadataRoute } from "next"

const SITE = "https://repair-or-replace.net"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/og", "/r"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
