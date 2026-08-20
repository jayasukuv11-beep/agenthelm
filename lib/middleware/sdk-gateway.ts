import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { validateConnectKey, authorizeSdkAgent, hasError } from '../sdk-auth'
import { checkRateLimit } from '../rate-limit'
import { resolveProject } from '../project-resolver'

export interface SdkGatewayOptions<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  schema?: TSchema
  requireAgentId?: boolean
  requireProjectId?: boolean
  isWrite?: boolean
}

export interface AuthorizedContext<TBody = any> {
  userId: string
  agentId?: string
  projectId?: string
  plan: string
  supabase: SupabaseClient
  body: TBody
  agent?: { id: string; user_id: string; project_id: string | null }
  project?: { id: string; user_id: string; brain_version: number; [key: string]: any }
}

const ALLOWED_ORIGINS = [
  'https://agenthelm.online',
  'https://www.agenthelm.online',
  'https://agenthelm.vercel.app'
]

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
    (process.env.NODE_ENV === 'development' && (origin.includes('localhost') || origin.includes('127.0.0.1')))

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://agenthelm.online',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin'
  }
}

export function handleSdkOptions(req: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req)
  })
}

export function withSdkAuth<TSchema extends z.ZodTypeAny = z.ZodTypeAny>(
  options: SdkGatewayOptions<TSchema>,
  handler: (ctx: AuthorizedContext<z.infer<TSchema>>, req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    const corsHeaders = getCorsHeaders(req)

    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
      // 1. Extract Bearer token (reject query parameter key)
      const authHeader = req.headers.get('authorization')
      let token: string | null = null
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim()
      } else if (req.headers.get('x-agent-token')) {
        token = req.headers.get('x-agent-token')!.trim()
      } else if (req.headers.get('x-connect-key')) {
        token = req.headers.get('x-connect-key')!.trim()
      }

      if (!token) {
        return NextResponse.json(
          { error: 'Missing or invalid Authorization header' },
          { status: 401, headers: corsHeaders }
        )
      }

      // 2. Rate Limiting via Redis (60/min for writes, 120/min for reads)
      const limit = options.isWrite ? 60 : 120
      const isAllowedRate = await checkRateLimit(token, limit, 60)
      if (!isAllowedRate) {
        return NextResponse.json(
          { error: `Rate limit exceeded (${limit} requests per minute)` },
          { status: 429, headers: corsHeaders }
        )
      }

      // 3. Authenticate Key
      const auth = await validateConnectKey(token)
      if (hasError(auth)) {
        return NextResponse.json(
          { error: auth.error },
          { status: auth.status, headers: corsHeaders }
        )
      }

      const { userId, plan, supabaseAdmin } = auth

      // 4. Parse & Validate Body
      let rawBody: any = {}
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        try {
          rawBody = await req.json()
        } catch {
          rawBody = {}
        }
      }

      let parsedBody = rawBody
      if (options.schema) {
        const parseResult = options.schema.safeParse(rawBody)
        if (!parseResult.success) {
          return NextResponse.json(
            {
              error: 'Invalid request body',
              details: parseResult.error.format()
            },
            { status: 400, headers: corsHeaders }
          )
        }
        parsedBody = parseResult.data
      }

      // 5. Enforce Agent ID verification if requested
      const requestAgentId = parsedBody?.agent_id || auth.agentId
      let agentRecord: any = undefined

      if (options.requireAgentId) {
        if (!requestAgentId) {
          return NextResponse.json(
            { error: 'agent_id is required' },
            { status: 400, headers: corsHeaders }
          )
        }

        const agentAuth = await authorizeSdkAgent(token, requestAgentId)
        if (hasError(agentAuth)) {
          return NextResponse.json(
            { error: agentAuth.error },
            { status: agentAuth.status, headers: corsHeaders }
          )
        }
        agentRecord = agentAuth.agent
      }

      // 6. Enforce Project ID verification if requested
      const requestProject = parsedBody?.project_id || parsedBody?.project || auth.projectId
      let projectRecord: any = undefined

      if (options.requireProjectId) {
        if (!requestProject) {
          return NextResponse.json(
            { error: 'project or project_id is required' },
            { status: 400, headers: corsHeaders }
          )
        }

        const { data: proj, error: projErr } = await resolveProject(supabaseAdmin, requestProject)
        if (projErr || !proj) {
          return NextResponse.json(
            { error: 'Project not found or unauthorized' },
            { status: 404, headers: corsHeaders }
          )
        }

        // Verify user ownership of project
        if (proj.user_id && proj.user_id !== userId) {
          return NextResponse.json(
            { error: 'Project unauthorized for this user' },
            { status: 403, headers: corsHeaders }
          )
        }
        projectRecord = proj
      }

      // 7. Invoke Handler with AuthorizedContext
      const ctx: AuthorizedContext<z.infer<TSchema>> = {
        userId,
        agentId: requestAgentId,
        projectId: projectRecord?.id || (typeof requestProject === 'string' ? requestProject : undefined),
        plan,
        supabase: supabaseAdmin,
        body: parsedBody,
        agent: agentRecord,
        project: projectRecord
      }

      const response = await handler(ctx, req)

      // Attach CORS headers to response
      Object.entries(corsHeaders).forEach(([k, v]) => {
        response.headers.set(k, v)
      })

      return response
    } catch (err: any) {
      console.error('Unhandled SDK gateway error:', err)
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500, headers: corsHeaders }
      )
    }
  }
}
