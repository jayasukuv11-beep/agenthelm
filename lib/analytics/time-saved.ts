import type { SupabaseClient } from '@supabase/supabase-js'

export interface DailyTimeSaved {
  date: string
  seconds_saved: number
  injections_count: number
}

export interface TimeSavedStats {
  total_seconds: number
  total_hours: number
  total_injections: number
  total_entries_served: number
  duplicates_prevented: number
  stale_prevented: number
  daily_breakdown: DailyTimeSaved[]
}

export async function getTimeSavedStats(
  supabase: SupabaseClient,
  projectId: string,
  range: '7d' | '30d' | 'all' = '7d'
): Promise<TimeSavedStats> {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 365
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: injections } = await supabase
    .from('context_injections')
    .select('entries_returned, estimated_seconds_saved, created_at')
    .eq('project_id', projectId)
    .gte('created_at', sinceDate)
    .order('created_at', { ascending: true })

  const rows = injections || []
  let totalSeconds = 0
  let totalEntries = 0
  const dailyMap = new Map<string, { seconds: number; count: number }>()

  for (const row of rows) {
    const sec = row.estimated_seconds_saved || (row.entries_returned * 45)
    totalSeconds += sec
    totalEntries += row.entries_returned || 0

    const dateStr = new Date(row.created_at).toISOString().split('T')[0]
    const existing = dailyMap.get(dateStr) || { seconds: 0, count: 0 }
    dailyMap.set(dateStr, {
      seconds: existing.seconds + sec,
      count: existing.count + 1
    })
  }

  const dailyBreakdown: DailyTimeSaved[] = Array.from(dailyMap.entries()).map(([date, val]) => ({
    date,
    seconds_saved: val.seconds,
    injections_count: val.count
  }))

  return {
    total_seconds: totalSeconds,
    total_hours: parseFloat((totalSeconds / 3600).toFixed(1)),
    total_injections: rows.length,
    total_entries_served: totalEntries,
    duplicates_prevented: Math.round(rows.length * 0.2), // Heuristic estimate
    stale_prevented: Math.round(rows.length * 0.1),
    daily_breakdown: dailyBreakdown
  }
}
