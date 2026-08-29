/**
 * /og?title=...&description=...&type=guide|metro|home|editorial
 *
 * Generates a 1200×630 Open Graph card unique to each page.
 * Uses Next.js ImageResponse (built on @vercel/og / Satori).
 */
import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"
import { SITE_HOST } from "@/lib/site"

export const runtime = "edge"

const BRAND = "#2563eb" // --color-brand in light mode
const INK = "#080c14"
const SURFACE = "#f6f7f9"
const MUTED = "#6b7280"

type CardType = "guide" | "metro" | "home" | "editorial" | "result"

function badge(type: CardType): string {
  switch (type) {
    case "guide": return "Cost Guide"
    case "metro": return "Local Repair Costs"
    case "result": return "Your Verdict"
    case "editorial": return "RepairOrReplace"
    default: return "RepairOrReplace"
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get("title") ?? "Repair it or replace it? Get a straight answer."
  const description = searchParams.get("description") ?? "Net-present-cost math on real data — no guesswork, no lead-capture wall."
  const type = (searchParams.get("type") ?? "home") as CardType

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: SURFACE,
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: BRAND,
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 32,
          }}
        >
          {/* Logo mark */}
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path
              d="M4 28 C4 28, 8 4, 16 4 C24 4, 28 28, 28 28"
              stroke={BRAND}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <line x1="16" y1="4" x2="16" y2="28" stroke={BRAND} strokeWidth="1.5" strokeDasharray="2 3" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: BRAND, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {badge(type)}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 55 ? 44 : 56,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            maxWidth: 900,
            flex: 1,
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 22,
            color: MUTED,
            lineHeight: 1.5,
            maxWidth: 740,
            marginBottom: 40,
          }}
        >
          {description.length > 120 ? description.slice(0, 120) + "…" : description}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid #e2e5ea`,
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 600, color: INK }}>
            {SITE_HOST}
          </span>
          <span style={{ fontSize: 15, color: MUTED }}>
            Free · No sign-up · No ads on your result
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
