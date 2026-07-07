import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', authData.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Parse query params
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const status = url.searchParams.get('status') || 'active'
    const search = url.searchParams.get('search')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('brain_entries')
      .select('id, category, title, content, status, tags, source_type, source_path, confidence, created_at', { count: 'exact' })
      .eq('project_id', params.projectId)

    if (status !== 'all') {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (search) {
      query = query.textSearch('search_vector', search)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: entries, error: entriesError, count } = await query

    if (entriesError) {
      console.error('Brain entries fetch error:', entriesError)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    return NextResponse.json({
      entries: entries || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (err) {
    console.error('Brain entries API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
