import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { checkSystemHealth, getReadyStatus } from "../../../lib/observability"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const health = await checkSystemHealth(getSupabaseAdmin())
    const ready = getReadyStatus(health)
    const status = ready.status === "healthy" ? 200 : 503

    return NextResponse.json(ready, { status })
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
