import type { SupabaseClient } from "@supabase/supabase-js"

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy"
  checks: Record<string, { ok: boolean; message?: string }>
  timestamp: string
  uptime?: number
}

function getUptime(): number {
  if (typeof process !== "undefined" && process.uptime) {
    return Math.round(process.uptime())
  }
  return 0
}

export async function checkSystemHealth(
  supabase: SupabaseClient
): Promise<HealthStatus> {
  const checks: Record<string, { ok: boolean; message?: string }> = {}

  try {
    const { error } = await supabase.from("brain_entries").select("id", {
      count: "exact",
      head: true,
    })

    if (error) {
      checks["database"] = { ok: false, message: error.message }
    } else {
      checks["database"] = { ok: true }
    }
  } catch (err) {
    checks["database"] = {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok)

  return {
    status: allOk ? "healthy" : "unhealthy",
    checks,
    timestamp: new Date().toISOString(),
    uptime: getUptime(),
  }
}

export function getReadyStatus(health: HealthStatus): HealthStatus {
  const allOk = Object.values(health.checks).every((c) => c.ok)
  return {
    ...health,
    status: allOk ? "healthy" : "unhealthy",
  }
}

export function getLivenessStatus(): HealthStatus {
  return {
    status: "healthy",
    checks: { process: { ok: true, message: "Process is running" } },
    timestamp: new Date().toISOString(),
    uptime: getUptime(),
  }
}
