import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as jose from 'jose'
import crypto from 'crypto'

const secretSource = process.env.AGENTHELM_JWT_SECRET || process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!secretSource && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('FATAL: ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY or AGENTHELM_JWT_SECRET is required but not set.');
}
const JWT_SECRET = new TextEncoder().encode(secretSource || 'temporary-build-secret-key-for-nextjs-build-phase')

export interface AuthSuccess {
  userId: string
  plan: string
  supabaseAdmin: SupabaseClient
  agentId?: string
  projectId?: string
  keyId?: string
  scope?: string
}

export interface AuthError {
  error: string
  status: number
}

export type AuthResult = AuthSuccess | AuthError

export interface AuthorizedAgent extends AuthSuccess {
  agent: {
    id: string
    user_id: string
    project_id: string | null
  }
}

export type AuthorizedAgentResult = AuthorizedAgent | AuthError

export function hasError(result: AuthResult): result is AuthError {
  return 'error' in result
}

/**
 * Authorize an SDK request against the exact agent it is acting on.
 */
export async function authorizeSdkAgent(
  keyOrToken: string | null,
  agentId: string | null | undefined
): Promise<AuthorizedAgentResult> {
  const auth = await validateConnectKey(keyOrToken)
  if (hasError(auth)) return auth

  if (!agentId) {
    return { error: 'Missing agent ID', status: 400 }
  }

  if (auth.agentId && auth.agentId !== agentId) {
    return { error: 'Mismatched agent token', status: 403 }
  }

  const { data: agent, error } = await auth.supabaseAdmin
    .from('agents')
    .select('id, user_id, project_id')
    .eq('id', agentId)
    .eq('user_id', auth.userId)
    .single()

  if (error || !agent) {
    return { error: 'Agent not found or unauthorized', status: 403 }
  }

  return { ...auth, agent }
}

/** Ensure a supplied task belongs to an already-authorized agent. */
export async function authorizeSdkTask(
  auth: AuthorizedAgent,
  taskId: string | null | undefined
): Promise<AuthError | { id: string }> {
  if (!taskId) {
    return { error: 'Missing task ID', status: 400 }
  }

  const { data: task, error } = await auth.supabaseAdmin
    .from('agent_tasks')
    .select('id')
    .eq('id', taskId)
    .eq('agent_id', auth.agent.id)
    .eq('user_id', auth.userId)
    .single()

  if (error || !task) {
    return { error: 'Task not found or unauthorized', status: 403 }
  }

  return task
}

export async function issueAgentToken(userId: string, agentId: string, plan: string) {
  const jti = crypto.randomUUID()
  const jwt = await new jose.SignJWT({ userId, plan, agentId })
    .setProtectedHeader({ alg: 'HS256', kid: 'agenthelm-v1' })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime('1h')
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
      plan: (payload.plan as string) || 'free',
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
  if (!key.startsWith('ahe_') && !key.startsWith('agd_') && !key.startsWith('ak_')) {
    return { error: 'Invalid connect key format', status: 401 }
  }

  // Bypass for local testing ONLY in development/test mode
  if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && process.env.TEST_MODE === 'true' && key === 'ahe_live_testkey12345') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
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
    // 1. Hash incoming key with SHA-256 and look up in api_keys table
    const keyHash = crypto.createHash('sha256').update(key).digest('hex')

    const { data: apiKeyRecord, error: apiKeyError } = await supabaseAdmin
      .from('api_keys')
      .select('id, user_id, scope, agent_id, project_id, expires_at, revoked_at')
      .eq('key_hash', keyHash)
      .is('revoked_at', null)
      .single()

    if (!apiKeyError && apiKeyRecord) {
      if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at).getTime() < Date.now()) {
        return { error: 'API key has expired', status: 401 }
      }

      // Fire-and-forget update of last_used_at
      void supabaseAdmin
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKeyRecord.id)

      // Fetch user profile plan
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('plan')
        .eq('id', apiKeyRecord.user_id)
        .single()

      return {
        userId: apiKeyRecord.user_id,
        plan: profile?.plan || 'free',
        agentId: apiKeyRecord.agent_id || undefined,
        projectId: apiKeyRecord.project_id || undefined,
        keyId: apiKeyRecord.id,
        scope: apiKeyRecord.scope,
        supabaseAdmin
      }
    }

    // 2. Legacy Dual-Auth fallback during transition period: check profiles.connect_key
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
      plan: profile.plan || 'free',
      supabaseAdmin
    }
  } catch (err: unknown) {
    console.error('validateConnectKey error:', err instanceof Error ? err.message : String(err))
    return { error: 'Internal server error validating key', status: 500 }
  }
}
