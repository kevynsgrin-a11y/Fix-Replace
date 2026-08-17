/**
 * Client-facing catalog contract. This is the shape the intake form consumes
 * from GET /api/catalog. Keep it a clean, minimal subset — the server maps the
 * richer domain engine (src/core/catalog) down to exactly this.
 */

export interface CatalogComponent {
  id: string
  label: string
}

export interface CatalogCategory {
  id: string
  label: string
  components: CatalogComponent[]
  fuelDependent: boolean
  defaultFuel: "gas" | "electric"
}

export interface CatalogTier {
  id: string
  label: string
}

export interface CatalogMetro {
  slug: string
  name: string
}

export interface Catalog {
  categories: CatalogCategory[]
  tiers: CatalogTier[]
  metros: CatalogMetro[]
}

export async function fetchCatalog(url: string): Promise<Catalog> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Catalog request failed: ${res.status}`)
  }
  return res.json() as Promise<Catalog>
}
