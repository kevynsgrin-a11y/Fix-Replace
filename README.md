# RepairOrReplace

**RepairOrReplace** is a Next.js web app that answers a deceptively hard
household question: when a major appliance breaks, is it economically rational
to pay for the repair, or to replace the unit? Instead of the usual folk
heuristics ("if the repair costs more than half of a new one, replace it"), it
runs a transparent financial model — a Weibull reliability estimate of remaining
useful life, a risk-adjusted expected repair cost, a localized energy sub-model,
and an equivalent-service Net Present Cost comparison — then returns a
plain-English verdict with every number sourced and shown. It refuses to fake
precision: vague inputs lower a confidence score, and predatory quotes suppress
the verdict entirely in favor of "get a second opinion."

Canonical origin: **https://repair-or-replace.com**, defined once in
[`lib/site.ts`](lib/site.ts).

---

## The problem it solves

Appliance repair-or-replace advice is dominated by rules of thumb that ignore
the factors that actually decide the math:

- **Age and failure risk.** A single "average lifespan" number is misleading. An
  aging machine's *other* components are just as old, so the real cost of a
  repair includes the elevated odds of a second failure soon after.
- **Regional cost variation.** A repair that is fairly priced in Miami can look
  like gouging in Minneapolis, because retail service prices track the local
  field-labor market.
- **Energy and efficiency.** In high-utility-cost states, the operating savings
  of a modern efficient unit can flip the decision toward replacement — a factor
  generic advice columns omit.
- **The time value of money.** Repair and replacement have different service
  lives, so comparing them fairly requires discounting cash flows over a common
  horizon, not summing sticker prices.
- **Safety and trust.** Gas, high-voltage, and refrigerant work carries real
  physical risk, and inflated quotes are common. Good advice has to hard-stop on
  hazards and flag predatory pricing rather than confidently mislead.

RepairOrReplace models all of these and presents the result with full
provenance, so a homeowner (and, later, a landlord or a technician) can make the
call with evidence rather than a guess.

---

## Features

- **Evidence-based verdict** — `repair`, `replace`, or `uncertain`, with a
  headline, a plain-English explanation, and a 0–100 gauge position.
- **Weibull remaining-useful-life model** — conditional survival at 12/24/36
  months and a median-remaining-life estimate, fit per (category, brand tier).
- **Risk-adjusted repair cost** — the entered quote plus the modeled cost of a
  likely near-term second failure, both driven by the same reliability curve.
- **Equivalent-service Net Present Cost** — replace-now vs. repair-and-run over a
  shared horizon, with monthly discounting, a mid-horizon replacement outlay, a
  terminal residual credit, and a break-even month.
- **Localized labor and energy** — metro / ZIP / state resolution of BLS labor
  multipliers and EIA energy rates, with graceful national fallbacks.
- **Safety hard-stops** — automatic suppression of DIY parts links and tutorials
  for gas, high-voltage, and refrigerant work; microwaves are always treated as
  high-voltage.
- **Predatory-quote detection** — quotes far outside the regional norm suppress a
  definitive verdict and surface a warning.
- **Federal recall lookup** — optional CPSC SaferProducts.gov lookup by UPC,
  fetched live per request with a 5-second timeout; never blocks the economic
  result.
- **Neutral monetization** — affiliate and lead-gen placements are computed
  *after* and *separately from* the verdict, and always carry an FTC disclosure.
- **Full provenance** — every user-facing figure is labeled with its source
  (NAHB, InterNACHI, BLS, EIA, CPSC).
- **Statically generated editorial surface** — appliance cost guides and metro
  cost pages are prerendered from the same engine data the calculator uses, so
  the published numbers cannot drift from the model.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16, App Router |
| UI | React 19, Server Components by default |
| Styling | Tailwind CSS 4 (CSS-first config, design tokens in `app/globals.css`) |
| Language | TypeScript 5.7, `strict` |
| API | Next.js Route Handlers under `app/api/` |
| Data | In-code TypeScript modules under `src/data/` — no database |
| Tests | Vitest (node environment) |
| Runtime | Node.js ≥ 22 |

The calculation core in `src/core/` is plain, portable TypeScript with no
framework, DOM, or platform dependencies. The same functions run in Vitest and
in the Route Handlers, so a passing test is a real guarantee about the API.

### There is no database

Every reference figure — lifespans, labor multipliers, energy rates, component
cost bands, ancillary costs — is read from a TypeScript module in `src/data/`
that is compiled into the bundle. There is no SQL, no key-value cache, and no
object store in the request path. The only network call the app makes is the
optional CPSC recall lookup, and that is best-effort.

Nothing is written to disk, and no request payload, result, or identifier is
retained. The one piece of per-client state anywhere in the app is the
in-memory rate-limit counter in `POST /api/calculate` — an IP string and the
timestamps of its last few requests, held in a module-level `Map` inside a
single server instance, dropped once those timestamps age out of the 60-second
window, and only recorded at all when the deployment sets
`TRUST_PROXY_HEADER=1`. See [Guards](#post-apicalculate) below.

> **Historical note.** Earlier revisions of this project were a Cloudflare
> Worker backed by D1, KV, and R2. That stack is gone: there is no
> `wrangler.jsonc`, no `src/worker/`, no `migrations/`, no `wrangler`
> dependency in `package.json`, and no deploy workflow — `.github/workflows/`
> holds `ci.yml` and nothing else. Documents describing it
> ([`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md),
> [`docs/V0-INTEGRATION.md`](docs/V0-INTEGRATION.md),
> [`docs/DEPLOY-BROWSER-GUIDE.md`](docs/DEPLOY-BROWSER-GUIDE.md)) are retained
> for history only and carry deprecation banners. Do not follow them.

---

## Project structure

```text
Fix-Replace/
├── .github/
│   └── workflows/
│       └── ci.yml            # typecheck + test + build (the only workflow)
├── package.json              # scripts and deps (next, react, tailwind, vitest)
├── next.config.mjs           # security headers (CSP, HSTS, framing, referrer)
├── tsconfig.json             # strict TS; excludes node_modules and test/
├── vitest.config.ts          # node test environment
├── app/                      # Next.js App Router
│   ├── layout.tsx            #   root layout, theme provider, site chrome
│   ├── globals.css           #   Tailwind 4 entry + design tokens
│   ├── page.tsx              #   home: the calculator experience
│   ├── api/
│   │   ├── calculate/route.ts  # POST — the decision engine endpoint
│   │   ├── catalog/route.ts    # GET  — intake-form data
│   │   └── report/route.ts     # POST — currently 503 (sharing unimplemented)
│   ├── og/route.tsx          #   generated Open Graph cards (edge runtime)
│   ├── cost-guides/          #   appliance guides (hub + [slug], prerendered)
│   ├── local-costs/          #   metro cost pages (hub + [slug], prerendered)
│   ├── how-it-works/, methodology/, about/, for-technicians/,
│   ├── recall-checks/, privacy/, terms/, components/
│   ├── r/                    #   shared-result viewer (force-dynamic)
│   ├── robots.ts, sitemap.ts, manifest.ts, not-found.tsx
├── components/
│   ├── home/                 #   hero, calculator card, trust, worked example
│   ├── result/               #   the result document and its panels
│   ├── guide/, metro/        #   editorial page templates
│   ├── site/                 #   header, footer, drawer, theme toggle
│   └── ui/                   #   primitives (button, card, field, table, …)
├── lib/
│   ├── site.ts               #   canonical origin + operating entity (one source)
│   ├── page-data.ts          #   server-only: builds guide/metro page data
│   ├── catalog.ts, result.ts #   client-side type contracts for the API
│   ├── json-ld.ts            #   structured-data builders
│   └── navigation.ts, utils.ts, use-reduced-motion.ts
├── src/
│   ├── core/                 # pure, portable calculation library
│   │   ├── types.ts          #   shared domain contract (Input/Result shapes)
│   │   ├── weibull.ts        #   RUL reliability model
│   │   ├── repairCost.ts     #   expected (risk-adjusted) repair cost
│   │   ├── energy.ts         #   localized energy sub-model
│   │   ├── npc.ts            #   Net Present Cost comparison
│   │   ├── safety.ts         #   hazard hard-stops / DIY suppression
│   │   ├── confidence.ts     #   confidence scoring + predatory-quote suppression
│   │   ├── monetization.ts   #   affiliate/lead-gen block (post-verdict)
│   │   ├── decision.ts       #   orchestrator: inputs -> CalculationResult
│   │   ├── catalog.ts        #   UI catalog builder (categories, tiers, metros)
│   │   └── index.ts          #   public surface of the core library
│   ├── data/                 # seeded reference data (representative figures)
│   │   ├── appliances.ts     #   categories, prices, energy profiles
│   │   ├── lifespans.ts      #   tier lifespan bands (NAHB / InterNACHI)
│   │   ├── laborRates.ts     #   BLS 49-9031 metro/state wage multipliers
│   │   ├── energyRates.ts    #   EIA electricity / gas rates by state
│   │   ├── partCosts.ts      #   component cost bands, hazards, DIY flags
│   │   └── ancillary.ts      #   install / delivery / disposal costs
│   └── recalls/
│       └── cpsc.ts           # CPSC SaferProducts.gov client
├── public/                   # icons and og.png only — robots, sitemap and the
│                             #   web manifest are generated by app/robots.ts,
│                             #   app/sitemap.ts and app/manifest.ts
└── test/                     # Vitest suites, one per core module
```

---

## Getting started

### Prerequisites

- Node.js 22 or newer (`engines.node` is `>=22`) and npm

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev         # next dev, on $PORT or 3000
```

Open <http://localhost:3000>. Everything — pages and `/api/*` — is served by the
one Next.js app; there is no separate backend to start.

### Verify

```bash
npm run typecheck   # tsc --noEmit
npm run test        # vitest run
npm run build       # next build — catches prerender + route-export errors
```

`npm run build` is worth running before pushing: it catches broken imports,
invalid route exports, and static-generation failures that `typecheck` alone
does not reach. CI (`.github/workflows/ci.yml`) runs typecheck, tests, and the
build on every pull request and push to `main` — the same three commands, so
green locally means green in CI.

There is **no lint step**. Next.js 16 removed the `next lint` command, and the
project has no ESLint configuration or dependency, so there is nothing to run;
`tsc --noEmit` under `strict` is the static-analysis gate. Adding ESLint means
adding the dependency and a flat config, not restoring a script.

### Environment variables

Everything has a working default; none of these are required for local
development.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://repair-or-replace.com` | Canonical origin used for canonical tags, Open Graph URLs, the sitemap, and JSON-LD. Set it on preview/staging deployments so those hosts do not advertise the production URL. |
| `CPSC_API_BASE` | `https://www.saferproducts.gov/RestWebServices/Recall` | Base URL for the CPSC Recall API. Point at a mock or proxy for testing. |
| `TRUST_PROXY_HEADER` | unset | Set to `1` **only** when the app sits behind a proxy that overwrites `x-forwarded-for`. It is what enables the per-IP rate limiter on `POST /api/calculate`; left unset, the header is ignored and per-client limiting is skipped rather than keyed on an attacker-controlled value. |
| `PORT` | `3000` | Dev-server port. |

---

## API reference

Three Route Handlers live under `app/api/`. Security headers (CSP, HSTS,
`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
`Permissions-Policy`, `Cross-Origin-Opener-Policy`) are applied to every
response by the `headers()` block in `next.config.mjs`, not per route.

### `GET /api/catalog`

Returns the data the intake form needs, projected from `src/core/catalog.ts`
down to the lean client contract in `lib/catalog.ts` so the client ships no
duplicated domain data. Served with
`Cache-Control: public, max-age=3600, s-maxage=86400`.

```json
{
  "categories": [
    {
      "id": "dishwasher",
      "label": "Dishwasher",
      "fuelDependent": false,
      "defaultFuel": "electric",
      "components": [{ "id": "drain_pump", "label": "Drain pump" }]
    }
  ],
  "tiers": [
    { "id": "budget", "label": "Budget / entry" },
    { "id": "mid", "label": "Mid-range" },
    { "id": "premium", "label": "Premium / luxury" }
  ],
  "metros": [{ "slug": "los-angeles", "name": "Los Angeles, CA" }]
}
```

### `POST /api/calculate`

The core endpoint (`runtime = "nodejs"`). Accepts the client payload and returns
a full `CalculationResult`.

**Guards, in order:** a declared `Content-Length` over 10,000 bytes returns
`413` without reading the body; the rate limiter may return `429`; the body is
then read as text and its **actual** byte length re-checked against the same
10,000-byte cap, returning `413` if it exceeds it, so a chunked or
under-declared payload cannot slip past the header check into `JSON.parse`; an
unparseable or non-object body returns `400`.

> **The rate limiter is off unless the deployment opts in.** It keys on the
> first `x-forwarded-for` entry, which is only meaningful behind a proxy that
> overwrites it — unproxied it is attacker-controlled and usually absent, which
> would collapse every visitor into one bucket and `429` the calculator
> site-wide. So it is read only when `TRUST_PROXY_HEADER=1`; otherwise
> per-client limiting is skipped entirely and no client state is recorded.
>
> When it is on: a sliding window of 20 requests per 60 seconds per IP, held in
> a module-level `Map` of IP → request timestamps, swept once per window, with
> a hard ceiling of 10,000 tracked clients (cleared outright if a flood of
> unique keys survives a sweep). It is per-instance in-memory state that never
> touches disk and never leaves the process. Serverless instances do not share
> memory, so it is an interim backstop against a single noisy client, not a
> substitute for platform-level (WAF/edge) rate limiting — which is the *only*
> control on a deployment that leaves `TRUST_PROXY_HEADER` unset.

**Validation:** `category` must be one of the twelve known categories and
`quote` must be a finite number greater than zero. Everything else is optional:
`tier` defaults to `mid`, `energyStar` defaults to true, an omitted `age` is
left unset, and an unknown `component` lowers confidence rather than blocking a
result.

**Request:**

```json
{
  "category": "dishwasher",
  "tier": "budget",
  "age": 9,
  "component": "control_board",
  "quote": 380,
  "location": { "metro": "los-angeles" },
  "fuel": "electric",
  "warranty": false,
  "energyStar": true,
  "upc": "012345678905"
}
```

`location` accepts either `{ "metro": "<slug>" }` or `{ "zip": "<zip>" }`.
Supplying a `upc` opts into a live federal recall lookup. Non-digits are
stripped first, and only a 12–14 digit result (UPC-A / EAN-13 / GTIN-14) opts
in: CPSC wildcard-matches the UPC field, so a partial code would match an
unrelated recalled product, and a recall hit hard-overrides the verdict. A
shorter or garbled value is treated as no UPC at all.

**Response** (`CalculationResult` minus the internal `resolvedInput` echo, which
the route strips; values below are representative and rounded — the engine
computes them):

```json
{
  "verdict": "replace",
  "verdictHeadline": "Replace it.",
  "verdictExplanation": "Over a 7.5 year horizon, replacing costs $1,356 in today's dollars versus $1,914 to repair and keep running the old unit — a $558 advantage to replacing. Replacing pulls ahead after about 1 year.",
  "gaugePosition": 99,
  "rul": {
    "shape": 3.88,
    "scaleYears": 8.27,
    "medianRemainingYears": 1.0,
    "survival12Months": 0.50,
    "survival24Months": 0.20,
    "survival36Months": 0.06,
    "annualFailureProbability": 0.50
  },
  "repairCost": {
    "quote": 380,
    "repeatFailureProbability": 0.80,
    "subsequentRepairCost": 291,
    "expected": 614
  },
  "energy": {
    "annualOldCost": 102.3,
    "annualNewCost": 74.4,
    "annualSavings": 27.9,
    "electricityRate": 0.31,
    "gasRate": 0,
    "localized": true
  },
  "npc": {
    "horizonYears": 7.5,
    "discountRate": 0.05,
    "replace": 1356,
    "repair": 1914,
    "advantageOfReplacing": 558,
    "replaceBreakdown": { "upfront": 890, "energyPresentValue": 466, "salvageCredit": 0, "riskAdjustment": 0 },
    "repairBreakdown": { "upfront": 1462, "energyPresentValue": 494, "salvageCredit": 41, "riskAdjustment": 0 },
    "breakEvenMonths": 12
  },
  "safety": {
    "professionalRequired": false,
    "diySuppressed": false,
    "hazards": [],
    "messages": []
  },
  "confidence": {
    "score": 100,
    "level": "high",
    "suppressed": false,
    "factors": ["Quote sits within the typical regional range of $209–$521."],
    "warnings": []
  },
  "recall": {
    "status": "clear",
    "matches": [],
    "note": "No open federal recall found for this UPC."
  },
  "monetization": {
    "affiliateLinks": [
      { "kind": "new_unit", "label": "Shop Dishwasher", "merchant": "The Home Depot", "url": "https://www.homedepot.com/s/budget%20Dishwasher" }
    ],
    "leadGen": [],
    "showDisplayAds": false,
    "disclosure": "Disclosure: RepairOrReplace may earn a commission on parts or products bought through these links, and a referral fee if you request a quote from a local pro. These partnerships never influence your result above or which repair-vs-replace verdict we show."
  },
  "provenance": [
    { "label": "Appliance lifespans (by brand tier)", "source": "NAHB Study of Life Expectancy of Home Components; InterNACHI Estimated Life Expectancy Chart" },
    { "label": "Regional labor rates", "source": "BLS OEWS occupation 49-9031 (Home Appliance Repairers), May 2024" },
    { "label": "Energy rates", "source": "EIA residential electricity & natural gas rates (CA state rates)" },
    { "label": "Removal & disposal costs", "source": "National appliance-removal cost survey ($109–$244 typical)" },
    { "label": "Safety recalls", "source": "CPSC SaferProducts.gov Recall API" },
    { "label": "Discount rate", "source": "5.0% macro opportunity cost of capital" }
  ]
}
```

When the confidence logic suppresses the verdict (e.g. a predatory quote),
`verdict` is `"uncertain"` and `gaugePosition` is `null`.

`recall.status` is one of `active`, `clear`, `unavailable`, or `not_checked`.
The route distinguishes the last two deliberately: `not_checked` means the user
supplied no UPC, so the UI can invite them to run a check instead of showing a
false "recall check unavailable." An engine failure returns `500`.

### `POST /api/report`

Report sharing is **not implemented**. The endpoint returns `503` with
`{ "error": "Sharing is not available yet.", "disabled": true }`, and the client
treats a `503` as "sharing is turned off" — it disables the button rather than
offering a retry that could never succeed. The `/r` viewer page exists and is
wired to `GET /api/report?id=`, so restoring the feature is a matter of
implementing persistence behind this route.

### Recall lookups

There is no standalone recall endpoint. Recall checking happens inside
`POST /api/calculate` when a valid `upc` is supplied: the route injects
`fetchRecallsByUpc` from `src/recalls/cpsc.ts` into the otherwise-pure core via
`calculateDecision`'s `recallLookup` option. The client owns a 5-second timeout,
caps the response body at 2 MB (counted as the bytes arrive, since the declared
`Content-Length` is only a fast path), and degrades to `unavailable` on any
network, size, or parse failure — so a recall check can never block or fail the
economic verdict. Every lookup is a live call; **there is no cache.**

---

## Algorithms

All formulas below live in `src/core/` and are covered by the suites in `test/`
(one per module).

### 1. Weibull remaining useful life (`weibull.ts`)

Appliance lifespan is treated as a Weibull failure distribution rather than a
single number. Each tier's `[low, high]` lifespan band is interpreted as the
**interquartile range** (25th–75th percentile), which pins both parameters:

```
R(low)  = 0.75  ⇒  (low / η)^k  = −ln(0.75) = Q25
R(high) = 0.25  ⇒  (high / η)^k = −ln(0.25) = Q75

shape  k = ln(Q75 / Q25) / ln(high / low)        (clamped to [1.4, 8])
scale  η = low / Q25^(1/k)
```

Reliability and conditional survival (given the unit already survived to age `a`):

```
R(t)          = exp( −(t/η)^k )
R(a + d | a)  = exp( (a/η)^k − ((a + d)/η)^k )
```

Median remaining life solves `R(a + m | a) = 0.5`:

```
median remaining m = η · ( (a/η)^k + ln 2 )^(1/k) − a
```

The model reports conditional survival at 12/24/36 months and an annual failure
probability of `1 − R(a + 1 | a)`.

### 2. Expected (risk-adjusted) repair cost (`repairCost.ts`)

Paying the quote ignores that an old machine's other components are just as
likely to fail soon. The repeat-failure probability is read from the same Weibull
curve over a 2-year window:

```
P_repeat        = min( 0.85, 1 − R(a + 2 | a) )
C_subsequent    = midpoint(category default repair) · (0.4 + 0.6 · laborMultiplier)
E[C_repair]     = C_quote + P_repeat · C_subsequent
```

Because the Weibull hazard rises past the median lifespan, `P_repeat` climbs
steeply for old units — the age penalty, sourced from the reliability model
rather than a second guess.

### 3. Localized energy sub-model (`energy.ts`)

```
new(kWh/therms) = ENERGY STAR ? profile.new
                              : old − 0.5 · (old − profile.new)   // half the gain
annualOldCost   = oldKwh · electricRate + oldTherms · gasRate
annualNewCost   = newKwh · electricRate + newTherms · gasRate
annualSavings   = annualOldCost − annualNewCost
```

Rates are localized by state (EIA), falling back to national averages.

### 4. Equivalent-service Net Present Cost (`npc.ts`)

The two options have different service lives, so they are compared over a common
horizon `H` (the expected lifespan of the new unit), with equivalent service on
both paths and monthly discounting at the macro discount rate `r`:

```
monthly discount   rm = (1 + r)^(1/12) − 1
discount factor    disc(m) = 1 / (1 + rm)^m

Replace now:  upfront = newUnitPrice + install + delivery + disposal − salvage;
              run the new unit's energy for the whole horizon.
Repair:       upfront = E[C_repair]; run the old unit until its remaining life
              R_old, then buy a replacement (PV of that outlay = upfront_replace ·
              disc(R_old·12)) and run it to H. Credit the still-young replacement
              its terminal residual value:
                  residual = newUnitPrice · (R_old / H) · disc(H·12)

advantageOfReplacing = NPC_repair − NPC_replace        (> 0 favors replacing)
breakEvenMonths      = first month where cumulative replace cost ≤ cumulative repair cost
```

The default discount rate is `5%` (`DEFAULT_DISCOUNT_RATE` in
`src/core/decision.ts`); `npc.ts` clamps any supplied rate to `[0, 0.5]`.

### 5. Confidence & suppression (`confidence.ts`)

A 0–100 completeness/plausibility score, starting at 100:

| Condition | Effect |
| --- | --- |
| No specific failed component | −25 |
| No appliance age | −20 |
| No location | −10 |
| Quote > 2.0× regional high | **suppress verdict**, −30, predatory warning |
| Quote > 1.4× regional high | −10 (elevated) |
| Quote < 0.35× regional low | −10, "unusually low" warning |

Levels: `suppressed`, then `high (≥80)`, `moderate (≥60)`, else `low`. When
suppressed, the decision layer returns `uncertain` with a null gauge and a
"get a second opinion" message — the guard against fake precision.

### 6. Safety hard-stops (`safety.ts`)

Hazard tags come from the failed component; any internal microwave repair is
treated as high-voltage regardless of the named component.

- **`gas`, `high_voltage`, `refrigerant`** ⇒ `professionalRequired = true` and
  `diySuppressed = true` (no DIY parts links or tutorials are offered).
- A known component that simply isn't homeowner-serviceable (e.g. a washer
  transmission) also suppresses DIY, though it carries no hazard message.
- **`water`** surfaces a caution message but is not a hard-stop.

### Verdict resolution (`decision.ts`)

The orchestrator wires the modules together, then:

- if confidence is **suppressed** → `uncertain`, gauge `null`;
- otherwise a base gauge `g = 50 + 50·tanh( advantage / (0.5 · newUnitPrice) )`,
  pulled down to ≤ 15 when an **active recall** or **warranty** applies;
- an active recall or an in-warranty unit resolves to `repair` (pursue the free
  remedy); otherwise `advantage ≥ 0` → `replace`, else `repair`. A margin within
  `0.08 · newUnitPrice` is surfaced as a "it's close" headline.

---

## Data & provenance

The reference data in `src/data/` is **seeded and representative** — anchored to
published figures but intended as a defensible baseline, not a live feed. It is
compiled into the bundle; there is no database behind it. Every user-facing
number is labeled with its source in the `provenance` array. Swap in live data
at these seams:

| Domain | File | Source | How to make it live |
| --- | --- | --- | --- |
| Appliance lifespans (by tier) | `src/data/lifespans.ts` | NAHB Study of Life Expectancy of Home Components; InterNACHI Estimated Life Expectancy Chart | Refresh bands from the source charts; keep the `[low, high]` IQR convention. |
| Labor rates | `src/data/laborRates.ts` | BLS OEWS occupation **49-9031** (Home Appliance Repairers), May 2024 | Expand the metro/ZIP/state tables from the full BLS crosswalk, or move `resolveLabor` behind a data store if the grid outgrows the bundle. |
| Energy rates | `src/data/energyRates.ts` | EIA residential electricity & natural gas rates | Refresh the per-state series from EIA on a release cadence, or fetch and cache them if per-request freshness is ever needed. |
| Component costs & hazards | `src/data/partCosts.ts` | Strategy-brief cost bands; industry norms | Calibrate bands against observed quotes once any usage logging exists. |
| Removal / disposal | `src/data/ancillary.ts` | National appliance-removal cost survey ($109–$244 typical) | Regionalize disposal like labor. |
| Safety recalls | `src/recalls/cpsc.ts` | **CPSC** SaferProducts.gov Recall API | Live: `POST /api/calculate` calls the CPSC API per request when a UPC is supplied, with a 5s timeout, a 2 MB response cap, and graceful degradation. Not cached — the file's `checkRecall` sketches a cached path but needs a `RecallCache` binding nothing currently supplies. |

The same modules feed the editorial pages: `lib/page-data.ts` builds the cost
guides and metro pages from `lifespans.ts`, `partCosts.ts`, and `laborRates.ts`
at build time, so published figures and calculator figures cannot diverge.

### A note on `src/recalls/cpsc.ts`

Only `fetchRecallsByUpc` (and `parseRecalls` and the capped body reader, which
it uses) is on the shipping path. The file also exports `checkRecall`,
`ingestRecentRecalls`, and a `RecallEnv` interface — leftovers from the Worker
architecture that are **not called by anything**. `checkRecall` is the cached
variant, but it requires a `CACHE` binding that this deployment never provides,
so the live path calls `fetchRecallsByUpc` directly and uncached.

The module **is** typechecked. It no longer references Cloudflare's ambient
`KVNamespace`: the cache dependency is now a local structural `RecallCache`
interface (`get`/`put`), satisfied by any store of that shape, and
`"src/recalls"` has been removed from `tsconfig.json`'s `exclude` — which now
lists only `node_modules` and `test`. The exclusion was never a real fix
anyway: `exclude` filters root file discovery, so once the calculate route
imported this module it entered the program regardless, and the unresolvable
ambient type broke `tsc` outright.

---

## Deployment

The app is a standard Next.js 16 application. `npm run build` produces the
production build and `npm start` serves it; any host that runs a Next.js app
works, and no external resource needs provisioning for the app to function.

Before shipping, set `NEXT_PUBLIC_SITE_URL` on any non-production deployment so
previews do not emit canonical tags and Open Graph URLs pointing at
`https://repair-or-replace.com`.

For how the pieces fit together — the Route Handler request path, the layering
of the calculation core, and what is roadmap rather than built — see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Trust, safety & disclaimers

- **Estimates only.** RepairOrReplace produces an economic estimate, not a
  technical diagnosis or a safety certification. It does not replace a licensed
  professional's inspection.
- **Safety first.** For gas, high-voltage, and refrigerant work the app suppresses
  DIY guidance by design and routes the user to a licensed professional.
  Refrigerant work legally requires EPA Section 608 certification.
- **Neutral by construction.** The verdict is computed before, and independently
  of, any monetization. Affiliate and lead-gen placements are rendered in a
  physically separate block and always carry an FTC-compliant disclosure; the
  result screen never runs display ads.
- **No lead-capture wall.** The core calculator is usable anonymously — no
  accounts, no tracking of a user across requests, and nothing persisted to
  disk or to any database. What you enter is used to compute the response and
  then discarded. The single exception is the rate-limit counter described
  under [`POST /api/calculate`](#post-apicalculate): when
  `TRUST_PROXY_HEADER=1`, a client IP and the timestamps of its last few
  requests sit in one server instance's memory until they age out of a
  60-second window. No input, result, or identifier is recorded anywhere else.
- **Recall data is advisory.** Recall lookups are best-effort and never block the
  economic verdict.

---

## Roadmap

Everything below is **unbuilt**. There is no schema, no persistence layer, and
no partial implementation for any of it — these are intentions, listed so the
shape of the product is legible, not work in progress.

- **Result sharing.** `POST /api/report` returns `503` and the `/r` viewer has
  nothing to read. Needs a persistence choice and an implementation behind that
  one route.
- **Accounts & inventory.** Registered users, a saved household appliance
  inventory (the "digital home hardware" log), and proactive maintenance alerts.
  Requires a database that the app does not currently have.
- **Landlord & pro tiers.** Multi-unit tooling for property managers, a
  technician surface (`/for-technicians` exists as an editorial page today),
  lead-gen for vetted local pros, and generated PDF reports.

Because the calculation core is pure and framework-free, each of these can be
built on top of it without touching the decision logic.

---

## License

MIT.
