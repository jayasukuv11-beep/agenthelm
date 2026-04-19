import { createClient } from '@supabase/supabase-js'
import * as jose from 'jose'

const secretSource = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!secretSource) {
  throw new Error(
    'FATAL: ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY must be set. ' +
    'Server cannot start without a JWT signing secret.'
  )
}
const JWT_SECRET = new TextEncoder().encode(secretSource)

export async function issueAgentToken(userId: string, agentId: string, plan: string) {
  // Issue a short-lived (12 hour) token for this specific agent
  const jwt = await new jose.SignJWT({ userId, plan, agentId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(JWT_SECRET)
  
  return jwt
}

export async function validateAgentToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    return {
      userId: payload.userId as string,
      agentId: payload.agentId as string,
      plan: payload.plan as string,
      supabaseAdmin: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    }
  } catch (err) {
    return { error: 'Invalid or expired agent token', status: 401 }
  }
}


export async function validateConnectKey(keyOrToken: string | null) {
  if (!keyOrToken) {
    return { error: 'Missing authentication key', status: 401 }
  }

  // If it's a JWT, validate it first (Handshake Protocol)
  if (keyOrToken.split('.').length === 3) {
    return validateAgentToken(keyOrToken)
  }

  const key = keyOrToken
  if (!key.startsWith('ahe_') && !key.startsWith('agd_')) {
    return { error: 'Invalid connect key format', status: 401 }
  }

  // Bypass for local testing ONLY in development mode
  if (process.env.NODE_ENV === 'development' && process.env.TEST_MODE === 'true' && key === 'ahe_live_testkey12345') {
    return {
      userId: '00000000-0000-0000-0000-000000000000',
      plan: 'studio',
      supabaseAdmin: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    }
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
  } catch (err: unknown) {
    console.error('validateConnectKey error:', err instanceof Error ? err.message : String(err))
    return { error: 'Internal server error validating key', status: 500 }
  }
}
