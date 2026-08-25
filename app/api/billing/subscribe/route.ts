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

    // SECURITY: do NOT activate the plan here. Activation happens only after
    // Cashfree confirms payment — via the signed webhook or /api/payment/verify.
    // Writing 'active' before payment would let users skip paying entirely.

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
