import type { SupabaseClient } from '@supabase/supabase-js'

export interface SubscriptionPlan {
  id: string
  name: string
  price_monthly: number
  price_yearly: number
  credits_monthly: number
  max_agents: number
  max_projects: number
  max_brain_entries: number
  features: Record<string, any>
}

export const DEFAULT_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price_monthly: 0,
    price_yearly: 0,
    credits_monthly: 100,
    max_agents: 1,
    max_projects: 1,
    max_brain_entries: 50,
    features: {
      brain_seeding: true,
      export: true,
      telegram_notifications: false,
      cross_agent: false,
      policy_engine: 'gated_only',
      sarvam_calls_per_day: 100
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price_monthly: 49900,
    price_yearly: 499900,
    credits_monthly: 2000,
    max_agents: 3,
    max_projects: 3,
    max_brain_entries: 500,
    features: {
      brain_seeding: true,
      export: true,
      telegram_notifications: true,
      cross_agent: true,
      policy_engine: 'all_modes',
      sarvam_calls_per_day: 1000,
      document_intelligence: true,
      translation: true
    }
  },
  team: {
    id: 'team',
    name: 'Team',
    price_monthly: 199900,
    price_yearly: 1999900,
    credits_monthly: 10000,
    max_agents: 10,
    max_projects: 10,
    max_brain_entries: -1,
    features: {
      brain_seeding: true,
      export: true,
      telegram_notifications: true,
      cross_agent: true,
      policy_engine: 'all_modes',
      sarvam_calls_per_day: 5000,
      document_intelligence: true,
      translation: true,
      sso: false,
      audit_log_export: true
    }
  }
}

export async function getPlanForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ plan: SubscriptionPlan; subscription: any; creditsRemaining: number }> {
  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  const planId = sub?.plan_id || 'free'
  const plan = DEFAULT_PLANS[planId] || DEFAULT_PLANS.free
  const creditsUsed = sub?.credits_used_this_period || 0
  const creditsRemaining = Math.max(0, plan.credits_monthly - creditsUsed)

  return {
    plan,
    subscription: sub || null,
    creditsRemaining
  }
}

export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  creditsCost: number = 1,
  metadata?: Record<string, any>
): Promise<void> {
  void supabase
    .from('usage_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      credits_cost: creditsCost,
      metadata: metadata || {}
    })

  if (creditsCost > 0) {
    // Increment usage counter for current subscription period
    void supabase.rpc('increment_credits_used', { p_user_id: userId, p_amount: creditsCost })
  }
}
