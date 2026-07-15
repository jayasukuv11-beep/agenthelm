import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as jose from 'jose'

const secretSource = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!secretSource && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('FATAL: ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY is required but not set.');
}
const JWT_SECRET = new TextEncoder().encode(secretSource || 'temporary-build-secret-key-for-nextjs-build-phase')

export interface AuthSuccess {
  userId: string
  plan: string
  supabaseAdmin: SupabaseClient
  agentId?: string
}

export interface AuthError {
  error: string
  status: number
}

export type AuthResult = AuthSuccess | AuthError

export function hasError(result: AuthResult): result is AuthError {
  return 'error' in result
}

export async function issueAgentToken(userId: string, agentId: string, plan: string) {
  const jwt = await new jose.SignJWT({ userId, plan, agentId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(JWT_SECRET)

  return jwt
}

export async function validateAgentToken(token: string): Promise<AuthResult> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if ((!supabaseUrl || !supabaseKey) && process.env.NEXT_PHASE !== 'phase-production-build') {
      throw new Error('FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required but not set.');
    }
    return {
      userId: payload.userId as string,
      agentId: payload.agentId as string,
      plan: payload.plan as string,
      supabaseAdmin: createClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseKey || 'placeholder',
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    }
  } catch (err) {
    return { error: 'Invalid or expired agent token', status: 401 }
  }
}


export async function validateConnectKey(keyOrToken: string | null): Promise<AuthResult> {
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if ((!supabaseUrl || !supabaseKey) && process.env.NEXT_PHASE !== 'phase-production-build') {
      throw new Error('FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required but not set.');
    }
    return {
      userId: '00000000-0000-0000-0000-000000000000',
      plan: 'studio',
      supabaseAdmin: createClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseKey || 'placeholder',
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    }
  }

  // Using service role key for SDK API routes bypassing RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if ((!supabaseUrl || !supabaseKey) && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required but not set.');
  }

  const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder',
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
      supabaseAdmin
    }
  } catch (err: unknown) {
    console.error('validateConnectKey error:', err instanceof Error ? err.message : String(err))
    return { error: 'Internal server error validating key', status: 500 }
  }
}