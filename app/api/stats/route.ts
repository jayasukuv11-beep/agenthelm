import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { metrics } from "../../../lib/observability"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Parallel fetching for performance
    const [
      { count: logsCount },
      { count: agentsCount },
      { count: profilesCount },
      { count: interventionsCount }
    ] = await Promise.all([
      supabaseAdmin.from('agent_logs').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('agents').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('tool_executions').select('*', { count: 'exact', head: true })
    ])

    return NextResponse.json({
      traces: logsCount || 0,
      agents: agentsCount || 0,
      members: profilesCount || 0,
      interventions: interventionsCount || 0,
      uptime: 99.9, // Static SLA but could be heartbeat driven in future
      sdks: 2,
      pipeline_metrics: metrics.getAggregates()
    })
  } catch (error) {
    console.error('Stats API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
