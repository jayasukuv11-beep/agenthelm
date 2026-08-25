import { NextResponse } from 'next/server'
import { MULTI_CURRENCY_PLANS, type CurrencyCode } from '@/lib/currency'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { plan, name, phone } = body as {
      plan: string
      name?: string
      phone?: string
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Authentication is required to create an order' },
        { status: 401 }
      )
    }

    // India-first billing: AgentHelm is priced in INR (₹499 / ₹1,999) and the
    // connected Cashfree merchant account only has INR enabled. Force INR so
    // orders never fail with "Currency not enabled for this merchant account".
    const currency: CurrencyCode = 'INR'

    const planData = MULTI_CURRENCY_PLANS[currency]?.[plan];

    if (!plan || !planData) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be indie or studio' },
        { status: 400 }
      )
    }

    const orderId = `ahelm_${plan}_${user.id.slice(0, 8)}_${Date.now()}`

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agenthelm.online"

    const cashfreeBody = {
      order_id: orderId,
      order_amount: planData.amount,
      order_currency: currency,
      customer_details: {
        customer_id: user.id.slice(0, 50),
        customer_name: name || 'AgentHelm User',
        customer_email: user.email,
        customer_phone: phone || '9999999999',
      },
      order_meta: {
        return_url: `${appUrl}/dashboard?payment=success&order_id=${orderId}&plan=${plan}`,
        notify_url: `${appUrl}/api/payment/webhook`,
      },
      order_note: planData.name,
    }

    const baseUrl = process.env.CASHFREE_ENVIRONMENT === "PRODUCTION" 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    const response = await fetch(
      baseUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2025-01-01',
          'x-client-id': process.env.CASHFREE_APP_ID!,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
        },
        body: JSON.stringify(cashfreeBody),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Cashfree create order error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to create payment order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      amount: planData.amount,
      currency,
      plan,
    })

  } catch (err: unknown) {
    console.error('Create order error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
