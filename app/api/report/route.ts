import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Shareable-report endpoint. Persisting and hosting a public result URL is not
 * enabled in this build, so the endpoint honestly returns 503 Service
 * Unavailable. The client treats 503 as "sharing is turned off" — it disables
 * the button and stops offering a retry that could never succeed, rather than
 * pretending the save worked.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Sharing is not available yet.", disabled: true },
    { status: 503 },
  )
}
