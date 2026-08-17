import { NextResponse } from "next/server"
import { getCatalog } from "@/src/core/catalog"
import type { Catalog } from "@/lib/catalog"

/**
 * GET /api/catalog
 *
 * Single source of truth for the intake form. We reuse the framework-agnostic
 * decision engine (src/core/catalog) and project its richer output down to the
 * lean client contract in lib/catalog.ts, so the domain lives in exactly one
 * place and the client ships no duplicated data.
 */
export function GET() {
  const engine = getCatalog()

  const payload: Catalog = {
    categories: engine.categories.map((c) => ({
      id: c.id,
      label: c.label,
      fuelDependent: c.fuelDependent,
      defaultFuel: c.defaultFuel,
      components: c.components.map((comp) => ({
        id: comp.id,
        label: comp.label,
      })),
    })),
    tiers: engine.tiers.map((t) => ({ id: t.id, label: t.label })),
    metros: engine.metros.map((m) => ({ slug: m.slug, name: m.name })),
  }

  return NextResponse.json(payload, {
    headers: {
      // Catalog is static domain data; allow long CDN caching.
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  })
}
