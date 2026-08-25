import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizePlanId, provisionPaidPlan } from '@/lib/billing/plans'
export const dynamic = 'force-dynamic'

/**
 * Post-redirect payment verification.
 * Called by the dashboard when the user returns with
 * /dashboard?payment=success&order_id=...&plan=...
 *
 * The Cashfree webhook is the source of truth, but webhooks can lag or be
 * missed — so this endpoint verifies the order directly against Cashfree and
 * provisions access idempotently. Provisioning is safe to run twice: both the
 * webhook and this route write the same canonical rows.
 */
export async function POST(req: Request) {
  try {
    // 1. Auth: only the signed-in owner can trigger verification
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let orderId = ''
    try {
      const body = (await req.json()) as { order_id?: string }
      orderId = body.order_id || ''
    } catch {
      orderId = ''
    }
    if (!orderId) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    // 2. Verify directly with Cashfree (PRODUCTION base url)
    const baseUrl =
      process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
        ? 'https://api.cashfree.com'
        : 'https://sandbox.cashfree.com'

    const cfRes = await fetch(`${baseUrl}/pg/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-api-version': '2025-01-01',
        'x-client-id': process.env.CASHFREE_APP_ID!,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
      },
    })

    if (!cfRes.ok) {
      return NextResponse.json(
        { error: 'Verification failed', status: cfRes.status },
        { status: 502 }
      )
    }

    const order = (await cfRes.json()) as {
      order_status?: string
      order_amount?: number
      order_note?: string
      customer_details?: { customer_id?: string }
    }

    const paid = order.order_status === 'PAID'

    if (!paid) {
      return NextResponse.json({
        success: true,
        paid: false,
        status: order.order_status || 'UNKNOWN',
        orderId,
      })
    }

    // 3. Extract plan from our order id: ahelm_{plan}_{userPrefix}_{ts}
    const parts = orderId.split('_')
    const rawPlan = parts[1] || ''
    const canonicalPlan = normalizePlanId(rawPlan)

    if (canonicalPlan === 'free') {
      return NextResponse.json(
        { success: false, paid: true, error: 'Unrecognized plan in order' },
        { status: 422 }
      )
    }

    // 4. Guard: the order must belong to the calling user
    const orderUserPrefix = parts[2] || ''
    if (orderUserPrefix && !user.id.startsWith(orderUserPrefix)) {
      return NextResponse.json(
        { success: false, paid: true, error: 'Order does not belong to this account' },
        { status: 403 }
      )
    }

    // 5. Provision access via the shared billing path using the service-role
    //    client (user is authenticated + order ownership verified above, but
    //    provisioning must not partially fail on RLS column restrictions).
    const { getSupabaseAdmin } = await import('@/lib/supabase/admin')
    const provision = await provisionPaidPlan(
      getSupabaseAdmin() as never,
      user.id,
      rawPlan,
      orderId
    )
    if (provision.error) {
      console.error('Provisioning error:', provision.error)
      return NextResponse.json({ error: 'Provisioning failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      paid: true,
      plan: canonicalPlan,
      orderId,
      amount: order.order_amount,
    })
  } catch (err: unknown) {
    console.error('Verify payment error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
