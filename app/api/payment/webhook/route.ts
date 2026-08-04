import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
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
      }
    }
    console.log('Webhook received:', body.type, body.data?.order?.order_id)

    const eventType = body.type || ''
    const orderStatus = body.data?.order?.order_status || ''
    const orderId: string = body.data?.order?.order_id || ''
    const customerId: string =
      body.data?.order?.customer_details?.customer_id || ''

    if (
      (eventType === 'PAYMENT_SUCCESS_WEBHOOK' ||
       eventType === 'payment_success') &&
      orderStatus === 'PAID'
    ) {
      // Extract plan from orderId: ahelm_{plan}_{userId}_{timestamp}
      const parts = orderId.split('_')
      const plan = parts[1]

      if (!plan || !['indie', 'studio'].includes(plan)) {
        console.error('Invalid plan in order:', orderId)
        return NextResponse.json({ received: true })
      }

      const supabase = getSupabaseAdmin()

      // Find user by customer_id (which is userId.slice(0,50))
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('id', `${customerId}%`)
        .single()

      const userId = profile?.id || customerId

      // Upsert subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: userId,
            plan,
            status: 'active',
            order_id: orderId,
            activated_at: new Date().toISOString(),
            expires_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (subError) {
        console.error('Subscription upsert error:', subError)
      }

      // Update profile plan
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          plan,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }

      console.log(`✅ Payment success: ${userId} → ${plan} (${orderId})`)
    }

    if (
      eventType === 'PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'payment_failed'
    ) {
      console.log(`❌ Payment failed: ${orderId}`)
    }

    return NextResponse.json({ received: true })

  } catch (err: unknown) {
    console.error('Webhook processing error:', err)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
