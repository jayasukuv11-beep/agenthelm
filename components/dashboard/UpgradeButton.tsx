'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UpgradeButtonProps {
  plan: 'indie' | 'studio'
  label: string
  className?: string
}

export function UpgradeButton({
  plan,
  label,
  className = '',
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      // Step 1: Create Cashfree order
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || 'User',
          phone: '9999999999',
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.paymentSessionId) {
        throw new Error(data.error || 'Failed to create payment order')
      }

      // Step 2: Load Cashfree JS SDK dynamically
      await new Promise<void>((resolve, reject) => {
        if ((window as unknown as Record<string, unknown>).Cashfree) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Cashfree SDK'))
        document.head.appendChild(script)
      })

      // Step 3: Open Cashfree checkout
      const CashfreeSDK = (window as unknown as Record<string, unknown>).Cashfree as (opts: { mode: string }) => { checkout: (opts: { paymentSessionId: string; redirectTarget: string }) => void }
      const cashfree = CashfreeSDK({
        mode: 'sandbox',
      })

      cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: '_self',
      })

    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          label
        )}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  )
}
