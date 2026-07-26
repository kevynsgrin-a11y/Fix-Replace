# RepairOrReplace

**RepairOrReplace** is a Cloudflare-native, serverless web app that answers a
deceptively hard household question: when a major appliance breaks, is it
economically rational to pay for the repair, or to replace the unit? Instead of
the usual folk heuristics ("if the repair costs more than half of a new one,
replace it"), it runs a transparent financial model — a Weibull reliability
estimate of remaining useful life, a risk-adjusted expected repair cost, a
localized energy sub-model, and an equivalent-service Net Present Cost
comparison — then returns a plain-English verdict with every number sourced and
shown. It refuses to fake precision: vague inputs lower a confidence score, and
predatory quotes suppress the verdict entirely in favor of "get a second
opinion."

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
  KV-cached and refreshed by a daily cron; never blocks the economic result.
- **Neutral monetization** — affiliate and lead-gen placements are computed
  *after* and *separately from* the verdict, and always carry an FTC disclosure.
- **Full provenance** — every user-facing figure is labeled with its source
  (NAHB, InterNACHI, BLS, EIA, CPSC).
- **Shareable reports** — a calculation can be saved and retrieved via a short
  link.
- **Themeable, build-free frontend** — a vanilla-JS client on a tokenized design
  system with light/dark support and no client build step.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Runtime | Cloudflare Workers (single Worker, `workerd`) |
| Static hosting | Cloudflare Workers Static Assets (`ASSETS` binding) |
| Database | Cloudflare D1 (serverless SQLite) — `DB` binding |
| Cache | Cloudflare KV — `CACHE` binding |
| Object storage | Cloudflare R2 — `REPORTS` binding |
| Language | TypeScript (ES2022, strict) |
| Tests | Vitest (node environment) |
| Frontend | Vanilla JS + CSS custom properties — **no client build step** |
| Tooling | Wrangler |

The calculation core is written once, as pure TypeScript, and runs identically
in Node (unit tests) and in `workerd` (production). There is no bundler for the
browser client: the static assets are shipped as authored.

---

## Project structure

```text
Fix-Replace/
├── package.json              # scripts, deps (wrangler, vitest, typescript)
├── wrangler.jsonc            # Worker config: bindings, cron, vars
├── tsconfig.json             # strict TS, Workers types
├── vitest.config.ts          # node test environment
├── migrations/               # D1 schema + seed (SQLite)
│   ├── 0001_init.sql         #   users, appliances, alerts, calculations, labor grid
│   └── 0002_seed_reference.sql  #  labor_rates + zip_metro seed data
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
│   ├── recalls/
│   │   └── cpsc.ts           # CPSC SaferProducts.gov client + KV cache + ingest
│   └── worker/
│       └── index.ts          # the Worker: /api routing, ASSETS fallthrough, cron
├── public/                   # static frontend (served via ASSETS, no build)
│   ├── styles/
│   │   ├── tokens.css        #   design tokens (color, type, space, motion)
│   │   └── base.css          #   reset, layout primitives, component library
│   └── scripts/
│       └── chrome.js         #   shared header/footer + theme toggle
└── test/
    └── smoke.test.ts         # end-to-end decision-engine smoke tests
```

> **Note on `public/`:** the design system (`tokens.css`, `base.css`,
> `chrome.js`) is the shared foundation; the page templates (calculator,
> `/how-it-works`, cost guides, `/about`, methodology, `/for-pros`) are authored
> as static HTML on top of it and are being built out in parallel. Any request
> that is not under `/api/` is served straight from `public/`.

---

## Getting started

### Prerequisites

- Node.js 18+ and npm
- A Cloudflare account (only required for remote deploys and remote D1/KV/R2)

### Install

```bash
npm install
```

### Test and typecheck

```bash
npm run test        # vitest run — decision-engine smoke tests
npm run typecheck   # tsc --noEmit — strict type checking
```

### Local database (D1)

The Worker declares a D1 binding (`DB`) with the migrations in `migrations/`.
Apply them to the local (Miniflare) database before running `dev`:

```bash
npm run db:migrate:local     # wrangler d1 migrations apply repair_or_replace --local
```

To apply the same migrations to the remote database once it exists:

```bash
npm run db:migrate:remote    # wrangler d1 migrations apply repair_or_replace --remote
```

### Run the dev server

```bash
npm run dev         # wrangler dev
```

Wrangler serves the Worker and the static assets together at
`http://localhost:8787`. `/api/*` routes hit the compute layer; everything else
is served from `public/`.

> Full Cloudflare provisioning (creating the D1 database, KV namespace, and R2
> bucket, and pasting their IDs into `wrangler.jsonc`) is covered in
> [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## API reference

All endpoints live under `/api/`. Responses are JSON and carry a small set of
security headers (`X-Content-Type-Options`, `Referrer-Policy`,
`X-Frame-Options`). Any non-`/api` path falls through to the static asset store.

### `GET /api/health`

Liveness probe.

```json
{ "ok": true, "service": "repair-or-replace" }
```

### `GET /api/catalog`

Returns the data the frontend needs to build the intake form dynamically —
categories with tiers (price + lifespan band), a per-category symptom picker, and
the metro list. Cached for one hour (`Cache-Control: public, max-age=3600`).

```json
{
  "categories": [
    {
      "id": "dishwasher",
      "label": "Dishwasher",
      "fuelDependent": false,
      "defaultFuel": "electric",
      "tiers": [
        { "id": "budget", "label": "Budget / entry", "newPrice": 450, "lifespan": { "low": 6, "high": 9 } },
        { "id": "mid", "label": "Mid-range", "newPrice": 800, "lifespan": { "low": 9, "high": 12 } },
        { "id": "premium", "label": "Premium / luxury", "newPrice": 1500, "lifespan": { "low": 15, "high": 20 } }
      ],
      "components": [
        { "id": "drain_pump", "label": "Drain pump", "diyFriendly": true, "hazards": ["water"], "costLow": 150, "costHigh": 320 }
      ]
    }
  ],
  "tiers": [
    { "id": "budget", "label": "Budget / entry" },
    { "id": "mid", "label": "Mid-range" },
    { "id": "premium", "label": "Premium / luxury" }
  ],
  "metros": [
    { "slug": "los-angeles", "name": "Los Angeles, CA", "state": "CA" }
  ]
}
```

### `POST /api/calculate`

The core endpoint. Accepts a `CalculationInput` and returns a full
`CalculationResult`.

**Validation:** the body must be a JSON object with a valid `category` and a
non-negative numeric `repairQuote`. `ageYears`, if present, must be a
non-negative number. Everything else is optional and defaulted.

**Request** (`CalculationInput`):

```json
{
  "category": "dishwasher",
  "brandTier": "budget",
  "ageYears": 9,
  "faultComponent": "control_board",
  "repairQuote": 380,
  "location": { "metro": "los-angeles", "state": "CA" },
  "fuelType": "electric",
  "underWarranty": false,
  "newUnitPrice": 450,
  "energyStarReplacement": true,
  "upc": "012345678905"
}
```

Only `category` and `repairQuote` are required. `faultComponent` accepts a
component id from the catalog (e.g. `drain_pump`, `control_board`, `gas_valve`);
an unknown or omitted component lowers confidence rather than blocking a result.
`upc` triggers an optional recall lookup.

**Response** (`CalculationResult`, values below are representative and rounded —
the live engine computes them):

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
      { "kind": "new_unit", "label": "Shop Dishwasher — The Home Depot", "merchant": "The Home Depot", "url": "https://www.homedepot.com/s/budget%20Dishwasher" }
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
  ],
  "resolvedInput": {
    "category": "dishwasher",
    "brandTier": "budget",
    "ageYears": 9,
    "faultComponent": "control_board",
    "repairQuote": 380,
    "fuelType": "electric",
    "underWarranty": false,
    "newUnitPrice": 450,
    "energyStarReplacement": true,
    "metro": "los-angeles",
    "state": "CA"
  }
}
```

When the confidence logic suppresses the verdict (e.g. a predatory quote),
`verdict` is `"uncertain"` and `gaugePosition` is `null`.

Invalid input returns `400` with `{ "error": "..." }`; an unexpected server error
returns `500`.

### `GET /api/recalls?upc=<upc>`

Standalone federal recall lookup by UPC, backed by the KV cache and the CPSC API.
Returns a `RecallResult`:

```json
{ "status": "clear", "matches": [], "note": "No open federal recall found for this UPC." }
```

`status` is one of `clear`, `active`, or `unavailable`. A missing `upc` returns
`400`. Recall-data outages degrade to `unavailable` and never surface an error to
the user.

### `POST /api/report` and `GET /api/report?id=<id>`

Save and retrieve a calculation for sharing.

- `POST /api/report` stores the posted JSON body and returns
  `{ "id": "<uuid>", "url": "/r?id=<uuid>" }` with status `201`. Saved reports
  currently live in KV with a 30-day TTL.
- `GET /api/report?id=<id>` returns the stored JSON, or `404` if it is missing or
  expired.

---

## Algorithms

All formulas below live in `src/core/` and are covered by `test/smoke.test.ts`.

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

The reference data in `src/data/` (and the seed in `migrations/`) is **seeded and
representative** — anchored to published figures but intended as a defensible
baseline, not a live feed. Every user-facing number is labeled with its source in
the `provenance` array. Swap in live data at these seams:

| Domain | File(s) | Source | How to make it live |
| --- | --- | --- | --- |
| Appliance lifespans (by tier) | `data/lifespans.ts` | NAHB Study of Life Expectancy of Home Components; InterNACHI Estimated Life Expectancy Chart | Refresh bands from the source charts; keep the `[low, high]` IQR convention. |
| Labor rates | `data/laborRates.ts`, `migrations/0002_seed_reference.sql` | BLS OEWS occupation **49-9031** (Home Appliance Repairers), May 2024 | Replace the in-code metro/ZIP/state tables with the full crosswalk in D1 (`labor_rates`, `zip_metro`). |
| Energy rates | `data/energyRates.ts` | EIA residential electricity & natural gas rates | Pull EIA rate series per state on a schedule; cache in KV. |
| Component costs & hazards | `data/partCosts.ts` | Strategy-brief cost bands; industry norms | Calibrate bands against the anonymized `calculations` log. |
| Removal / disposal | `data/ancillary.ts` | National appliance-removal cost survey ($109–$244 typical) | Regionalize disposal like labor. |
| Safety recalls | `recalls/cpsc.ts` | **CPSC** SaferProducts.gov Recall API | Already live: fetched on demand, KV-cached, and warmed by the daily cron. |

The default macro discount rate is `5%` (`DISCOUNT_RATE` in `wrangler.jsonc`).

---

## Deployment

Local development runs entirely under `wrangler dev`. Provisioning the Cloudflare
resources (D1 database, KV namespace, R2 bucket), applying migrations remotely,
setting the cron, and running `wrangler deploy` are documented step by step in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). The architecture — request lifecycle,
core library layering, the D1 schema, and the caching/cron design — is in
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
- **No lead-capture wall.** The core calculator is usable anonymously; the MVP
  writes no user rows.
- **Recall data is advisory.** Recall lookups are best-effort and never block the
  economic verdict.

---

## Roadmap

Drawn from the phase markers in the code and migrations:

- **MVP (current):** anonymous, single-shot calculator. The full decision engine,
  catalog, recall lookup, and shareable reports work without an account.
- **Phase 2 — accounts & inventory:** registered users (`users`), a saved
  household appliance inventory (`appliances`, the "digital home hardware" log),
  and proactive maintenance alerts (`maintenance_alerts`). Schema is already in
  `migrations/0001_init.sql`.
- **Phase 3 — landlord & pro tiers:** the `pro` plan, tools for property managers
  with multiple units, a technician surface (`/for-pros`), lead-gen for vetted
  local pros, and generated PDF reports (the professional tier, backed by the R2
  `REPORTS` bucket).

---

## License

MIT.

## Front-end tooling

The site ships as hand-written HTML with no build step, so three small scripts
keep 26 pages honest. Run them before shipping:

| Command | What it does |
| --- | --- |
| `npm run chrome` | Stamps the canonical header, drawer, skip link and footer (`tools/site-chrome.mjs`) into every page under `public/`. Idempotent. |
| `npm run chrome:check` | Fails if any page's chrome has drifted from the template. |
| `npm run check:pages` | Asserts meta/title lengths, unique per-page social cards, favicon + manifest links, keyboard-reachable tables, heading order, valid JSON-LD and no dead internal links. |
| `npm run social` | Re-renders `public/social/og-*.png` from `tools/social-card-template.html` and refreshes `public/og.png`. |
| `npm run icons` | Re-renders the favicon/app-icon set. |

**The site chrome is static, not injected.** It is the entire internal link
graph and it owns the page landmarks, so it has to be in the served HTML —
editing a header link means editing `tools/site-chrome.mjs` and re-running
`npm run chrome`, never editing one page's markup by hand.
