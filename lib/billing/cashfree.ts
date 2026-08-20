import type { SupabaseClient } from '@supabase/supabase-js'

export interface CashfreeSubscriptionResponse {
  paymentUrl: string
  subscriptionId: string
}

export async function createCashfreeSubscription(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  customerEmail: string,
  customerPhone?: string
): Promise<CashfreeSubscriptionResponse> {
  const appId = process.env.CASHFREE_APP_ID
  const secretKey = process.env.CASHFREE_SECRET_KEY
  const env = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX'
  const baseUrl = env === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'

  const subscriptionId = `sub_${userId.slice(0, 8)}_${Date.now()}`

  // If credentials are configured, initiate Cashfree payment session
  if (appId && secretKey) {
    try {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: subscriptionId,
          order_amount: planId === 'pro' ? 499.00 : 1999.00,
          order_currency: 'INR',
          customer_details: {
            customer_id: userId,
            customer_email: customerEmail || 'user@agenthelm.online',
            customer_phone: customerPhone || '9999999999'
          },
          order_meta: {
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://agenthelm.online'}/dashboard/settings?session_id={order_id}`
          }
        })
      })

      const data = await response.json()
      if (data.payment_link || data.payment_session_id) {
        return {
          paymentUrl: data.payment_link || `/dashboard/settings?payment_session_id=${data.payment_session_id}`,
          subscriptionId
        }
      }
    } catch (err) {
      console.error('Cashfree order creation error:', err)
    }
  }

  // Fallback / mock payment URL
  return {
    paymentUrl: `/dashboard/settings?mock_payment=success&plan=${planId}`,
    subscriptionId
  }
}
