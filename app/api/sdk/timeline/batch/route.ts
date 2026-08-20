import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { z } from 'zod'

const timelineBatchPostSchema = z.object({
  project: z.string().optional(),
  project_id: z.string().optional(),
  agent_id: z.string().uuid().optional(),
  events: z.array(z.object({
    event_type: z.string().min(1),
    title: z.string().min(1),
    details: z.record(z.string(), z.any()).optional(),
    timestamp: z.string().optional(),
    created_at: z.string().optional(),
  })).min(1).max(100)
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: timelineBatchPostSchema,
    requireProjectId: true,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { agentId, supabase, body, project } = ctx
    const { events } = body

    const timelineEvents = events.map(event => ({
      project_id: project!.id,
      agent_id: agentId,
      event_type: event.event_type || 'custom',
      title: event.title || 'Agent Event',
      details: event.details || {},
      created_at: event.timestamp || event.created_at || new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('ai_timeline_events')
      .insert(timelineEvents)

    if (insertError) throw insertError

    return NextResponse.json({ success: true, count: timelineEvents.length })
  }
)
