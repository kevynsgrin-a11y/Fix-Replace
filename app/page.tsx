import Link from "next/link"
import { Container } from "@/components/ui/container"
import { Pill } from "@/components/ui/pill"
import { buttonVariants } from "@/components/ui/button"

export default function HomePage() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center py-20">
        <Pill variant="brand">Design system · Batch 1</Pill>
        <h1 className="mt-5 max-w-3xl text-(length:--text-4xl)">
          The chrome is in place. The verdict comes next.
        </h1>
        <p className="mt-5 max-w-xl text-(length:--text-lg) text-(--color-muted)">
          Site chrome and design system for RepairOrReplace are ready. Page
          content ships in the next batch.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/components"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            View the component library
          </Link>
          <Link
            href="/calculator"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Get my verdict
          </Link>
        </div>
    </Container>
  )
}
