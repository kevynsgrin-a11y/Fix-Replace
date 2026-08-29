import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteShell } from "@/components/site/site-shell"
import { SITE_URL, ogImageUrl } from "@/lib/site"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RepairOrReplace — Should you fix it or buy new?",
    template: "%s · RepairOrReplace",
  },
  description:
    "A free, evidence-based decision utility that tells you whether to repair or replace a major household appliance — using net-present-cost math, Weibull lifespan modeling, and localized rate data. No signup, no paywall.",
  applicationName: "RepairOrReplace",
  keywords: [
    "appliance repair or replace",
    "net present cost",
    "Weibull lifespan",
    "refrigerator repair cost",
    "washing machine replacement",
    "appliance decision calculator",
  ],
  authors: [{ name: "RepairOrReplace" }],
  robots: { index: true, follow: true },
  // Next.js only emits <link rel="canonical"> when alternates.canonical is
  // set — metadataBase alone does not produce one. Without this the homepage
  // shipped no canonical tag at all. Child routes override it with their own.
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    type: "website",
    siteName: "RepairOrReplace",
    title: "RepairOrReplace — Should you fix it or buy new?",
    description:
      "Evidence-based repair-vs-replace verdicts using net-present-cost math and Weibull lifespan modeling.",
    url: SITE_URL,
    // Sitewide default card. Any route that does not declare its own
    // openGraph.images inherits this one, so the homepage — and anything
    // added later without an image — still shares with a real preview.
    images: [
      {
        url: ogImageUrl({ type: "home" }),
        width: 1200,
        height: 630,
        alt: "RepairOrReplace — should you fix it or buy new?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepairOrReplace — Should you fix it or buy new?",
    description:
      "Evidence-based repair-vs-replace verdicts using net-present-cost math and Weibull lifespan modeling.",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#080c14" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`bg-background ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteShell>{children}</SiteShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
