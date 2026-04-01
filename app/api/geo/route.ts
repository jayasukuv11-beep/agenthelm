import { NextResponse } from 'next/server'
import { getCurrencyForCountry } from '@/lib/currency'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const country = req.headers.get('x-vercel-ip-country')
  const currency = getCurrencyForCountry(country)
  
  return NextResponse.json({
    country,
    currency
  })
}
