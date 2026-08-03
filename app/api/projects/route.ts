import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
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

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, repo_url } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const { data: project, error: createError } = await supabase
      .from('projects')
      .insert({
        user_id: authData.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        repo_url: repo_url?.trim() || null,
        brain_version: 0,
      })
      .select()
      .single()

    if (createError) {
      console.error('Project creation error:', createError)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    // Initialize initial brain version
    await supabase.from('brain_versions').insert({
      project_id: project.id,
      version: 1,
      evolution_reason: 'Project initialized',
      files_changed_count: 0,
      apis_changed_count: 0,
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (err) {
    console.error('Projects POST API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

