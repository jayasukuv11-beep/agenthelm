import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { normalizePlanId, provisionPaidPlan } from '@/lib/billing/plans'
export const dynamic = 'force-dynamic'

function verifySignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  try {
    const signedPayload = timestamp + rawBody
    const expected = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('base64')
    return expected === signature
  } catch {
    return false
  }
}

export async function GET() {
  return NextResponse.json({ status: 'webhook endpoint active' })
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const timestamp = req.headers.get('x-webhook-timestamp') || ''
    const signature = req.headers.get('x-webhook-signature') || ''
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || ''

    if (!webhookSecret || !timestamp || !signature) {
      console.error('Missing Cashfree webhook verification configuration or headers')
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    if (!verifySignature(rawBody, timestamp, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody) as {
      type?: string
      data?: {
        order?: {
          order_id?: string
          order_status?: string
          customer_details?: {
            customer_id?: string
          }
        }
        payment?: {
          payment_id?: string
        }
      }
    }
    console.log('Webhook received:', body.type, body.data?.order?.order_id)

    const eventType = body.type || ''
    const orderStatus = body.data?.order?.order_status || ''
    const orderId: string = body.data?.order?.order_id || ''
    const customerId: string =
      body.data?.order?.customer_details?.customer_id || ''
    const cashfreePaymentId = body.data?.payment?.payment_id || ''

    // Only act on verified successful payments
    const isSuccess =
      (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'payment_success') &&
      orderStatus === 'PAID'

    if (!isSuccess) {
      if (eventType.includes('FAILED')) {
        console.log(`❌ Payment failed: ${orderId}`)
      }
      return NextResponse.json({ received: true })
    }

    // Order id format: ahelm_{plan}_{userPrefix}_{timestamp}
    // plan may be a legacy id (indie/studio) or canonical (pro/team).
    const parts = orderId.split('_')
    const rawPlan = parts[1]
    const userPrefix = parts[2] || ''
    const canonicalPlan = normalizePlanId(rawPlan)

    if (!rawPlan || canonicalPlan === 'free') {
      console.error('Invalid or free plan in paid order:', orderId)
      return NextResponse.json({ received: true })
    }

    const supabase = getSupabaseAdmin()

    // Resolve the user: customer_id is userId.slice(0, 50); fall back to the
    // order-id prefix for robustness.
    let userId: string | null = null

    if (customerId) {
      const { data: byCustomer } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `${customerId}%`)
        .limit(1)
      if (byCustomer && byCustomer.length > 0) userId = byCustomer[0].id
    }

    if (!userId && userPrefix) {
      const { data: byOrderPrefix } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `${userPrefix}%`)
        .limit(1)
      if (byOrderPrefix && byOrderPrefix.length > 0) userId = byOrderPrefix[0].id
    }

    if (!userId) {
      console.error(
        `Webhook could not resolve user for order ${orderId} (customer=${customerId}, prefix=${userPrefix})`
      )
      // 200 so Cashfree doesn't retry forever on an unresolvable order;
      // reconciliation happens via /api/payment/verify.
      return NextResponse.json({ received: true })
    }

    // Grant access via the shared provisioning path (user_subscriptions +
    // profiles + legacy subscriptions — idempotent).
    const result = await provisionPaidPlan(supabase as never, userId, rawPlan, orderId)
    if (result.error) {
      console.error(`Provisioning failed for ${orderId}:`, result.error)
      return NextResponse.json({ error: 'Provisioning failed' }, { status: 500 })
    }

    console.log(
      `✅ Payment success: ${userId} → ${canonicalPlan} (${orderId}${cashfreePaymentId ? `, payment=${cashfreePaymentId}` : ''})`
    )

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    console.error('Webhook processing error:', err)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
