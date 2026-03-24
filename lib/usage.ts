import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export type UserUsage = {
  agentCount: number
  monthlyTokens: number
  plan: 'free' | 'indie' | 'studio'
  tokensLimit: number
  agentLimit: number
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: agentCount },
    { data: usageData },
    { data: profile }
  ] = await Promise.all([
    supabaseAdmin
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabaseAdmin
      .from('credit_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .gte('created_at', firstDayOfMonth),
    supabaseAdmin
      .from('profiles')
      .select('plan, tokens_limit_monthly')
      .eq('id', userId)
      .single()
  ])

  const monthlyTokens = (usageData ?? []).reduce((sum, r) => sum + (r.tokens_used || 0), 0)
  const plan = (profile?.plan || 'free') as 'free' | 'indie' | 'studio'
  
  // Default limits based on plan if not specified in profile
  const tokensLimit = profile?.tokens_limit_monthly || (plan === 'free' ? 100000 : 2000000)
  const agentLimit = plan === 'free' ? 3 : plan === 'indie' ? 10 : 1000

  return {
    agentCount: agentCount || 0,
    monthlyTokens,
    plan,
    tokensLimit,
    agentLimit
  }
}
