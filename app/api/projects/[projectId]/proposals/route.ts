import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership of the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', authData.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch proposals
    const { data: proposals, error: proposalsError } = await supabase
      .from('knowledge_proposals')
      .select(`
        id,
        summary,
        decisions,
        files_modified,
        apis_affected,
        db_changes,
        known_limitations,
        next_steps,
        tests_passed,
        human_reviewed,
        commit_sha,
        branch,
        author,
        build_status,
        conflict_detected,
        conflict_details,
        evidence_score,
        rejection_reason,
        created_at
      `)
      .eq('project_id', params.projectId)
      .order('created_at', { ascending: false })

    if (proposalsError) {
      console.error('Proposals API fetch error:', proposalsError)
      return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
    }

    return NextResponse.json({ proposals: proposals || [] })
  } catch (err) {
    console.error('Proposals API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
