import type { Metadata } from "next"
import { SITE_NAME, ogImageUrl } from "@/lib/site"

export const dynamic = "force-dynamic"

/**
 * `app/r/page.tsx` is a client component, so it cannot export metadata of its
 * own. Without this the shared-verdict link inherited the generic sitewide
 * title and description whenever someone pasted it into Slack, iMessage or a
 * social post. Shared results are also deliberately kept out of the index —
 * they are one person's private numbers, not a landing page.
 */
const TITLE = "Your repair-or-replace verdict"
const DESCRIPTION = "A shared repair-vs-replace result from RepairOrReplace."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: ogImageUrl({ type: "result", title: TITLE }),
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
}

export default function RLayout({ children }: { children: React.ReactNode }) {
  return children
}
