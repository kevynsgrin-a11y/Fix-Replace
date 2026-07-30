/**
 * lib/json-ld.ts
 * JSON-LD structured data helpers.
 * One Organization + WebSite entity referenced by @id from every page.
 */

const SITE_URL = "https://repair-or-replace.net"
const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`

/** Serialize a JSON-LD object into a <script> tag string for dangerouslySetInnerHTML. */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 0)
}

/** The global Organization node. Include once per page via <script type="application/ld+json">. */
export function organizationLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "RepairOrReplace",
    url: SITE_URL,
    description:
      "Net-present-cost math on real data — giving homeowners an honest verdict on whether to repair or replace a broken appliance.",
    sameAs: [],
  }
}

/** The global WebSite node with SearchAction. */
export function websiteLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    url: SITE_URL,
    name: "RepairOrReplace",
    publisher: { "@id": ORG_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  }
}

/** Article JSON-LD for guide and editorial pages. */
export function articleLd(opts: {
  url: string
  title: string
  description: string
  dateModified: string
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url: `${SITE_URL}${opts.url}`,
    dateModified: opts.dateModified,
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": SITE_ID },
  }
}

/** FAQPage JSON-LD. */
export function faqLd(faqs: { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
}

/** BreadcrumbList JSON-LD. */
export function breadcrumbLd(
  items: { name: string; href: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  }
}

/** Combine multiple JSON-LD nodes into a @graph for a single <script> tag. */
export function graphLd(...nodes: Record<string, unknown>[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.map(({ "@context": _ctx, ...rest }) => rest),
  }
}
