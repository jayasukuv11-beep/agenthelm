import { NextResponse } from "next/server"
import { metrics } from "../../../../lib/observability"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const aggregates = metrics.getAggregates()

    return NextResponse.json({
      pipeline_metrics: aggregates,
      raw_count: metrics.getAll().length,
      timestamp: new Date().toISOString(),
    }, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
