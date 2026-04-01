import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, agent_id, index_content } = body

    if (!agent_id || !index_content) {
      return NextResponse.json({ error: 'Missing agent_id or index_content' }, { status: 400 })
    }

    const auth: any = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { userId, supabaseAdmin } = auth as any

    // Verify ownership
    const { data: dbAgent } = await supabaseAdmin!
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .eq('user_id', userId)
      .single()

    if (!dbAgent) {
      return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
    }

    // Upsert the synced memory index
    const { error } = await supabaseAdmin!
      .from('agent_memory')
      .upsert({
        agent_id,
        user_id: userId,
        index_content,
        last_synced_at: new Date().toISOString()
      }, { onConflict: 'agent_id' })

    if (error) {
      console.error('Error syncing agent memory:', error)
      return NextResponse.json({ error: 'Failed to sync memory' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: unknown) {
    console.error('Memory sync error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
