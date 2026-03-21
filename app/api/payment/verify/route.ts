import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('order_id')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing order_id parameter' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://sandbox.cashfree.com/pg/orders/${orderId}`,
      {
        method: 'GET',
        headers: {
          'x-api-version': '2025-01-01',
          'x-client-id': process.env.CASHFREE_APP_ID!,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
        },
      }
    )

    const data = await response.json()

    return NextResponse.json({
      success: true,
      status: data.order_status,
      paid: data.order_status === 'PAID',
      orderId: data.order_id,
      amount: data.order_amount,
      plan: data.order_note,
    })

  } catch (err: unknown) {
    console.error('Verify payment error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
