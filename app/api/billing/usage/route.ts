import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/app/lib/supabase'
import { getPlanForUser } from '@/lib/billing/plans'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: authData, error: authErr } = await supabase.auth.getUser()

    if (authErr || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, subscription, creditsRemaining } = await getPlanForUser(supabase, authData.user.id)

    // Fetch usage breakdown
    const { data: events } = await supabase
      .from('usage_events')
      .select('event_type, credits_cost')
      .eq('user_id', authData.user.id)

    const breakdown: Record<string, number> = {}
    for (const ev of events || []) {
      breakdown[ev.event_type] = (breakdown[ev.event_type] || 0) + (ev.credits_cost || 1)
    }

    return NextResponse.json({
      plan: plan.id,
      plan_name: plan.name,
      credits_monthly: plan.credits_monthly,
      credits_used: subscription?.credits_used_this_period || 0,
      credits_remaining: creditsRemaining,
      breakdown
    })

  } catch (err: any) {
    console.error('Usage API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
