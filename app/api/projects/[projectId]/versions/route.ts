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

    // Verify ownership of project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', authData.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch brain versions
    const { data: versions, error: versionsError } = await supabase
      .from('brain_versions')
      .select(`
        id,
        version,
        parent_version,
        evolution_reason,
        built_from_proposals,
        files_changed_count,
        apis_changed_count,
        entries_added_count,
        entries_deprecated_count,
        evidence_summary,
        created_at
      `)
      .eq('project_id', params.projectId)
      .order('version', { ascending: false })

    if (versionsError) {
      console.error('Versions API fetch error:', versionsError)
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    return NextResponse.json({ versions: versions || [] })
  } catch (err) {
    console.error('Versions API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
