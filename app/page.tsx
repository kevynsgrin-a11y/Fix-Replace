import Link from "next/link"
import { Container } from "@/components/ui/container"
import { Hero } from "@/components/home/hero"
import { WorkedExample } from "@/components/home/worked-example"
import { CalculatorExperience } from "@/components/home/calculator-experience"
import { HowItWorks } from "@/components/home/how-it-works"
import { TrustSection } from "@/components/home/trust-section"
import { FaqSection, FAQS } from "@/components/home/faq-section"
import { ConversionBand } from "@/components/home/conversion-band"
import {
  graphLd,
  organizationLd,
  websiteLd,
  faqLd,
  jsonLdScript,
} from "@/lib/json-ld"

/**
 * The Organization (#organization) and WebSite (#website) nodes are referenced
 * by @id from every other page on the site, so they have to be *published*
 * somewhere — the site root is the conventional home for them. The FAQ nodes
 * are built from the same FAQS array the visible section renders, so the
 * structured data can never drift from the on-page copy.
 */
const ld = graphLd(organizationLd(), websiteLd(), faqLd(FAQS))

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(ld) }}
      />

      {/* Above the fold: the 3-second test. Hero left, calculator right. */}
      <Container className="py-10 lg:py-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Left column: pitch + worked example */}
          <div className="flex flex-col gap-8">
            <Hero />
            <WorkedExample />
          </div>

          {/* Right column: the calculator (and, after submit, the result) */}
          <CalculatorExperience />
        </div>
      </Container>

      {/* Below the fold: trust, method, FAQ, and a final conversion band. */}
      <HowItWorks />
      <TrustSection />
      <FaqSection />
      <ConversionBand />
    </>
  )
}
