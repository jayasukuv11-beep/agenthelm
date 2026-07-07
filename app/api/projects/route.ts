import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's projects with aggregated stats
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description, repo_url, brain_version, created_at, updated_at')
      .eq('user_id', authData.user.id)
      .order('updated_at', { ascending: false })

    if (projectsError) {
      console.error('Projects fetch error:', projectsError)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // For each project, get counts of agents, entries, and pending proposals
    const enrichedProjects = await Promise.all(
      (projects || []).map(async (project) => {
        const [agentsResult, entriesResult, proposalsResult] = await Promise.all([
          supabase
            .from('agents')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id),
          supabase
            .from('brain_entries')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('status', 'active'),
          supabase
            .from('knowledge_proposals')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('build_status', 'pending'),
        ])

        return {
          ...project,
          stats: {
            agents: agentsResult.count || 0,
            entries: entriesResult.count || 0,
            pending_proposals: proposalsResult.count || 0,
          },
        }
      })
    )

    return NextResponse.json({ projects: enrichedProjects })
  } catch (err) {
    console.error('Projects API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
