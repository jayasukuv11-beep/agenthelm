import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | undefined

/** Server-only Supabase client using the service-role key. */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for server-side database access.'
    )
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return adminClient
}

/**
 * Lazy export for module-scoped consumers. Runtime credentials are not read
 * during static builds, while all service-role client construction stays here.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getSupabaseAdmin()
    const value = Reflect.get(client, property)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
