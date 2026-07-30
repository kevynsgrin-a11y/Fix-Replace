"use client"

import * as React from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { ThemeToggleRow } from "@/components/site/theme-toggle"
import { primaryLinks, secondaryLinks } from "@/lib/navigation"
import { cn } from "@/lib/utils"

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  /* Trigger element focus is returned to on close. */
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function MobileDrawer({ open, onClose, triggerRef }: MobileDrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)

  /* Body scroll lock + inert the main content while open. */
  React.useEffect(() => {
    if (!open) return
    const main = document.getElementById("main")
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    main?.setAttribute("inert", "")

    return () => {
      document.body.style.overflow = prevOverflow
      main?.removeAttribute("inert")
    }
  }, [open])

  /* Focus the panel on open; return focus to trigger on close. */
  React.useEffect(() => {
    if (open) {
      const panel = panelRef.current
      if (!panel) return
      const first = panel.querySelector<HTMLElement>(FOCUSABLE)
      // Focus the first focusable (the close button) on the next frame.
      const id = requestAnimationFrame(() => first?.focus())
      return () => cancelAnimationFrame(id)
    } else {
      triggerRef.current?.focus()
    }
  }, [open, triggerRef])

  /* Escape to close + focus trap. */
  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== "Tab") return
      const panel = panelRef.current
      if (!panel) return
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((n) => n.offsetParent !== null)
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={open ? undefined : true}
    >
      {/* Backdrop scrim */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-[color-mix(in_oklab,var(--color-ink)_55%,transparent)] transition-opacity [transition-duration:var(--duration-base)] [transition-timing-function:var(--ease-out-quint)]",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Slide-over panel from the right */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        onKeyDown={onKeyDown}
        className={cn(
          "absolute inset-y-0 right-0 flex w-[min(88vw,22rem)] flex-col border-l border-[--color-line] bg-[--color-surface] shadow-[--shadow-lg]",
          "transition-transform [transition-duration:var(--duration-base)] [transition-timing-function:var(--ease-out-quint)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-[--color-line] px-5 py-4">
          <span className="text-[length:var(--text-sm)] font-semibold text-[--color-ink]">
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex size-9 items-center justify-center rounded-[--radius-sm] text-[--color-body] transition-colors hover:bg-[--color-surface-2] hover:text-[--color-ink]"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <nav
          aria-label="Site"
          className="flex-1 overflow-y-auto px-5 py-4"
        >
          <ul className="flex flex-col gap-0.5">
            {[...primaryLinks, ...secondaryLinks].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="block rounded-[--radius-sm] px-3 py-2.5 text-[length:var(--text-base)] font-medium text-[--color-body] transition-colors hover:bg-[--color-surface-2] hover:text-[--color-ink]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-[--color-line] pt-5">
            <ThemeToggleRow />
          </div>
        </nav>

        <div className="border-t border-[--color-line] p-5">
          <Link
            href="/calculator"
            onClick={onClose}
            className={buttonVariants({ variant: "primary", size: "lg", block: true })}
          >
            Get my verdict
          </Link>
        </div>
      </div>
    </div>
  )
}
