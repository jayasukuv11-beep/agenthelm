/**
 * AgentHelm Currency Utility
 * Handles multi-currency formatting for Rupees (INR) and Dollars (USD).
 */

export type CurrencyCode = 'INR' | 'USD'

/**
 * Detects the user's currency based on country code from headers
 * (Vercel-IP-Country header).
 * Defaults to USD.
 */
export function getCurrencyForCountry(countryCode: string | null): CurrencyCode {
  if (!countryCode) return 'USD'
  const inCountryCodes = ['IN'] // India
  return inCountryCodes.includes(countryCode.toUpperCase()) ? 'INR' : 'USD'
}

/**
 * Formats a numeric amount based on the provided currency.
 * Using Intl.NumberFormat for precision.
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // USD (Standard format)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Helper to display the appropriate symbol.
 */
export function getCurrencySymbol(currency: CurrencyCode = 'USD'): string {
  return currency === 'INR' ? '₹' : '$'
}

/**
 * Fixed tiers for Indie and Studio plans.
 * We do not use dynamic conversion to keep prices steady for users.
 */
export const MULTI_CURRENCY_PLANS: Record<
  CurrencyCode,
  Record<string, { amount: number; name: string }>
> = {
  INR: {
    indie: { amount: 8499, name: 'AgentHelm Scale (Monthly)' },
    studio: { amount: 42999, name: 'AgentHelm Enterprise (Monthly)' },
  },
  USD: {
    indie: { amount: 99, name: 'AgentHelm Scale (Monthly)' },
    studio: { amount: 499, name: 'AgentHelm Enterprise (Monthly)' },
  },
}
