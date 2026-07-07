import { randomUUID } from "crypto"

export interface TraceContext {
  traceId: string
  proposalId?: string
  projectId?: string
}

export function generateTraceId(): string {
  try {
    return randomUUID()
  } catch {
    // Fallback if crypto.uuid is not available
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }
}
