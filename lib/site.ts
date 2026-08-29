/**
 * lib/site.ts
 * Single source of truth for the canonical origin and the operating entity.
 *
 * Before this module existed the site URL was copy-pasted into thirteen files
 * in two mutually inconsistent forms (apex and `www.`), so canonical tags,
 * Open Graph URLs, the sitemap and the JSON-LD graph disagreed about which URL
 * was authoritative. Everything that needs an absolute URL now imports from
 * here, which makes a domain change a one-line edit instead of a sweep.
 *
 * `NEXT_PUBLIC_SITE_URL` overrides the default at build time (preview
 * deployments, staging hosts) without touching source.
 */

const DEFAULT_SITE_URL = "https://repair-or-replace.com"

/** Canonical origin, no trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL
).replace(/\/+$/, "")

/** Bare host, for display in footers and social cards. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "")

export const SITE_NAME = "RepairOrReplace"

/**
 * The operating entity behind the site. Used for the Organization JSON-LD
 * node, the footer, and the legal pages, so the published identity is
 * consistent everywhere and defined once.
 */
export const ORG = {
  legalName: "Oak and Main Developers LLC",
  /** Governing state for the Terms of Use. */
  governingState: "California",
  address: {
    street: "2108 N St.",
    locality: "Sacramento",
    region: "CA",
    postalCode: "95816",
    country: "US",
  },
  /**
   * Contact mailbox published in the footer and both legal pages.
   * NOTE: this address must exist and be monitored — the Privacy Policy
   * commits to a five-business-day response. Change here to change it
   * everywhere.
   */
  email: "support@repair-or-replace.com",
} as const

/** One-line postal address for compact display. */
export const ORG_ADDRESS_LINE = `${ORG.address.street}, ${ORG.address.locality}, ${ORG.address.region} ${ORG.address.postalCode}`

/** Build an absolute URL from a site-root-relative path. */
export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_URL
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Absolute URL for a generated Open Graph card.
 * Keeps the `/og` query-string shape in one place.
 *
 * Only `type`, `title` and `description` exist here because those are the only
 * params `app/og/route.tsx` reads. A `slug` used to be accepted and forwarded;
 * the route ignored it, so every caller that passed one silently got the
 * generic fallback card. Pass the page's real title and a short description.
 */
export function ogImageUrl(params: {
  type: "guide" | "metro" | "home" | "editorial" | "result"
  title?: string
  description?: string
}): string {
  const qs = new URLSearchParams()
  qs.set("type", params.type)
  if (params.title) qs.set("title", params.title)
  if (params.description) qs.set("description", params.description)
  return `${SITE_URL}/og?${qs.toString()}`
}
