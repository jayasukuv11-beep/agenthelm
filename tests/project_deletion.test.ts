import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"

// ─── Mock next/cache (revalidatePath) ──────────────────────────────────
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}))

// ─── Mock the Supabase Server Client ───────────────────────────────────
const mockDelete = vi.fn()
const mockSelect = vi.fn()
const mockFrom = vi.fn()
const mockGetUser = vi.fn()

vi.mock("../app/lib/supabase", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser
    },
    from: mockFrom
  }))
}))

// ─── Import After Mocks Are Registered ─────────────────────────────────
import { deleteProject } from "../app/actions/project"

describe("Project Deletion Server Action", () => {
  const OWNER_ID = "user-owner-abc"
  const OTHER_USER_ID = "user-other-xyz"
  const PROJECT_ID = "proj-test-123"
  const PROJECT_NAME = "Demo Project (AgentHelm Platform)"

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: authenticated owner
    mockGetUser.mockResolvedValue({
      data: { user: { id: OWNER_ID } },
      error: null
    })
  })

  // ── Helper to set up from() chain ──────────────────────────────────
  function setupFromChain(options: {
    selectProject?: { data: any; error: any },
    deleteResult?: { error: any }
  }) {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(
                options.selectProject ?? { data: null, error: { message: 'Not found' } }
              )
            })
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue(
                options.deleteResult ?? { error: null }
              )
            })
          })
        }
      }
      return {}
    })
  }

  // ─────────────────────────────────────────────────────────────────────
  // 1. Happy path: Owner deletes their own project
  // ─────────────────────────────────────────────────────────────────────
  it("successfully deletes a project owned by the authenticated user", async () => {
    setupFromChain({
      selectProject: {
        data: { id: PROJECT_ID, user_id: OWNER_ID, name: PROJECT_NAME },
        error: null
      },
      deleteResult: { error: null }
    })

    const result = await deleteProject(PROJECT_ID)

    expect(result.success).toBe(true)
    expect(result.error).toBeUndefined()
  })

  // ─────────────────────────────────────────────────────────────────────
  // 2. Rejects unauthenticated requests
  // ─────────────────────────────────────────────────────────────────────
  it("rejects deletion when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    const result = await deleteProject(PROJECT_ID)

    expect(result.success).toBe(false)
    expect(result.error).toContain("Unauthorized")
  })

  // ─────────────────────────────────────────────────────────────────────
  // 3. Cross-user ownership isolation: User B cannot delete User A's project
  // ─────────────────────────────────────────────────────────────────────
  it("rejects deletion when the project belongs to a different user (cross-tenant isolation)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: OTHER_USER_ID } },
      error: null
    })

    setupFromChain({
      selectProject: {
        data: { id: PROJECT_ID, user_id: OWNER_ID, name: PROJECT_NAME },
        error: null
      }
    })

    const result = await deleteProject(PROJECT_ID)

    expect(result.success).toBe(false)
    expect(result.error).toContain("do not own")
  })

  // ─────────────────────────────────────────────────────────────────────
  // 4. Rejects invalid project IDs
  // ─────────────────────────────────────────────────────────────────────
  it("rejects deletion with invalid project ID", async () => {
    const result = await deleteProject("")

    expect(result.success).toBe(false)
    expect(result.error).toContain("Invalid project ID")
  })

  // ─────────────────────────────────────────────────────────────────────
  // 5. Handles non-existent project gracefully
  // ─────────────────────────────────────────────────────────────────────
  it("returns error when project does not exist", async () => {
    setupFromChain({
      selectProject: {
        data: null,
        error: { message: "Row not found" }
      }
    })

    const result = await deleteProject("non-existent-id")

    expect(result.success).toBe(false)
    expect(result.error).toContain("not found")
  })

  // ─────────────────────────────────────────────────────────────────────
  // 6. Handles database deletion failure gracefully
  // ─────────────────────────────────────────────────────────────────────
  it("handles database deletion error gracefully", async () => {
    setupFromChain({
      selectProject: {
        data: { id: PROJECT_ID, user_id: OWNER_ID, name: PROJECT_NAME },
        error: null
      },
      deleteResult: {
        error: { message: "Foreign key constraint violation" }
      }
    })

    const result = await deleteProject(PROJECT_ID)

    expect(result.success).toBe(false)
    expect(result.error).toContain("Deletion failed")
  })

  // ─────────────────────────────────────────────────────────────────────
  // 7. UI fallback: success signal allows UI to remove from local state
  // ─────────────────────────────────────────────────────────────────────
  it("returns success:true which signals the UI to remove the project from local state", async () => {
    setupFromChain({
      selectProject: {
        data: { id: PROJECT_ID, user_id: OWNER_ID, name: PROJECT_NAME },
        error: null
      },
      deleteResult: { error: null }
    })

    const result = await deleteProject(PROJECT_ID)

    expect(result.success).toBe(true)
  })
})

// ─── Real Database Integration Tests (Optional / Run if credentials present) ───
import { createClient as createRealSupabaseClient } from "@supabase/supabase-js"
import fs from "fs"

describe("Project Deletion Schema Cascading (Real DB)", () => {
  let realSupabase: any
  let userId: string
  let testProjectId: string
  let testAgentId: string
  let testTaskId: string

  beforeAll(async () => {
    // Read credentials from .env.local
    let url = ""
    let key = ""
    try {
      const content = fs.readFileSync(".env.local", "utf8")
      const lines = content.split("\n")
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const match = trimmed.match(/^([^=]+)=(.*)$/)
        if (match) {
          const k = match[1].trim()
          const v = match[2].trim()
          if (k === "NEXT_PUBLIC_SUPABASE_URL") url = v
          if (k === "SUPABASE_SERVICE_ROLE_KEY") key = v
        }
      }
    } catch {
      // Bypassed if no local config
    }

    if (url && key) {
      realSupabase = createRealSupabaseClient(url, key, { auth: { persistSession: false } })
      const { data: profile } = await realSupabase.from("profiles").select("id").limit(1).maybeSingle()
      if (profile) {
        userId = profile.id
      }
    }
  })

  it("cascades deletion down to agents, tasks, logs, credit usages, and handoffs", async () => {
    if (!realSupabase || !userId) {
      console.warn("⚠️ Skipping Project Deletion Integration Test: Missing Supabase credentials or profiles.")
      return
    }

    // 1. Create a dummy project
    const { data: project, error: pErr } = await realSupabase.from("projects").insert({
      name: "Temp Cascade Test Project",
      user_id: userId
    }).select().single()
    expect(pErr).toBeNull()
    testProjectId = project.id

    // 2. Create a dummy agent linked to the project
    const { data: agent, error: aErr } = await realSupabase.from("agents").insert({
      name: "Temp Cascade Agent",
      user_id: userId,
      project_id: testProjectId,
      status: "idle"
    }).select().single()
    expect(aErr).toBeNull()
    testAgentId = agent.id

    // 3. Create a dummy task
    const { data: task, error: tErr } = await realSupabase.from("agent_tasks").insert({
      agent_id: testAgentId,
      user_id: userId,
      title: "Temp Cascade Task",
      status: "pending"
    }).select().single()
    expect(tErr).toBeNull()
    testTaskId = task.id

    // 4. Create dummy agent logs
    const { error: logErr } = await realSupabase.from("agent_logs").insert({
      agent_id: testAgentId,
      message: "Temp cascade log message",
      type: "log",
      level: "info"
    })
    expect(logErr).toBeNull()

    // 5. Create dummy credit usage
    const { error: creditErr } = await realSupabase.from("credit_usage").insert({
      user_id: userId,
      agent_id: testAgentId,
      tokens_used: 100,
      cost_usd: 0.001
    })
    expect(creditErr).toBeNull()

    // 6. Create dummy handoff
    const { error: handoffErr } = await realSupabase.from("agent_handoffs").insert({
      from_agent_id: testAgentId,
      to_agent_id: testAgentId,
      task_id: testTaskId,
      status: "pending"
    })
    expect(handoffErr).toBeNull()

    // 7. Delete the project
    const { error: delErr } = await realSupabase.from("projects").delete().eq("id", testProjectId)
    expect(delErr).toBeNull()

    // 8. Assertions: check all child records are deleted
    const [projCheck, agentCheck, taskCheck, logCheck, creditCheck, handoffCheck] = await Promise.all([
      realSupabase.from("projects").select("id").eq("id", testProjectId).maybeSingle(),
      realSupabase.from("agents").select("id").eq("id", testAgentId).maybeSingle(),
      realSupabase.from("agent_tasks").select("id").eq("id", testTaskId).maybeSingle(),
      realSupabase.from("agent_logs").select("id").eq("agent_id", testAgentId),
      realSupabase.from("credit_usage").select("id").eq("agent_id", testAgentId),
      realSupabase.from("agent_handoffs").select("id").eq("task_id", testTaskId)
    ])

    // Verify everything was cascade deleted (conforms to zero rows)
    expect(projCheck.data).toBeNull()
    expect(agentCheck.data).toBeNull()
    expect(taskCheck.data).toBeNull()
    expect(logCheck.data?.length).toBe(0)
    expect(creditCheck.data?.length).toBe(0)
    expect(handoffCheck.data?.length).toBe(0)
  })
})
