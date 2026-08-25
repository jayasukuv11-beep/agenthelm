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
  // Lazily roll over an expired billing period before reading it
  try {
    await supabase.rpc('reset_expired_periods', { p_user_id: userId })
  } catch {
    // Non-fatal: fall through to a plain read
  }

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

/** Monthly credit balance granted when a user lands on (or upgrades to) a plan. */
export function planCreditGrant(planId: string): number {
  switch (planId) {
    case 'pro':
      return 2000
    case 'team':
      return 10000
    default:
      return 100
  }
}

/** Human-readable plan name for Cashfree order notes. */
export function planName(planId: string): string {
  return DEFAULT_PLANS[planId]?.name || 'AgentHelm Pro (Monthly)'
}

/**
 * Single source of truth for granting paid access. Called by BOTH Cashfree
 * webhooks and /api/payment/verify — idempotent, safe to run multiple times
 * for the same payment.
 *
 * Writes:
 *  1. user_subscriptions  — read by getPlanForUser (quota + plan gating)
 *  2. profiles            — plan mirror, credit balance, token limit (SDK auth)
 *  3. subscriptions       — legacy audit trail (order_id keyed)
 */
export async function provisionPaidPlan(
  supabase: SupabaseClient<any>,
  userId: string,
  rawPlan: string,
  orderId?: string
): Promise<{ error: string | null }> {
  const canonicalPlan = normalizePlanId(rawPlan)
  if (canonicalPlan === 'free') {
    return { error: `Cannot provision free/unknown plan: ${rawPlan}` }
  }

  const nowIso = new Date().toISOString()
  const periodEndIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Source of truth for access checks
  const { error: usError } = await supabase
    .from('user_subscriptions')
    .upsert(
      {
        user_id: userId,
        plan_id: canonicalPlan,
        status: 'active',
        current_period_start: nowIso,
        current_period_end: periodEndIso,
        credits_used_this_period: 0,
        credits_reset_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' }
    )
  if (usError) return { error: `user_subscriptions upsert: ${usError.message}` }

  // 2. Profile mirror + credit grant (deduct_credit spends from profiles.credits)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      plan: canonicalPlan,
      credits: planCreditGrant(canonicalPlan),
      tokens_limit_monthly:
        canonicalPlan === 'team' ? 1000000 : canonicalPlan === 'pro' ? 300000 : 100000,
      updated_at: nowIso,
    })
    .eq('id', userId)
  if (profileError) return { error: `profiles update: ${profileError.message}` }

  // 3. Legacy audit trail
  if (orderId) {
    const { error: subError } = await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        plan: rawPlan,
        status: 'active',
        order_id: orderId,
        activated_at: nowIso,
        expires_at: periodEndIso,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' }
    )
    if (subError) return { error: `subscriptions upsert: ${subError.message}` }
  }

  return { error: null }
}

/**
 * Canonical plan ids across the whole stack: free | pro | team.
 * Legacy marketing ids (indie/studio) from old orders/UI are mapped here so
 * webhook payloads, order ids and URLs can use either form safely.
 */
export function normalizePlanId(plan: string | null | undefined): 'free' | 'pro' | 'team' {
  switch ((plan || '').toLowerCase()) {
    case 'pro':
    case 'indie':
      return 'pro'
    case 'team':
    case 'studio':
      return 'team'
    default:
      return 'free'
  }
}

export function isPaidPlan(plan: string | null | undefined): boolean {
  return normalizePlanId(plan) !== 'free'
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
