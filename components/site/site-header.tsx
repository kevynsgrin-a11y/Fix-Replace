"use client"

import * as React from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Container } from "@/components/ui/container"
import { Logo } from "@/components/site/logo"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { MobileDrawer } from "@/components/site/mobile-drawer"
import { buttonVariants } from "@/components/ui/button"
import { primaryLinks } from "@/lib/navigation"

export function SiteHeader() {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  return (
    <header className="sticky top-0 z-40 border-b border-[--color-line] bg-[color-mix(in_oklab,var(--color-canvas)_82%,transparent)] backdrop-blur-md">
      <Container
        wide
        as="div"
        className="flex h-16 items-center gap-4"
      >
        {/* Logo — allowed to shrink its wordmark but never the mark */}
        <div className="flex min-w-0 flex-1 items-center nav:flex-none">
          <Logo className="min-w-0" />
        </div>

        {/* Desktop nav: only from 1000px up */}
        <nav
          aria-label="Primary"
          className="hidden min-w-0 flex-1 items-center justify-center nav:flex"
        >
          <ul className="flex items-center gap-1">
            {primaryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex items-center whitespace-nowrap rounded-[--radius-sm] px-3 py-2 text-[length:var(--text-sm)] font-medium text-[--color-body] transition-colors [transition-duration:var(--duration-fast)] hover:bg-[--color-surface-2] hover:text-[--color-ink]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 nav:flex">
          <ThemeToggle />
          <Link
            href="/calculator"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            Get my verdict
          </Link>
        </div>

        {/* Mobile actions: below 1000px */}
        <div className="flex items-center gap-2 nav:hidden">
          <ThemeToggle />
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label="Open menu"
            className="inline-flex size-10 items-center justify-center rounded-[--radius-sm] border border-[--color-line] bg-[--color-surface] text-[--color-body] transition-colors hover:bg-[--color-surface-2] hover:text-[--color-ink]"
          >
            <Menu aria-hidden="true" className="size-[18px]" />
          </button>
        </div>
      </Container>

      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
      />
    </header>
  )
}
