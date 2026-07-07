import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkSystemHealth, getReadyStatus } from "../../../lib/observability"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  try {
    const health = await checkSystemHealth(supabaseAdmin)
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
