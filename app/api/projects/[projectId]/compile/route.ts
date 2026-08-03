import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { compilePendingProposals } from '@/lib/brain-compiler'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.projectId)
      .eq('user_id', authData.user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const summary = await compilePendingProposals(params.projectId)

    return NextResponse.json({ success: true, summary })
  } catch (err: any) {
    console.error('Compile proposals route error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
