import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteShell } from "@/components/site/site-shell"
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
  metadataBase: new URL("https://repair-or-replace.net"),
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
  openGraph: {
    type: "website",
    siteName: "RepairOrReplace",
    title: "RepairOrReplace — Should you fix it or buy new?",
    description:
      "Evidence-based repair-vs-replace verdicts using net-present-cost math and Weibull lifespan modeling.",
    url: "https://repair-or-replace.net",
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
