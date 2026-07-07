import { NextResponse } from "next/server"
import { getLivenessStatus } from "../../../lib/observability"

export const dynamic = "force-dynamic"

export async function GET() {
  const status = getLivenessStatus()
  return NextResponse.json(status, { status: 200 })
}
