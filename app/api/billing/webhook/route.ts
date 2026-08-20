import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const eventType = body.type || body.event

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'SUBSCRIPTION_ACTIVE') {
      const customerId = body.data?.customer_details?.customer_id
      const orderId = body.data?.order?.order_id

      if (customerId) {
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('user_id', customerId)
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    console.error('Cashfree webhook error:', err)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
