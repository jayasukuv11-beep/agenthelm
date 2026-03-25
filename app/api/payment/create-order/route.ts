import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const PLANS: Record<string, { name: string; amount: number; currency: string }> = {
  indie: {
    name: 'AgentHelm Indie Plan',
    amount: 399,
    currency: 'INR',
  },
  studio: {
    name: 'AgentHelm Studio Plan',
    amount: 1299,
    currency: 'INR',
  },
}

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
    const { plan, userId, email, name, phone } = body as {
      plan: string
      userId: string
      email: string
      name?: string
      phone?: string
    }

    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be indie or studio' },
        { status: 400 }
      )
    }

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      )
    }

    const selectedPlan = PLANS[plan]
    const orderId = `ahelm_${plan}_${userId.slice(0, 8)}_${Date.now()}`

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://agenthelm.online";

    const cashfreeBody = {
      order_id: orderId,
      order_amount: selectedPlan.amount,
      order_currency: selectedPlan.currency,
      customer_details: {
        customer_id: userId.slice(0, 50),
        customer_name: name || 'AgentHelm User',
        customer_email: email,
        customer_phone: phone || '9999999999',
      },
      order_meta: {
        return_url: `${origin}/dashboard?payment=success&order_id=${orderId}&plan=${plan}`,
        notify_url: `${origin}/api/payment/webhook`,
      },
      order_note: selectedPlan.name,
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
      amount: selectedPlan.amount,
      currency: selectedPlan.currency,
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
