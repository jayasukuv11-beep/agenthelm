import { NextResponse } from "next/server"
export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"

type Body = { agent_id: string; message: string }

function isBody(x: unknown): x is Body {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  return typeof o.agent_id === "string" && typeof o.message === "string"
}

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session

    if (!session && process.env.TEST_MODE !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Parse and validate body
    const raw: unknown = await request.json()
    if (!isBody(raw)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { agent_id, message } = raw

    if (!agent_id) {
      return NextResponse.json({ error: "agent_id is required" }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    const trimmed = message.trim()
    if (trimmed.length === 0) {
      return NextResponse.json({ error: "message cannot be empty" }, { status: 400 })
    }
    if (trimmed.length > 1000) {
      return NextResponse.json({ error: "message too long (max 1000 chars)" }, { status: 400 })
    }

    // 3. Verify user owns this agent
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, name, status, last_ping, user_id")
      .eq("id", agent_id)
      .eq("user_id", session?.user.id ?? "test-user")
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    // 4. Save user message
    const { error: insertError } = await supabase.from("agent_chats").insert({
      agent_id,
      user_id: session?.user.id ?? "test-user",
      role: "user",
      content: trimmed,
      source: "dashboard",
    })

    if (insertError) {
      console.error("Failed to save message:", insertError)
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
    }

    // 5. Create command for SDK to receive
    await supabase.from("agent_commands").insert({
      agent_id,
      command_type: "chat",
      payload: { message: trimmed },
      status: "pending",
    })

    // 6. Online detection: last_ping within 60s
    const lastPingTime = agent.last_ping ? new Date(agent.last_ping).getTime() : 0
    const isOnline = Date.now() - lastPingTime < 60_000

    if (isOnline) {
      return NextResponse.json({
        status: "sent",
        message: `Message sent to ${agent.name}`,
      })
    }

    // 7. Agent offline — Gemini auto-reply
    let autoReply = `${agent.name} is currently offline. Your message has been queued and the agent will receive it when restarted.`

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai")
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

      const result = await model.generateContent(`
An AI agent called "${agent.name}" is offline.
The user sent: "${trimmed}"

Write a helpful 1-2 sentence reply that:
1. Acknowledges the agent is currently offline
2. Confirms their message was queued
3. Tells them to restart the agent to process it

Sound natural and helpful.
No markdown. Plain text only.
Maximum 30 words.
`.trim())

      autoReply = result.response.text()
    } catch (geminiError) {
      console.error("Gemini error:", geminiError)
    }

    // 8. Save auto-reply
    await supabase.from("agent_chats").insert({
      agent_id,
      user_id: session?.user.id ?? "test-user",
      role: "agent",
      content: autoReply,
      source: "dashboard",
    })

    return NextResponse.json({
      status: "auto_replied",
      message: "Agent is offline, auto-replied",
      reply: autoReply,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

