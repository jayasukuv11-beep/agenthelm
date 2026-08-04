import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { checkSystemHealth } from "../../../lib/observability"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const health = await checkSystemHealth(getSupabaseAdmin())
    const status = health.status === "healthy" ? 200 : 503

    return NextResponse.json(health, { status })
  } catch (err) {
    return NextResponse.json(
      {
        status: "unhealthy",
        checks: { error: { ok: false, message: err instanceof Error ? err.message : String(err) } },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
