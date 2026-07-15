import { NextResponse } from "next/server"
import { metrics } from "../../../../lib/observability"
import { validateConnectKey, hasError } from "../../../../lib/sdk-auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const connectKey = authHeader ? authHeader.replace('Bearer ', '') : (req.headers.get('x-connect-key') || searchParams.get('key'));

    const auth = await validateConnectKey(connectKey);
    if (hasError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
