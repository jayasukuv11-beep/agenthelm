import { createClient } from '@supabase/supabase-js'

export async function validateConnectKey(key: string | null) {
  if (!key) {
    return { error: 'Missing connect key', status: 401 }
  }

  // Using service role key for SDK API routes bypassing RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, plan')
      .eq('connect_key', key)
      .single()

    if (error || !profile) {
      return { error: 'Invalid connect key', status: 401 }
    }

    return { 
      userId: profile.id, 
      plan: profile.plan,
      supabaseAdmin // Need to return this or instances to share the connection
    }
  } catch (err: any) {
    console.error('validateConnectKey error:', err.message)
    return { error: 'Internal server error validating key', status: 500 }
  }
}
