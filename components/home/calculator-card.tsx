"use client"

import * as React from "react"
import useSWR from "swr"
import { fetchCatalog, type Catalog } from "@/lib/catalog"
import type { CalculatePayload } from "@/lib/result"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, Label, FieldHint, Input, Select } from "@/components/ui/field"
import { Segmented } from "@/components/ui/segmented"
import { Switch } from "@/components/ui/switch"

const NOT_SURE = "not_sure"

interface FormState {
  category: string
  tier: string
  age: string
  quote: string
  component: string
  fuel: string
  locationMode: "metro" | "zip"
  metro: string
  zip: string
  warranty: boolean
  energyStar: boolean
  upc: string
}

function validateQuote(value: string): string | null {
  if (value.trim() === "") return "Enter the repair quote to get a verdict."
  const n = Number(value)
  if (!Number.isFinite(n)) return "Enter a valid dollar amount."
  if (n <= 0) return "The quote must be greater than $0."
  return null
}

interface CalculatorCardProps {
  onSubmit: (payload: CalculatePayload) => void
  submitting: boolean
  /** True only after a successful verdict — drives the "Recalculate" relabel. */
  submitted: boolean
}

export function CalculatorCard({ onSubmit, submitting, submitted }: CalculatorCardProps) {
  const { data: catalog, isLoading } = useSWR<Catalog>(
    "/api/catalog",
    fetchCatalog,
    { revalidateOnFocus: false },
  )

  return (
    <section
      aria-labelledby="calculator-heading"
      className="relative flex flex-col rounded-(--radius-lg) border border-(--color-line) bg-(--color-surface) shadow-(--shadow-md)"
    >
      <div className="flex flex-col gap-1 p-6 pb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-2 rounded-full bg-(--color-repair)" aria-hidden />
          <span
            className="inline-flex size-2 rounded-full bg-(--color-replace)"
            aria-hidden
          />
          <p className="text-(length:--text-xs) font-semibold uppercase tracking-[0.14em] text-(--color-muted)">
            The calculator
          </p>
        </div>
        <h2
          id="calculator-heading"
          className="text-(length:--text-xl) font-semibold text-(--color-ink)"
        >
          Get your verdict
        </h2>
        <p className="text-(length:--text-sm) text-(--color-muted)">
          Three fields are enough. The rest sharpen the estimate.
        </p>
      </div>

      {isLoading || !catalog ? (
        <FormSkeleton />
      ) : (
        <CalculatorForm
          catalog={catalog}
          onSubmit={onSubmit}
          submitting={submitting}
          submitted={submitted}
        />
      )}
    </section>
  )
}

function CalculatorForm({
  catalog,
  onSubmit,
  submitting,
  submitted,
}: {
  catalog: Catalog
  onSubmit: (payload: CalculatePayload) => void
  submitting: boolean
  submitted: boolean
}) {
  const firstCategory = catalog.categories[0]

  const [form, setForm] = React.useState<FormState>(() => ({
    category: firstCategory.id,
    tier: "mid",
    age: "",
    quote: "",
    component: NOT_SURE,
    fuel: firstCategory.defaultFuel,
    locationMode: "metro",
    metro: catalog.metros[0]?.slug ?? "",
    zip: "",
    warranty: false,
    energyStar: true,
    upc: "",
  }))
  const [quoteError, setQuoteError] = React.useState<string | null>(null)

  const activeCategory =
    catalog.categories.find((c) => c.id === form.category) ?? firstCategory

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  // When the appliance changes, reset the dependent fields (component list and
  // the fuel default both belong to the new category).
  function onCategoryChange(id: string) {
    const next = catalog.categories.find((c) => c.id === id)
    setForm((f) => ({
      ...f,
      category: id,
      component: NOT_SURE,
      fuel: next?.defaultFuel ?? f.fuel,
    }))
  }

  // Location toggle retargets the label's `for` and moves focus to the
  // revealed field (only after the user has interacted, never on mount).
  const metroRef = React.useRef<HTMLSelectElement>(null)
  const zipRef = React.useRef<HTMLInputElement>(null)
  const locationTouched = React.useRef(false)
  React.useEffect(() => {
    if (!locationTouched.current) return
    if (form.locationMode === "metro") metroRef.current?.focus()
    else zipRef.current?.focus()
  }, [form.locationMode])

  function onQuoteChange(value: string) {
    set("quote", value)
    // Clear the error as soon as the user corrects it.
    if (quoteError && !validateQuote(value)) setQuoteError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateQuote(form.quote)
    setQuoteError(err)
    if (err) {
      document.getElementById("quote")?.focus()
      return
    }

    // Build the request payload for the verdict engine. A blank age is omitted
    // entirely; a typed 0 is sent as 0 — they are different answers.
    const payload: CalculatePayload = {
      category: form.category,
      tier: form.tier,
      quote: Number(form.quote),
      component: form.component === NOT_SURE ? null : form.component,
      warranty: form.warranty,
      energyStar: form.energyStar,
      location:
        form.locationMode === "metro"
          ? { metro: form.metro }
          : { zip: form.zip },
    }
    if (form.age.trim() !== "") payload.age = Number(form.age)
    if (activeCategory.fuelDependent) payload.fuel = form.fuel
    if (form.upc.trim() !== "") payload.upc = form.upc.trim()

    onSubmit(payload)
  }

  const locationLabelFor =
    form.locationMode === "metro" ? "metro-select" : "zip-input"

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col">
      <div className="flex flex-col gap-5 px-6 pb-4">
        {/* Appliance */}
        <Field>
          <Label htmlFor="appliance">Appliance</Label>
          <Select
            id="appliance"
            value={form.category}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {catalog.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>

        {/* Brand tier */}
        <Field>
          <Label htmlFor="tier-group" id="tier-label">
            Brand tier
          </Label>
          <Segmented
            name="tier"
            aria-label="Brand tier"
            value={form.tier}
            onValueChange={(v) => set("tier", v)}
            options={catalog.tiers.map((t) => ({
              value: t.id,
              label: t.label,
            }))}
            className="w-full"
          />
        </Field>

        {/* Age + quote side by side */}
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <Label htmlFor="age">Age in years</Label>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              placeholder="e.g. 7"
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="quote">
              Repair quote{" "}
              <span className="text-(--color-danger-ink)" aria-hidden>
                *
              </span>
            </Label>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(length:--text-sm) text-(--color-muted)"
                aria-hidden
              >
                $
              </span>
              <Input
                id="quote"
                type="number"
                inputMode="decimal"
                min={0}
                required
                placeholder="260"
                className="pl-7"
                value={form.quote}
                onChange={(e) => onQuoteChange(e.target.value)}
                onBlur={() => setQuoteError(validateQuote(form.quote))}
                aria-invalid={quoteError ? true : undefined}
                aria-describedby={quoteError ? "quote-error" : undefined}
              />
            </div>
            {quoteError ? (
              <FieldHint id="quote-error" className="text-(--color-danger-ink)">
                {quoteError}
              </FieldHint>
            ) : null}
          </Field>
        </div>

        {/* Failed part / symptom */}
        <Field>
          <Label htmlFor="component">Failed part or symptom</Label>
          <Select
            id="component"
            value={form.component}
            onChange={(e) => set("component", e.target.value)}
          >
            <option value={NOT_SURE}>I&apos;m not sure</option>
            {activeCategory.components.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>

        {/* Fuel type — only for fuel-dependent categories */}
        {activeCategory.fuelDependent ? (
          <Field>
            <Label htmlFor="fuel-group">Fuel type</Label>
            <Segmented
              name="fuel"
              aria-label="Fuel type"
              value={form.fuel}
              onValueChange={(v) => set("fuel", v)}
              options={[
                { value: "gas", label: "Gas" },
                { value: "electric", label: "Electric" },
              ]}
              className="w-full"
            />
          </Field>
        ) : null}

        {/* Location — Metro vs ZIP toggle */}
        <Field>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={locationLabelFor}>Location</Label>
            <div
              role="group"
              aria-label="Location input method"
              className="inline-flex rounded-(--radius-sm) border border-(--color-line) bg-(--color-surface-2) p-0.5"
            >
              {(["metro", "zip"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={form.locationMode === mode}
                  onClick={() => {
                    locationTouched.current = true
                    set("locationMode", mode)
                  }}
                  className={cn(
                    "rounded-[calc(var(--radius-sm)-3px)] px-2.5 py-1 text-(length:--text-xs) font-medium transition-colors [transition-duration:var(--duration-fast)]",
                    "has-[:focus-visible]:outline-2",
                    form.locationMode === mode
                      ? "bg-(--color-surface) text-(--color-ink) shadow-(--shadow-xs)"
                      : "text-(--color-muted) hover:text-(--color-body)",
                  )}
                >
                  {mode === "metro" ? "Metro" : "ZIP code"}
                </button>
              ))}
            </div>
          </div>

          {form.locationMode === "metro" ? (
            <Select
              id="metro-select"
              ref={metroRef}
              value={form.metro}
              onChange={(e) => set("metro", e.target.value)}
            >
              {catalog.metros.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id="zip-input"
              ref={zipRef}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="e.g. 60601"
              maxLength={5}
              value={form.zip}
              onChange={(e) =>
                set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))
              }
            />
          )}
          <FieldHint>Sets your local labor market.</FieldHint>
        </Field>

        {/* Switches */}
        <div className="flex flex-col gap-3 rounded-(--radius-md) border border-(--color-line) bg-(--color-surface-2) p-4">
          <SwitchRow
            id="warranty"
            label="Still under warranty?"
            checked={form.warranty}
            onChange={(v) => set("warranty", v)}
          />
          <SwitchRow
            id="energy-star"
            label="Replace with ENERGY STAR?"
            checked={form.energyStar}
            onChange={(v) => set("energyStar", v)}
          />
        </div>

        {/* Advanced — recall check */}
        <details
          id="advanced-recall"
          className="group rounded-(--radius-md) border border-(--color-line) bg-(--color-surface) [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-(--radius-md) px-4 py-3 text-(length:--text-sm) font-medium text-(--color-ink) focus-visible:outline-2 focus-visible:outline-(--color-ring)">
            <span>Advanced — recall check</span>
            <svg
              viewBox="0 0 20 20"
              className="size-4 shrink-0 text-(--color-muted) transition-transform [transition-duration:var(--duration-fast)] group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className="border-t border-(--color-line) px-4 py-4">
            <Field>
              <Label htmlFor="upc">Model UPC (optional)</Label>
              <Input
                id="upc"
                inputMode="numeric"
                placeholder="12-digit code on the label"
                value={form.upc}
                onChange={(e) => set("upc", e.target.value)}
              />
              <FieldHint>
                We&apos;ll cross-check open CPSC safety recalls for this model.
              </FieldHint>
            </Field>
          </div>
        </details>
      </div>

      {/* Sticky commit bar — the primary action is always reachable */}
      <div className="sticky bottom-0 z-10 mt-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-full h-8 bg-gradient-to-t from-(--color-surface) to-transparent"
        />
        <div className="rounded-b-(--radius-lg) border-t border-(--color-line) bg-(--color-surface) px-6 pb-6 pt-4">
          <Button type="submit" size="lg" block disabled={submitting}>
            {submitting
              ? "Running the numbers…"
              : submitted
                ? "Recalculate"
                : "Get my verdict"}
          </Button>
          <p
            className={cn(
              "mt-2 min-h-4 text-center text-(length:--text-xs)",
              submitting ? "text-(--color-brand-ink)" : "text-(--color-muted)",
            )}
          >
            {submitting
              ? "Crunching net-present cost on real data."
              : "Free. No sign-up. Your answer stays on this page."}
          </p>
        </div>
      </div>
    </form>
  )
}

function SwitchRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-(length:--text-sm) font-medium text-(--color-ink)">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/* Mirrors the default (non-fuel, metro) form layout so the card reserves its
 * real height and does not shift when the catalog resolves (CLS < 0.05). */
function FormSkeleton() {
  return (
    <div aria-hidden className="flex flex-col">
      <div className="flex flex-col gap-5 px-6 pb-4">
        <SkelField />
        <SkelField control="h-11" />
        <div className="grid grid-cols-2 gap-4">
          <SkelField />
          <SkelField />
        </div>
        <SkelField />
        <SkelField />
        <div className="skeleton h-[92px]" />
        <div className="skeleton h-[50px]" />
      </div>
      <div className="border-t border-(--color-line) bg-(--color-surface) px-6 pb-6 pt-4">
        <div className="skeleton h-12" />
        <div className="mx-auto mt-2 h-4 w-2/3 skeleton" />
      </div>
    </div>
  )
}

function SkelField({ control = "h-10" }: { control?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="skeleton h-4 w-24" />
      <div className={cn("skeleton w-full", control)} />
    </div>
  )
}
