# Deployment

Step-by-step guide to deploying RepairOrReplace to Cloudflare. The app is a
single Worker that serves the static frontend and the `/api/*` compute layer, and
uses D1, KV, and R2. This guide covers provisioning those resources, wiring their
IDs into `wrangler.jsonc`, applying migrations, running locally, deploying to
production, and the scheduled cron.

For the architecture behind these pieces, see
[`ARCHITECTURE.md`](ARCHITECTURE.md). For the API and algorithms, see
[`../README.md`](../README.md).

---

## Prerequisites

- Node.js 18+ and npm
- A Cloudflare account
- Wrangler (installed as a dev dependency — run it with `npx wrangler ...` or via
  the npm scripts)

Install dependencies and authenticate:

```bash
npm install
npx wrangler login
```

Sanity-check the code before deploying anything:

```bash
npm run typecheck
npm run test
```

---

## 1. Create the D1 database

```bash
npx wrangler d1 create repair_or_replace
```

Wrangler prints a `database_id`. Paste it into the `d1_databases` block in
`wrangler.jsonc`, replacing the placeholder:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "repair_or_replace",
    "database_id": "PASTE-THE-REAL-ID-HERE",   // was 00000000-0000-0000-0000-000000000000
    "migrations_dir": "migrations"
  }
]
```

The `binding` (`DB`), `database_name` (`repair_or_replace`), and `migrations_dir`
(`migrations`) must stay as-is — the Worker and the migration scripts reference
them by name.

---

## 2. Create the KV namespace

KV backs the recall cache and saved reports (`CACHE` binding).

```bash
npx wrangler kv namespace create CACHE
```

Copy the printed `id` into the `kv_namespaces` block in `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  { "binding": "CACHE", "id": "PASTE-THE-REAL-KV-ID-HERE" }
]
```

---

## 3. Create the R2 bucket

R2 (`REPORTS` binding) is reserved for generated PDF reports. Create the bucket
so the binding resolves in production:

```bash
npx wrangler r2 bucket create repair-or-replace-reports
```

The bucket name must match `bucket_name` in the `r2_buckets` block. Unlike D1 and
KV, R2 buckets are referenced by name, so there is no ID to paste.

---

## 4. Apply migrations

Migrations live in `migrations/` (`0001_init.sql`, `0002_seed_reference.sql`) and
are applied by name.

**Local** (Miniflare's local D1, for `wrangler dev`):

```bash
npm run db:migrate:local     # wrangler d1 migrations apply repair_or_replace --local
```

**Remote** (the real D1 database created in step 1):

```bash
npm run db:migrate:remote    # wrangler d1 migrations apply repair_or_replace --remote
```

Verify the remote schema and seed:

```bash
npx wrangler d1 execute repair_or_replace --remote \
  --command "SELECT metro_slug, multiplier FROM labor_rates LIMIT 5;"
```

---

## 5. Run locally

```bash
npm run dev        # wrangler dev
```

Wrangler serves the Worker and the static assets from `public/` together
(default `http://localhost:8787`). Smoke-test the API:

```bash
# Health
curl http://localhost:8787/api/health

# Catalog
curl http://localhost:8787/api/catalog

# A calculation
curl -X POST http://localhost:8787/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"category":"dishwasher","brandTier":"budget","ageYears":9,"faultComponent":"control_board","repairQuote":380,"location":{"metro":"los-angeles","state":"CA"}}'
```

`wrangler dev` runs the cron `scheduled` handler on a schedule only in specific
modes; you can trigger it manually for testing:

```bash
curl "http://localhost:8787/__scheduled?cron=15+3+*+*+*"
```

### Local vars and secrets

Non-secret vars (`DISCOUNT_RATE`, `CPSC_API_BASE`) are defined in the `vars`
block of `wrangler.jsonc` and apply to both local and remote. For local-only
overrides or any secrets, use a `.dev.vars` file (already git-ignored):

```ini
# .dev.vars  (local only, do not commit)
DISCOUNT_RATE=0.05
CPSC_API_BASE=https://www.saferproducts.gov/RestWebServices/Recall
```

---

## 6. Deploy to production

```bash
npm run deploy     # wrangler deploy
```

This uploads the Worker (`src/worker/index.ts`), publishes the `public/` assets
via the `ASSETS` binding, and registers the cron trigger. Verify:

```bash
curl https://<your-worker-subdomain>.workers.dev/api/health
```

---

## 7. Cron / scheduled ingestion

The daily recall-ingestion cron is declared in `wrangler.jsonc` and is registered
automatically on `wrangler deploy` — there is no separate command:

```jsonc
"triggers": {
  "crons": ["15 3 * * *"]     // 03:15 UTC daily
}
```

On each firing, the Worker's `scheduled` handler runs `ingestRecentRecalls`,
which pulls recent CPSC recalls and warms the KV cache (`recall:recent`,
`recall:lastIngest`). It is best-effort and never throws. Confirm the trigger is
live in the Cloudflare dashboard (Workers → your Worker → **Triggers → Cron
Triggers**), or check the ingest marker after it has run:

```bash
npx wrangler kv key get "recall:lastIngest" --binding CACHE --remote
```

---

## 8. Configuration variables

Set in the `vars` block of `wrangler.jsonc`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DISCOUNT_RATE` | `0.05` | Macro discount rate (opportunity cost of capital) used by the NPC model. Parsed by the Worker; falls back to the core default (5%) if unparseable. |
| `CPSC_API_BASE` | `https://www.saferproducts.gov/RestWebServices/Recall` | Base URL for the CPSC SaferProducts.gov Recall API. Point this at a mock or proxy for testing. |

To change these in production without editing the file, use per-environment vars
or `wrangler secret put` (for anything sensitive). `CPSC_API_BASE` is a plain
`var`, not a secret, because it is a public endpoint; overriding it is useful when
you need to stub the recall API in a staging environment.

---

## Troubleshooting

**`wrangler dev` errors about a missing binding / namespace.**
Confirm every binding in `wrangler.jsonc` has a real ID: `DB.database_id`,
`CACHE.id`, and the R2 bucket exist. The committed placeholders
(`00000000-...`, `0000...`) must be replaced before remote use.

**Calculations work but recall lookups always return `unavailable`.**
That is the intended graceful-degradation path when the CPSC API is unreachable,
times out (5s), or returns a non-OK status — the economic verdict is unaffected.
Check `CPSC_API_BASE`, network egress, and that the UPC is well-formed. Remember
that only definitive results are cached, so transient failures retry.

**`404` on a page that should exist.**
Non-`/api` paths are served from `public/`. If a page 404s, confirm the file
exists in `public/` and that `not_found_handling` / `html_handling` in
`wrangler.jsonc` match your routing expectations (`auto-trailing-slash`). API
`404`s (`{"error":"Not found."}`) mean the path/method pair isn't a registered
route.

**`400` from `POST /api/calculate`.**
The validator requires a known `category` and a non-negative numeric
`repairQuote`; `ageYears`, if sent, must be a non-negative number. The response
body's `error` field states which check failed. A malformed JSON body returns
`{"error":"Invalid JSON body."}`.

**D1 migration says "no such table" at runtime.**
Migrations must be applied to the environment you are hitting — run
`npm run db:migrate:local` for `wrangler dev` and `npm run db:migrate:remote`
before/after a production deploy. Note that the MVP calculation path does not read
from D1, so a missing table will not break `/api/calculate`; it affects only the
Phase 2 account/inventory features and the D1-backed labor grid.

**Cron never seems to run.**
Cron triggers only fire on the deployed Worker, not in ordinary `wrangler dev`.
Deploy first, then verify under **Triggers → Cron Triggers** in the dashboard, or
invoke the scheduled handler locally via the `/__scheduled?cron=...` test URL.

**Reports return `404` right after saving.**
Saved reports are stored in KV with a 30-day TTL. A `404` from
`GET /api/report?id=` means the id is wrong or the entry has expired. Confirm you
are querying the same environment (local vs. remote KV are separate stores).

**Changed a `var` but the Worker still uses the old value.**
`vars` are applied at deploy time. Re-run `npm run deploy` after editing
`wrangler.jsonc`, and restart `wrangler dev` for local changes.
