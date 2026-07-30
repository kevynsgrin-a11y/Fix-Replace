/**
 * ApplianceGlyph — line-art SVG system.
 * One stroke weight (1.5 px at default), rounded caps/joins, brand accent ticks,
 * registration-bracket corners. All colors from CSS custom properties so they
 * theme correctly in dark mode.
 *
 * Every glyph is distinguishable at its smallest rendered size (26 px):
 *   - Dryer: exhaust duct breaks the outline at bottom-right
 *   - Washer: detergent drawer notch at top-left
 *   - Refrigerator: taller box with a bisecting shelf line
 *   - Dishwasher: pull-handle bar at bottom, spray-arm cross inside
 *   - Range: four burner dots + left-side knob row
 *   - Oven: inner shelf lines + viewport window
 *   - Microwave: wide box, door seam, vent slots on right
 *   - Water heater: tall cylinder with two pipe stubs top + bottom
 *   - HVAC: wider unit, three horizontal vent slots, outdoor coil fins
 */

import * as React from "react"
import type { ApplianceCategory } from "@/src/core/types"

interface GlyphProps {
  size?: number
  className?: string
  "aria-hidden"?: boolean | "true" | "false"
}

/** Shared SVG wrapper with common stroke defaults */
function G({
  size = 32,
  className,
  children,
  "aria-hidden": ariaHidden = true,
}: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={ariaHidden}
    >
      {children}
    </svg>
  )
}

/* ── Individual glyphs ──────────────────────────────────────────────── */

export function RefrigeratorGlyph(props: GlyphProps) {
  return (
    <G {...props}>
      {/* Cabinet — tall box with registration-bracket corners */}
      <rect x="6" y="3" width="20" height="26" rx="2" />
      {/* Shelf divider separating fridge/freezer compartments */}
      <line x1="6" y1="12" x2="26" y2="12" />
      {/* Door handle — fridge */}
      <line x1="22" y1="15" x2="22" y2="20" strokeWidth="2" stroke="var(--color-brand)" />
      {/* Door handle — freezer */}
      <line x1="22" y1="6" x2="22" y2="9" strokeWidth="2" stroke="var(--color-brand)" />
      {/* Registration-bracket tick — top-left */}
      <path d="M6 5 L6 3 L8 3" strokeWidth="1" stroke="var(--color-brand)" />
    </G>
  )
}

export function WasherGlyph(props: GlyphProps) {
  return (
    <G {...props}>
      {/* Cabinet */}
      <rect x="4" y="4" width="24" height="24" rx="2" />
      {/* Detergent drawer — distinctive notch top-left */}
      <rect x="5" y="5" width="8" height="4" rx="1" strokeWidth="1" stroke="var(--color-brand)" />
      {/* Door porthole */}
      <circle cx="16" cy="18" r="6" />
      {/* Inner drum suggestion */}
      <circle cx="16" cy="18" r="3" strokeWidth="1" stroke="var(--color-brand)" />
      {/* Control panel top-right dot row */}
      <circle cx="21" cy="7" r="1" fill="var(--color-brand)" stroke="none" />
      <circle cx="24" cy="7" r="1" fill="var(--color-brand)" stroke="none" />
    </G>
  )
}

export function DryerGlyph(props: GlyphProps) {
  return (
    <G {...props}>
      {/* Cabinet */}
      <rect x="4" y="4" width="24" height="24" rx="2" />
      {/* Exhaust duct — breaks outline bottom-right, unique identifier */}
      <path d="M24 28 L24 32 L28 32" strokeWidth="1.5" stroke="var(--color-brand)" />
      {/* Door porthole */}
      <circle cx="16" cy="17" r="6" />
      {/* Drum chevron */}
      <path d="M13 15 L16 20 L19 15" strokeWidth="1" stroke="var(--color-brand)" />
      {/* Control dot */}
      <circle cx="23" cy="8" r="1.5" fill="var(--color-brand)" stroke="none" />
    </G>
  )
}

export function DishwasherGlyph(props: GlyphProps) {
  return (
    <G {...props}>
      {/* Cabinet */}
      <rect x="5" y="3" width="22" height="26" rx="2" />
      {/* Pull-handle bar at bottom — distinctive identifier */}
      <line x1="9" y1="26" x2="23" y2="26" strokeWidth="2" stroke="var(--color-brand)" />
      {/* Door seam */}
      <line x1="5" y1="20" x2="27" y2="20" />
      {/* Spray arm cross inside */}
      <line x1="16" y1="8" x2="16" y2="18" strokeWidth="1" stroke="var(--color-brand)" />
      <line x1="9" y1="13" x2="23" y2="13" strokeWidth="1" stroke="var(--color-brand)" />
      {/* Control panel dots */}
      <circle cx="12" cy="23" r="1" fill="var(--color-brand)" stroke="none" />
      <circle cx="16" cy="23" r="1" fill="var(--color-brand)" stroke="none" />
      <circle cx="20" cy="23" r="1" fill="var(--color-brand)" stroke="none" />
    </G>
  )
}

export function RangeGlyph(props: GlyphProps) {
  return (
    <G {...props}>
      {/* Cabinet */}
      <rect x="3" y="5" width="26" height="24" rx="2" />
      {/* Backsplash/control panel at top */}
      <rect x="3" y="2" width="26" height="5" rx="1" />
      {/* Oven door window */}
      <rect x="7" y="17" width="18" height="9" rx="1" />
      {/* Four burner circles — distinctive */}
      <circle cx="11" cy="12" r="2.5" />
      <circle cx="21" cy="12" r="2.5" />
      {/* Knob row — left side of backsplash */}
      <circle cx="8" cy="4.5" r="1" fill="var(--color-brand)" stroke="none" />
      <circle cx="12" cy="4.5" r="1" fill="var(--color-brand)" stroke="none" />
      <circle cx="20" cy="4.5" r="1" fill="var(--color-brand)" stroke="none" />
      <circle cx="24" cy="4.5" r="1" fill="var(--color-brand)" stroke="none" />
    </G>
  )
}

export function WallOvenGlyph(props: GlyphProps) {
  return (
    <G {...props}>
      {/* Outer cabinet — tall, wall-mounted */}
      <rect x="4" y="2" width="24" height="28" rx="2" />
      {/* Oven door */}
      <rect x="6" y="8" width="20" height="18" rx="1" />
      {/* Door viewport window */}
      <rect x="9" y="11" width="14" height="9" rx="1" strokeWidth="1" stroke="var(--color-brand)" />
      {/* Interior shelf lines visible through window */}
      <line x1="9" y1="17" x2="23" y2="17" strokeWidth="0.75" stroke="var(--color-brand)" />
      {/* Control panel top — dot row */}
      <circle cx="11" cy="5" r="1" fill="var(--color-brand)" stroke="none" />
      <circle cx="16" cy="5" r="1" fill="var(--color-brand)" stroke="none" />
      <circle cx="21" cy="5" r="1" fill="var(--color-brand)" stroke="none" />
      {/* Handle bar */}
      <line x1="9" y1="27" x2="23" y2="27" strokeWidth="2" stroke="var(--color-brand)" />
    </G>
  )
}

export function MicrowaveGlyph(props: GlyphProps) {
  return (
    <G {...props}>
      {/* Cabinet — wide, short */}
      <rect x="2" y="7" width="28" height="18" rx="2" />
      {/* Door seam — left 70% is door */}
      <line x1="21" y1="7" x2="21" y2="25" />
      {/* Door viewport */}
      <rect x="4" y="10" width="14" height="10" rx="1" />
      {/* Vent slots — right panel, unique identifier */}
      <line x1="23" y1="12" x2="28" y2="12" strokeWidth="1" stroke="var(--color-brand)" />
      <line x1="23" y1="15" x2="28" y2="15" strokeWidth="1" stroke="var(--color-brand)" />
      <line x1="23" y1="18" x2="28" y2="18" strokeWidth="1" stroke="var(--color-brand)" />
      {/* Control dot */}
      <circle cx="23.5" cy="22" r="1" fill="var(--color-brand)" stroke="none" />
    </G>
  )
}

export function WaterHeaterGlyph(props: GlyphProps) {
  return (
    <G {...props}>
      {/* Tall cylinder tank */}
      <rect x="8" y="6" width="16" height="20" rx="4" />
      {/* Top pipe stub */}
      <line x1="14" y1="6" x2="14" y2="2" strokeWidth="2" stroke="var(--color-brand)" />
      {/* Bottom pipe stub */}
      <line x1="18" y1="26" x2="18" y2="30" strokeWidth="2" stroke="var(--color-brand)" />
      {/* Anode/element band */}
      <line x1="8" y1="14" x2="24" y2="14" strokeWidth="1" stroke="var(--color-brand)" />
      {/* Brand accent tick — registration corner */}
      <path d="M8 8 L8 6 L10 6" strokeWidth="1" stroke="var(--color-brand)" />
    </G>
  )
}

export function HvacGlyph(props: GlyphProps) {
  return (
    <G {...props}>
      {/* Outdoor unit — wide, low */}
      <rect x="2" y="8" width="28" height="16" rx="2" />
      {/* Three horizontal vent slots — distinctive identifier */}
      <line x1="6" y1="13" x2="14" y2="13" strokeWidth="1" stroke="var(--color-brand)" />
      <line x1="6" y1="16" x2="14" y2="16" strokeWidth="1" stroke="var(--color-brand)" />
      <line x1="6" y1="19" x2="14" y2="19" strokeWidth="1" stroke="var(--color-brand)" />
      {/* Fan circle — right side */}
      <circle cx="21" cy="16" r="5" />
      {/* Fan blades suggestion */}
      <line x1="21" y1="11" x2="21" y2="21" strokeWidth="1" stroke="var(--color-brand)" />
      <line x1="16" y1="16" x2="26" y2="16" strokeWidth="1" stroke="var(--color-brand)" />
      {/* Coil fins at top */}
      <line x1="5" y1="8" x2="5" y2="5" strokeWidth="1" />
      <line x1="9" y1="8" x2="9" y2="5" strokeWidth="1" />
      <line x1="13" y1="8" x2="13" y2="5" strokeWidth="1" />
    </G>
  )
}

/* ── Category-keyed lookup ──────────────────────────────────────────── */

export type GlyphCategory =
  | ApplianceCategory
  | "refrigerator"
  | "washer"
  | "dryer"
  | "dishwasher"
  | "range"
  | "oven"
  | "microwave"
  | "water_heater"
  | "hvac"

const GLYPH_MAP: Record<string, React.FC<GlyphProps>> = {
  refrigerator_freestanding: RefrigeratorGlyph,
  refrigerator_builtin: RefrigeratorGlyph,
  refrigerator: RefrigeratorGlyph,
  washer_frontload: WasherGlyph,
  washer_topload: WasherGlyph,
  washer: WasherGlyph,
  dryer: DryerGlyph,
  dishwasher: DishwasherGlyph,
  range_gas: RangeGlyph,
  range_electric: RangeGlyph,
  range: RangeGlyph,
  oven: WallOvenGlyph,
  wall_oven: WallOvenGlyph,
  microwave_otr: MicrowaveGlyph,
  microwave: MicrowaveGlyph,
  water_heater: WaterHeaterGlyph,
  hvac_central: HvacGlyph,
  hvac: HvacGlyph,
}

/** Renders the correct glyph for any ApplianceCategory string. Falls back to a generic box. */
export function ApplianceGlyph({
  category,
  ...props
}: GlyphProps & { category: string }) {
  const Glyph = GLYPH_MAP[category]
  if (!Glyph) {
    // Generic box fallback
    return (
      <G {...props}>
        <rect x="5" y="4" width="22" height="24" rx="2" />
        <line x1="5" y1="11" x2="27" y2="11" strokeWidth="1" />
      </G>
    )
  }
  return <Glyph {...props} />
}
