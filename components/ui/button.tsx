import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "select-none transition-colors [transition-duration:var(--duration-fast)] [transition-timing-function:var(--ease-out-quint)]",
    "disabled:pointer-events-none disabled:opacity-55",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-[--color-brand] text-[--color-on-brand] shadow-[--shadow-xs] hover:bg-[--color-brand-strong] active:bg-[--color-brand-ink]",
        ghost:
          "bg-transparent text-[--color-body] hover:bg-[--color-surface-2] hover:text-[--color-ink]",
        outline:
          "border border-[--color-line-strong] bg-[--color-surface] text-[--color-ink] shadow-[--shadow-xs] hover:bg-[--color-surface-2]",
        danger:
          "bg-[--color-danger] text-[--color-on-danger] shadow-[--shadow-xs] hover:brightness-95 active:brightness-90",
        subtle:
          "bg-[--color-surface-2] text-[--color-ink] hover:bg-[--color-surface-3]",
      },
      size: {
        sm: "h-8 rounded-[--radius-xs] px-3 text-[length:var(--text-xs)]",
        md: "h-10 rounded-[--radius-sm] px-4 text-[length:var(--text-sm)]",
        lg: "h-12 rounded-[--radius-md] px-6 text-[length:var(--text-base)]",
        icon: "h-10 w-10 rounded-[--radius-sm]",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
