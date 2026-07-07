import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveConflict } from '@/lib/brain-compiler'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { projectId: string; proposalId: string } }
) {
  try {
    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const action = body.action

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
    }

    const { data: proposal, error: proposalError } = await supabase
      .from('knowledge_proposals')
      .select('id, project_id, projects!inner(id, user_id)')
      .eq('id', params.proposalId)
      .eq('project_id', params.projectId)
      .eq('projects.user_id', authData.user.id)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const result = await resolveConflict(
      params.proposalId,
      action,
      authData.user.id,
      body.notes
    )

    return NextResponse.json(result)
  } catch (err) {
    console.error('Proposal resolve error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
