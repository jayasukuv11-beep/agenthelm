export interface PipelineMetric {
  stage: string
  success: boolean
  durationMs: number
  timestamp: string
  errorCode?: string
}

export interface AggregatedMetric {
  stage: string
  total: number
  successCount: number
  failureCount: number
  avgDuration: number
  p95Latency: number
}

const MAX_BUFFER_SIZE = 10000

export class MetricsCollector {
  private metrics: PipelineMetric[] = []

  recordStage(
    stage: string,
    success: boolean,
    durationMs: number,
    errorCode?: string
  ): void {
    if (this.metrics.length >= MAX_BUFFER_SIZE) {
      // Overwrite the oldest lowest-priority (success) entries first
      // by dropping from the beginning of the ring-like buffer
      this.metrics.shift()
    }

    this.metrics.push({
      stage,
      success,
      durationMs,
      timestamp: new Date().toISOString(),
      errorCode,
    })
  }

  getAll(): ReadonlyArray<PipelineMetric> {
    return [...this.metrics]
  }

  getAggregates(): AggregatedMetric[] {
    const byStage = new Map<string, PipelineMetric[]>()

    for (const m of this.metrics) {
      const existing = byStage.get(m.stage) ?? []
      existing.push(m)
      byStage.set(m.stage, existing)
    }

    const aggregates: AggregatedMetric[] = []

    for (const [stage, entries] of Array.from(byStage.entries())) {
      const durations = entries.map((e) => e.durationMs)
      const successCount = entries.filter((e) => e.success).length
      const failureCount = entries.filter((e) => !e.success).length
      const totalDuration = durations.reduce((sum, d) => sum + d, 0)

      aggregates.push({
        stage,
        total: entries.length,
        successCount,
        failureCount,
        avgDuration: durations.length > 0 ? Math.round(totalDuration / durations.length) : 0,
        p95Latency: calculateP95(durations),
      })
    }

    return aggregates
  }

  reset(): void {
    this.metrics = []
  }
}

export function calculateP95(durations: number[]): number {
  if (durations.length === 0) return 0
  const sorted = [...durations].sort((a, b) => a - b)
  const index = Math.ceil((sorted.length * 95) / 100) - 1
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
}

export const metrics = new MetricsCollector()
