import { NextResponse } from "next/server"
export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"

async function callNvidia(prompt: string, fast = false): Promise<{ text: string; tokens: number }> {
  const model = fast
    ? 'meta/llama-3.1-8b-instruct'
    : 'meta/llama-3.3-70b-instruct'

  const res = await fetch(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI agent analyst. Be concise and helpful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1024,
        temperature: 0.7,
        stream: false,
      }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.detail || data.message || 'NVIDIA API error')
  }

  const text = data.choices?.[0]?.message?.content || ''
  const tokens = data.usage?.total_tokens || 0
  return { text, tokens }
}

type ExplainBody = { agent_id: string; log_id: string }

function isExplainBody(x: unknown): x is ExplainBody {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  return typeof o.agent_id === "string" && typeof o.log_id === "string"
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData.user) {
      return NextResponse.json({ error: "unauthorized", message: "Unauthorized" }, { status: 401 })
    }

    const raw: unknown = await req.json()
    if (!isExplainBody(raw)) {
      return NextResponse.json({ error: "bad_request", message: "Invalid body" }, { status: 400 })
    }

    const { agent_id, log_id } = raw
    const userId = authData.user.id

    // 1) Verify user owns agent_id
    const { data: agent, error: agentErr } = await supabase
      .from("agents")
      .select("id")
      .eq("id", agent_id)
      .eq("user_id", userId)
      .single()

    if (agentErr) {
      return NextResponse.json({ error: "server_error", message: "Failed to verify agent" }, { status: 500 })
    }
    if (!agent) {
      return NextResponse.json({ error: "forbidden", message: "Agent not found or unauthorized" }, { status: 403 })
    }

    // 2) Check user plan
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single()

    if (profileErr) {
      return NextResponse.json({ error: "server_error", message: "Failed to load plan" }, { status: 500 })
    }

    const plan = (profile?.plan ?? "free") as string
    if (plan === "free") {
      return NextResponse.json(
        { error: "upgrade_required", message: "Upgrade to Indie to use AI Analysis" },
        { status: 402 }
      )
    }

    // 3) Fetch the error log by log_id (and agent_id for safety)
    const { data: errorLog, error: errorLogErr } = await supabase
      .from("agent_logs")
      .select("id,agent_id,level,message,created_at")
      .eq("id", log_id)
      .eq("agent_id", agent_id)
      .single()

    if (errorLogErr || !errorLog) {
      return NextResponse.json({ error: "not_found", message: "Log not found" }, { status: 404 })
    }

    // 4) Fetch 20 logs before it
    const { data: recentLogs, error: recentErr } = await supabase
      .from("agent_logs")
      .select("level,message,created_at")
      .eq("agent_id", agent_id)
      .lt("created_at", errorLog.created_at)
      .order("created_at", { ascending: false })
      .limit(20)

    if (recentErr) {
      return NextResponse.json({ error: "server_error", message: "Failed to load context logs" }, { status: 500 })
    }

    // 5) Reverse so oldest first
    const context = (recentLogs ?? []).slice().reverse()

    // 6) Call Gemini Flash
    const prompt = `
You are debugging an AI agent failure.

Recent logs leading up to the error (oldest first):
${context
  .map((l) => `[${String(l.level ?? "info").toUpperCase()}] ${String(l.message ?? "")}`)
  .join("\n")}

The error that occurred:
[ERROR] ${String(errorLog.message ?? "")}

In exactly 3 short sentences explain:
1. What went wrong
2. Why it happened
3. How to fix it

Be specific and actionable.
Write like you are texting a developer friend.
No markdown. No bullet points. Plain text only.
`.trim()

    let explanation: string
    try {
      const { text } = await callNvidia(prompt, false) // fast=false for Llama-3.3-70b
      explanation = text
    } catch (e) {
      explanation =
        "Could not analyze this error automatically. Check the log message for details."
    }

    // 7) Return
    return NextResponse.json({ explanation })
  } catch (e) {
    return NextResponse.json({ error: "server_error", message: "Internal Server Error" }, { status: 500 })
  }
}

