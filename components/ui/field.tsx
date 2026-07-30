import * as React from "react"
import { cn } from "@/lib/utils"

/* Shared control chrome. The visible focus ring is delivered by the global
 * :focus-visible rule (2px solid var(--ring)). We deliberately DO NOT set a
 * custom box-shadow "glow" that would tempt us into `outline: none`. */
const controlBase =
  "w-full rounded-(--radius-sm) border border-(--color-line-strong) bg-(--color-surface) text-(--color-ink) " +
  "placeholder:text-(--color-muted) shadow-(--shadow-xs) " +
  "transition-colors [transition-duration:var(--duration-fast)] [transition-timing-function:var(--ease-out-quint)] " +
  "hover:border-(--color-line-strong) focus:border-(--color-brand) " +
  "disabled:cursor-not-allowed disabled:opacity-55"

function Field({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />
}

function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-(length:--text-sm) font-medium text-(--color-ink)",
        className,
      )}
      {...props}
    />
  )
}

function FieldHint({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-(length:--text-xs) text-(--color-muted)",
        className,
      )}
      {...props}
    />
  )
}

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(controlBase, "h-10 px-3 text-(length:--text-sm)", className)}
      {...props}
    />
  )
})
Input.displayName = "Input"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(controlBase, "min-h-24 px-3 py-2 text-(length:--text-sm)", className)}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(controlBase, "h-10 px-3 text-(length:--text-sm)", className)}
      {...props}
    />
  )
})
Select.displayName = "Select"

export { Field, Label, FieldHint, Input, Textarea, Select }
