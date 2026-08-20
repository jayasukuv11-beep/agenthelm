import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/app/lib/supabase'
import { seedBrainFromRepo } from '@/lib/brain/brain-seeder'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: authData, error: authErr } = await supabase.auth.getUser()

    if (authErr || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { project_id, repo_url, github_token } = body

    if (!project_id || !repo_url) {
      return NextResponse.json({ error: 'project_id and repo_url are required' }, { status: 400 })
    }

    // Verify project ownership
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', project_id)
      .eq('user_id', authData.user.id)
      .single()

    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 })
    }

    const seedingResult = await seedBrainFromRepo(supabase, project_id, repo_url, github_token)

    return NextResponse.json({
      success: true,
      result: seedingResult
    })
  } catch (err: any) {
    console.error('GitHub Seeding Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
