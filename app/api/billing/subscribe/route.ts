import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/app/lib/supabase'
import { createCashfreeSubscription } from '@/lib/billing/cashfree'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: authData, error: authErr } = await supabase.auth.getUser()

    if (authErr || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { plan_id } = body

    if (!['pro', 'team'].includes(plan_id)) {
      return NextResponse.json({ error: 'Invalid plan_id' }, { status: 400 })
    }

    const { paymentUrl, subscriptionId } = await createCashfreeSubscription(
      supabase,
      authData.user.id,
      plan_id,
      authData.user.email || 'user@agenthelm.online'
    )

    // Update user_subscriptions table
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: authData.user.id,
        plan_id,
        status: 'active',
        cashfree_subscription_id: subscriptionId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        credits_used_this_period: 0
      }, { onConflict: 'user_id' })

    // Also update profiles table for backwards compatibility
    await supabase
      .from('profiles')
      .update({ plan: plan_id })
      .eq('id', authData.user.id)

    return NextResponse.json({
      success: true,
      payment_url: paymentUrl,
      subscription_id: subscriptionId
    })

  } catch (err: any) {
    console.error('Subscription error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
