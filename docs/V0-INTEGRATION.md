# Wiring the v0 front end to this calculation engine

The v0 build owns the look. This Worker owns the math. Nothing here changes a
pixel of the front end — it swaps whatever currently computes the verdict for a
call to an audited engine.

Why bother: this engine carries 129 tests, a verified Weibull/net-present-cost
model, safety hard-stops that suppress DIY parts links on gas, high-voltage and
refrigerant work, and a rule that refuses to give a verdict at all when a quote
looks predatory. Those behaviours are the product's whole claim to
trustworthiness, and they only apply if the front end actually calls this.

> The v0 source is **not** in this repo — all 23 commits here are the engine and
> its own static site. Make these edits wherever the v0 project lives.

---

## 1. The endpoint

```
POST https://repair-or-replace.kevynsgrin.workers.dev/api/calculate
Content-Type: application/json
```

That host is live as of the first successful deploy (2026-08-06). Once the
engine is proven in place you can move it to `api.repair-or-replace.net` and
leave the apex + www exactly where they are — the front end only needs its base
URL changed.

CORS is already configured for `https://repair-or-replace.net`,
`https://www.repair-or-replace.net` and `http://localhost:3000`. Any other host
(a Vercel preview URL, say) must be added to `ALLOWED_ORIGINS` in
`wrangler.jsonc` or the browser will block the call.

## 2. Request

Only `category`, `brandTier`, `ageYears` and `repairQuote` are required.

```jsonc
{
  "category": "dishwasher",      // see /api/catalog for the full list
  "brandTier": "budget",         // "budget" | "mid" | "premium"
  "ageYears": 9,
  "repairQuote": 380,            // the technician's quote, USD

  "faultComponent": "control_board", // optional; raises confidence
  "location": { "metro": "los-angeles", "state": "CA" }, // or { "zip": "90210" }
  "fuelType": "gas",             // only for fuel-dependent categories
  "underWarranty": false,
  "energyStarReplacement": true,
  "newUnitPrice": 800,           // optional override
  "upc": "012345678905"          // optional federal recall check
}
```

`GET /api/catalog` returns every category, its brand tiers with lifespan bands
and typical prices, its valid `faultComponent` values, and the metro list — so
the form can be built from the API instead of hardcoding option lists that can
drift out of sync with the engine.

## 3. Response

```jsonc
{
  "verdict": "replace",            // "repair" | "replace" | "uncertain"
  "verdictHeadline": "Replace it.",
  "verdictExplanation": "Over a 10.5 year horizon, replacing costs …",
  "gaugePosition": 82,             // 0 = repair … 100 = replace, or null

  "npc": {
    "horizonYears": 10.5,
    "repair": 1914.22,             // present cost of repairing and keeping
    "replace": 1356.03,            // present cost of replacing now
    "advantageOfReplacing": 558.19,
    "breakEvenMonths": 27,         // null when replacing never pays back
    "repairBreakdown":  { "upfront": 0, "energyPresentValue": 0, "salvageCredit": 0, "riskAdjustment": 0 },
    "replaceBreakdown": { "upfront": 0, "energyPresentValue": 0, "salvageCredit": 0, "riskAdjustment": 0 }
  },

  "rul": { "medianRemainingYears": 1.0, "survival12Months": 0.42, "survival24Months": 0.18, "survival36Months": 0.06 },
  "repairCost": { "quote": 380, "expected": 500.4, "repeatFailureProbability": 0.44 },
  "energy": { "annualOldCost": 59, "annualNewCost": 43, "annualSavings": 16, "localized": true },
  "confidence": { "score": 90, "level": "high", "suppressed": false, "factors": [], "warnings": [] },
  "safety": { "professionalRequired": true, "diySuppressed": true, "hazards": ["gas"], "messages": ["…"] },
  "recall": { "status": "clear", "matches": [] },
  "monetization": { "affiliateLinks": [], "leadGen": [], "showDisplayAds": false, "disclosure": "…" },
  "provenance": [{ "label": "…", "source": "…" }]
}
```

## 4. The three behaviours that must survive the redesign

Style these however the v0 design system likes — but do not drop them. They are
the difference between a calculator and a liability.

**A verdict can be withheld.** When `confidence.suppressed` is true, `verdict`
is `"uncertain"` and `gaugePosition` is `null`. Do not render a gauge, and do
not coerce the null to `0` — that would silently display "strongly repair".
Show `confidence.warnings` instead; this is the predatory-quote refusal.

```jsx
{result.verdict === 'uncertain'
  ? <SecondOpinionNotice warnings={result.confidence.warnings} />
  : <Gauge value={result.gaugePosition} />}
```

**Safety suppresses commerce.** When `safety.diySuppressed` is true, render no
DIY parts links. When `safety.professionalRequired` is true, show
`safety.messages` prominently. The engine already withholds part links from
`monetization.affiliateLinks` in these cases, so rendering that array as-is is
safe — the failure mode is a front end that adds its own hardcoded parts links.

**Partner links stay separated from the verdict.** Render
`monetization.disclosure` wherever `affiliateLinks` or `leadGen` appear (FTC),
and keep that block visually distinct from and below the analysis.

## 5. Minimal client

```ts
// .env.local
//   NEXT_PUBLIC_CALC_API=https://repair-or-replace.kevynsgrin.workers.dev
const CALC_API = process.env.NEXT_PUBLIC_CALC_API;

export async function getVerdict(input: CalculationInput): Promise<CalculationResult> {
  const res = await fetch(`${CALC_API}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    // 400 = invalid input (message in .error), 413 = body too large,
    // 5xx = engine trouble. Never fabricate a verdict on failure — show an
    // error, because a wrong number here is a real financial decision.
    const { error } = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error);
  }
  return res.json();
}
```

Calling it from a Next.js **route handler** rather than the browser also works
and sidesteps CORS entirely — the request is then server-to-server.

## 6. Known issues in the current live front end

Found during browser QA of the deployed v0 app. All three are in the front end,
not the engine:

1. **Verdict headline overflows its card**, forcing a horizontal scrollbar on
   the whole page. Fix on the headline element:
   ```css
   .verdict-headline { overflow-wrap: anywhere; text-wrap: balance; max-width: 100%; }
   ```
   Worth also setting `overflow-x: hidden` on `body` as a backstop.
2. **`/api/health` 404s.** Expected — the engine wasn't deployed. Resolves once
   the front end points at the Worker.
3. **`/guides/refrigerator` 404s.** The appliance cost guides only exist in this
   repo's static site. Either port them into the v0 app, or serve them from the
   Worker on a subpath. They are the entire organic-search strategy, so losing
   them silently is a real cost.
