import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/ui/container"
import { LogoMark } from "@/components/site/logo"
import { footerNav } from "@/lib/navigation"

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="mt-24 border-t border-[--color-line] bg-[--color-surface]"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>
      <Container wide className="py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 nav:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand blurb */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              aria-label="RepairOrReplace home"
              className="inline-flex items-center gap-2.5 rounded-[--radius-sm]"
            >
              <LogoMark />
              <span className="text-[length:var(--text-base)] font-semibold tracking-[-0.02em] text-[--color-ink]">
                Repair<span className="text-[--color-muted]">Or</span>Replace
              </span>
            </Link>
            <p className="max-w-xs text-[length:var(--text-sm)] text-[--color-muted]">
              A free, evidence-based verdict on whether to fix or replace a
              major household appliance. No signup, no paywall.
            </p>
          </div>

          {/* Site map columns — headings are h2, keeping a valid outline */}
          {footerNav.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="text-[length:var(--text-2xs)] font-semibold uppercase tracking-[0.08em] text-[--color-muted]">
                {col.heading}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex rounded-[3px] text-[length:var(--text-sm)] text-[--color-body] transition-colors [transition-duration:var(--duration-fast)] hover:text-[--color-ink]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[--color-line] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[length:var(--text-xs)] text-[--color-muted]">
            &copy; <span className="tnum">{year}</span> RepairOrReplace. Estimates
            are informational, not professional advice.
          </p>
          <p className="text-[length:var(--text-xs)] text-[--color-muted]">
            Built on net-present-cost math &amp; Weibull lifespan modeling.
          </p>
        </div>
      </Container>
    </footer>
  )
}
