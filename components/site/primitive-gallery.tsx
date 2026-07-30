"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Wrench } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pill } from "@/components/ui/pill"
import { Field, Label, FieldHint, Input, Textarea, Select } from "@/components/ui/field"
import { Segmented } from "@/components/ui/segmented"
import { Switch } from "@/components/ui/switch"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Callout } from "@/components/ui/callout"
import { TableWrapper, Table, Th, Td } from "@/components/ui/table"

/* Sub-heading used inside cards — h3, keeps outline valid under the page h2s. */
function Sub({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-(length:--text-2xs) font-semibold uppercase tracking-[0.08em] text-(--color-muted)">
      {children}
    </h3>
  )
}

const idPrefixCtx = React.createContext("g")

/* A self-contained showcase of every primitive. Rendered standalone and again
 * inside forced light/dark scopes. `idns` namespaces control ids so multiple
 * instances on one page keep unique ids and label associations. */
export function PrimitiveGallery({ idns = "g" }: { idns?: string }) {
  const [verdict, setVerdict] = React.useState("repair")
  const [expedited, setExpedited] = React.useState(true)
  const [warranty, setWarranty] = React.useState(false)

  return (
    <idPrefixCtx.Provider value={idns}>
      <div className="flex flex-col gap-6">
        {/* Buttons */}
        <Card>
          <CardContent className="pt-6">
            <Sub>Buttons</Sub>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Get my verdict</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="subtle">Subtle</Button>
              <Button variant="danger">Danger</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg" className="gap-2">
                Large
                <ArrowRight className="size-4" />
              </Button>
            </div>
            <div className="mt-3">
              <Button block size="lg">
                Full-width block
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Badges & pills */}
        <Card>
          <CardContent className="pt-6">
            <Sub>Badges</Sub>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="brand">Brand</Badge>
              <Badge variant="repair">
                <Wrench />
                Repair
              </Badge>
              <Badge variant="replace">Replace</Badge>
              <Badge variant="uncertain">Uncertain</Badge>
              <Badge variant="danger">Recall</Badge>
              <Badge variant="warn">Aging</Badge>
            </div>
            <div className="mt-5">
              <Sub>Pills</Sub>
              <div className="flex flex-wrap items-center gap-2">
                <Pill variant="neutral">12-year lifespan</Pill>
                <Pill variant="brand">BLS labor data</Pill>
                <Pill variant="repair">Repair favored</Pill>
                <Pill variant="replace">Replace favored</Pill>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Readout / tabular numerals */}
        <Card>
          <CardContent className="pt-6">
            <Sub>Tabular readouts</Sub>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-(--radius-md) border border-(--color-line) bg-(--color-surface-2) p-4">
                <p className="text-(length:--text-xs) text-(--color-muted)">
                  Repair net cost
                </p>
                <p className="readout mt-1 text-(length:--text-2xl) text-(--color-repair-ink)">
                  $1,240
                </p>
              </div>
              <div className="rounded-(--radius-md) border border-(--color-line) bg-(--color-surface-2) p-4">
                <p className="text-(length:--text-xs) text-(--color-muted)">
                  Replace net cost
                </p>
                <p className="readout mt-1 text-(length:--text-2xl) text-(--color-replace-ink)">
                  $1,918
                </p>
              </div>
              <div className="rounded-(--radius-md) border border-(--color-line) bg-(--color-surface-2) p-4">
                <p className="text-(length:--text-xs) text-(--color-muted)">
                  Break-even
                </p>
                <p className="readout mt-1 text-(length:--text-2xl) text-(--color-ink)">
                  3.4<span className="text-(length:--text-base) text-(--color-muted)"> yrs</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form fields */}
        <Card>
          <CardContent className="pt-6">
            <Sub>Form fields</Sub>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <Label htmlFor={`${idns}-price`}>Repair quote</Label>
                <Input
                  id={`${idns}-price`}
                  inputMode="decimal"
                  placeholder="$0.00"
                  defaultValue="420.00"
                  className="tnum"
                />
                <FieldHint>What the technician quoted you.</FieldHint>
              </Field>
              <Field>
                <Label htmlFor={`${idns}-appliance`}>Appliance</Label>
                <Select id={`${idns}-appliance`} defaultValue="refrigerator">
                  <option value="refrigerator">Refrigerator</option>
                  <option value="washer">Washing machine</option>
                  <option value="dishwasher">Dishwasher</option>
                  <option value="dryer">Dryer</option>
                </Select>
                <FieldHint>Sets the Weibull lifespan curve.</FieldHint>
              </Field>
              <Field className="sm:col-span-2">
                <Label htmlFor={`${idns}-notes`}>Symptom notes</Label>
                <Textarea
                  id={`${idns}-notes`}
                  placeholder="e.g. not cooling, compressor runs constantly"
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Segmented + switches */}
        <Card>
          <CardContent className="pt-6">
            <Sub>Segmented control</Sub>
            <Segmented
              name={`${idns}-verdict`}
              aria-label="Preferred outcome"
              value={verdict}
              onValueChange={setVerdict}
              options={[
                { value: "repair", label: "Repair" },
                { value: "replace", label: "Replace" },
                { value: "either", label: "No preference" },
              ]}
            />

            <div className="mt-6">
              <Sub>Toggle switch</Sub>
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between gap-4">
                  <span className="text-(length:--text-sm) text-(--color-body)">
                    Expedited part sourcing
                  </span>
                  <Switch
                    checked={expedited}
                    onCheckedChange={setExpedited}
                    aria-label="Expedited part sourcing"
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span className="text-(length:--text-sm) text-(--color-body)">
                    Still under warranty
                  </span>
                  <Switch
                    checked={warranty}
                    onCheckedChange={setWarranty}
                    aria-label="Still under warranty"
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Breadcrumbs + card w/ footer */}
        <Card>
          <CardHeader>
            <Breadcrumbs
              items={[
                { label: "Cost guides", href: "/cost-guides" },
                { label: "Refrigerators", href: "/cost-guides/refrigerators" },
                { label: "Compressor" },
              ]}
            />
            <CardTitle>Card with header &amp; footer</CardTitle>
            <CardDescription>
              Hairline border, restrained elevation, generous padding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-(length:--text-sm)">
              Cards carry every readout, form, and verdict block across the app.
            </p>
          </CardContent>
          <CardFooter>
            <Link
              href="/methodology"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Read the method
            </Link>
            <Button size="sm" variant="ghost">
              Dismiss
            </Button>
          </CardFooter>
        </Card>

        {/* Callouts */}
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Sub>Callouts</Sub>
            <Callout variant="info" title="How we estimate">
              Costs blend BLS labor rates with EIA energy prices for your ZIP.
            </Callout>
            <Callout variant="repair" title="Repair is the rational choice">
              Repairing saves an estimated $678 in net present cost.
            </Callout>
            <Callout variant="replace" title="Replace is the rational choice">
              A new unit pays for itself within 3.4 years here.
            </Callout>
            <Callout variant="warn" title="Aging appliance">
              This unit is past 80% of its modeled lifespan.
            </Callout>
            <Callout variant="danger" title="Active recall">
              This model has an open CPSC safety recall. Stop using it.
            </Callout>
          </CardContent>
        </Card>

        {/* Table wrapper */}
        <Card>
          <CardContent className="pt-6">
            <Sub>Scrollable table region</Sub>
            <TableWrapper aria-label="Estimated repair costs by component">
              <Table>
                <thead>
                  <tr>
                    <Th>Component</Th>
                    <Th className="text-right">Part</Th>
                    <Th className="text-right">Labor</Th>
                    <Th className="text-right">Total</Th>
                    <Th className="text-right">Failure rate</Th>
                    <Th className="text-right">Lifespan left</Th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Compressor", "$310", "$180", "$490", "6%", "4.1 yrs"],
                    ["Evaporator fan", "$62", "$120", "$182", "11%", "6.8 yrs"],
                    ["Control board", "$145", "$140", "$285", "9%", "5.2 yrs"],
                    ["Door gasket", "$48", "$90", "$138", "18%", "7.9 yrs"],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <Td className="font-medium text-(--color-ink)">{row[0]}</Td>
                      <Td className="tnum text-right">{row[1]}</Td>
                      <Td className="tnum text-right">{row[2]}</Td>
                      <Td className="tnum text-right font-semibold text-(--color-ink)">
                        {row[3]}
                      </Td>
                      <Td className="tnum text-right">{row[4]}</Td>
                      <Td className="tnum text-right">{row[5]}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
            <p className="mt-2 text-(length:--text-xs) text-(--color-muted)">
              Narrow the viewport to see the self-hiding scroll-shadow cues.
            </p>
          </CardContent>
        </Card>
      </div>
    </idPrefixCtx.Provider>
  )
}
