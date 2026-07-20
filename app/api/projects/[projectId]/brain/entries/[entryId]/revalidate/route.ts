import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(
  req: Request,
  { params }: { params: { projectId: string; entryId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { validity_status } = await req.json()
    
    if (!['CURRENT', 'NEEDS_REVIEW', 'STALE', 'SUPERSEDED'].includes(validity_status)) {
      return NextResponse.json({ error: 'Invalid validity status' }, { status: 400 })
    }

    // Verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', session.user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('brain_entries')
      .update({
        validity_status,
        stale_reason: validity_status === 'CURRENT' ? null : `Manually marked as ${validity_status}`,
        validated_at: new Date().toISOString()
      })
      .eq('id', params.entryId)
      .eq('project_id', params.projectId)

    if (error) throw error

    revalidatePath(`/dashboard/knowledge`)
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Failed to revalidate entry:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
