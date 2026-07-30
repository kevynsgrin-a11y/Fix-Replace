import * as React from "react"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"

/* Page shell.
 * - Skip link is the FIRST focusable element in the DOM.
 * - <main> is tabindex="-1" so the skip link can move focus into it. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-[--radius-sm] bg-[--color-brand] px-4 py-2 text-[length:var(--text-sm)] font-semibold text-[--color-on-brand] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
