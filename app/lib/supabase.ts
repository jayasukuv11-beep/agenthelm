import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if ((!supabaseUrl || !supabaseAnonKey) && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error("FATAL: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required but not set.");
  }

  return createServerClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map((cookie) => {
            let value = cookie.value
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1)
            }
            return {
              name: cookie.name,
              value,
            }
          })
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// For Route Handlers / API routes
export const createRouteHandlerClient = async () => {
  return createClient()
}
