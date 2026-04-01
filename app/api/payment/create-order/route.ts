import { NextResponse } from 'next/server'
import { MULTI_CURRENCY_PLANS, getCurrencyForCountry, type CurrencyCode } from '@/lib/currency'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

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

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      )
    }

    // Determine currency: 1. Profile preference, 2. Geo-IP header, 3. Default USD
    const { data: profile } = await supabaseAdmin.from('profiles').select('preferred_currency').eq('id', userId).single();
    
    let currency: CurrencyCode = (profile?.preferred_currency as CurrencyCode) || 
      getCurrencyForCountry(req.headers.get('x-vercel-ip-country'));

    const planData = MULTI_CURRENCY_PLANS[currency]?.[plan];

    if (!plan || !planData) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be indie or studio' },
        { status: 400 }
      )
    }

    const orderId = `ahelm_${plan}_${userId.slice(0, 8)}_${Date.now()}`

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://agenthelm.online";

    const cashfreeBody = {
      order_id: orderId,
      order_amount: planData.amount,
      order_currency: currency,
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
