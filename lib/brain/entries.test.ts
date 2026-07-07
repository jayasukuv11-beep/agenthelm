import { describe, it, expect } from "vitest"
import { proposalEntries } from "./entries"
import { KnowledgeProposal } from "./types"

describe("proposalEntries", () => {
  it("returns empty array for proposal with no content", () => {
    const proposal: KnowledgeProposal = {
      id: "p1",
      project_id: "proj1",
      build_status: "pending"
    }

    const entries = proposalEntries(proposal)
    expect(entries).toHaveLength(0)
  })

  it("extracts decision entries", () => {
    const proposal: KnowledgeProposal = {
      id: "p1",
      project_id: "proj1",
      build_status: "pending",
      decisions: [
        { title: "Choose Postgres", reason: "reliability" },
        { title: "Use Next.js", reason: "SSR" }
      ]
    }

    const entries = proposalEntries(proposal)
    expect(entries).toHaveLength(2)
    expect(entries[0].category).toBe("decisions")
    expect(entries[0].title).toBe("Choose Postgres")
    expect(entries[0].content).toEqual({ title: "Choose Postgres", reason: "reliability" })
  })

  it("extracts API entries", () => {
    const proposal: KnowledgeProposal = {
      id: "p1",
      project_id: "proj1",
      build_status: "pending",
      apis_affected: [
        { endpoint: "POST /api/v1/users", method: "POST" },
        { endpoint: "GET /api/v1/health", method: "GET" }
      ]
    }

    const entries = proposalEntries(proposal)
    expect(entries).toHaveLength(2)
    expect(entries[0].category).toBe("apis")
    expect(entries[0].title).toBe("POST /api/v1/users")
  })

  it("extracts database entries", () => {
    const proposal: KnowledgeProposal = {
      id: "p1",
      project_id: "proj1",
      build_status: "pending",
      db_changes: [
        { table: "users", change: "add_column", column: "email_verified" }
      ]
    }

    const entries = proposalEntries(proposal)
    expect(entries).toHaveLength(1)
    expect(entries[0].category).toBe("database")
    expect(entries[0].title).toBe("users")
  })

  it("uses default titles when fields are missing", () => {
    const proposal: KnowledgeProposal = {
      id: "p1",
      project_id: "proj1",
      build_status: "pending",
      decisions: [{}],
      apis_affected: [{}],
      db_changes: [{}]
    }

    const entries = proposalEntries(proposal)
    expect(entries).toHaveLength(3)
    expect(entries[0].title).toBe("Architectural Decision")
    expect(entries[1].title).toBe("API Modification")
    expect(entries[2].title).toBe("Database Schema Change")
  })

  it("coerces non-string titles to strings", () => {
    const proposal: KnowledgeProposal = {
      id: "p1",
      project_id: "proj1",
      build_status: "pending",
      decisions: [{ title: 123, reason: "numeric" }]
    }

    const entries = proposalEntries(proposal)
    expect(entries[0].title).toBe("123")
  })

  it("combines entries from multiple categories", () => {
    const proposal: KnowledgeProposal = {
      id: "p1",
      project_id: "proj1",
      build_status: "pending",
      decisions: [{ title: "Decision A" }],
      apis_affected: [{ endpoint: "/api/a" }],
      db_changes: [{ table: "t1" }]
    }

    const entries = proposalEntries(proposal)
    expect(entries).toHaveLength(3)
    expect(entries[0].category).toBe("decisions")
    expect(entries[1].category).toBe("apis")
    expect(entries[2].category).toBe("database")
  })
})
