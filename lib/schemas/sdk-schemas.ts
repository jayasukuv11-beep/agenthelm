import { z } from 'zod'

// Shared sub-schemas
export const jsonRecordSchema = z.record(z.string(), z.any())

// 1. Log Schema
export const logSchema = z.object({
  key: z.string().optional(),
  agent_id: z.string().uuid(),
  type: z.string().default('log'),
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  message: z.string().max(2000).optional().default(''),
  data: z.any().optional(),
  tokens_used: z.number().int().min(0).default(0),
  model: z.string().optional(),
  cost_usd: z.number().min(0).optional(),
  event_id: z.union([z.string(), z.number()]).optional(),
})

// 2. Memory Schema
export const memorySchema = z.object({
  agent_id: z.string().uuid(),
  key: z.string().min(1).max(255),
  value: z.any(),
  ttl_seconds: z.number().int().positive().optional(),
})

// 3. Output Schema
export const outputSchema = z.object({
  agent_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  output: z.record(z.string(), z.any()),
  format: z.string().optional(),
})

// 4. State Schema
export const stateSchema = z.object({
  agent_id: z.string().uuid(),
  state: z.record(z.string(), z.any()),
  version: z.number().int().min(0).optional(),
})

// 5. Checkpoint Schema
export const checkpointSchema = z.object({
  agent_id: z.string().uuid(),
  checkpoint_id: z.string().optional(),
  step: z.number().int().min(0),
  state: z.record(z.string(), z.any()),
  state_hash: z.string().optional(),
  description: z.string().optional(),
})

// 6. Tasks Schemas
export const tasksSchema = z.object({
  agent_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  input: z.record(z.string(), z.any()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  outcome_fee_usd: z.number().min(0).optional(),
  source: z.string().optional(),
})

export const taskClaimSchema = z.object({
  agent_id: z.string().uuid(),
  task_id: z.string().uuid(),
  lock_duration_seconds: z.number().int().positive().optional(),
})

export const taskCompleteSchema = z.object({
  agent_id: z.string().uuid(),
  task_id: z.string().uuid(),
  result: z.record(z.string(), z.any()),
  error: z.string().optional(),
})

// 7. Presence Claim Schema
export const presenceClaimSchema = z.object({
  agent_id: z.string().uuid(),
  status: z.enum(['online', 'idle', 'offline', 'busy']).default('online'),
  current_task_id: z.string().uuid().optional(),
  heartbeat_interval_seconds: z.number().int().positive().optional(),
})

// 8. Interventions Schema
export const interventionsSchema = z.object({
  agent_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  intervention_type: z.string().min(1),
  reason: z.string().min(1),
  state_diff: z.record(z.string(), z.any()).optional(),
})

// 9. Execution Schema
export const executionSchema = z.object({
  agent_id: z.string().uuid(),
  tool_name: z.string().min(1),
  input: z.any().optional(),
  output: z.any().optional(),
  duration_ms: z.number().int().min(0).optional(),
  error: z.string().optional(),
  tokens_used: z.number().int().min(0).optional(),
})

// 10. Traces Schema
export const tracesSchema = z.object({
  agent_id: z.string().uuid(),
  trace_id: z.string().optional(),
  span_name: z.string().min(1),
  parent_span_id: z.string().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  events: z.array(z.record(z.string(), z.any())).optional(),
})

// 11. Timeline Batch Schema
export const timelineBatchSchema = z.object({
  agent_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  events: z.array(z.object({
    event_type: z.string().min(1),
    title: z.string().min(1),
    details: z.record(z.string(), z.any()).optional(),
    created_at: z.string().datetime().optional(),
  })).min(1).max(100),
})

// 12. Inject Schema (get_context)
export const injectSchema = z.object({
  project: z.string().min(1),
  agent_id: z.string().uuid().optional(),
  task_hint: z.string().optional(),
  trusted_only: z.boolean().default(true),
  max_context_tokens: z.number().int().min(100).max(32000).default(3000),
})

// 13. Proposals Schema (propose_knowledge)
export const proposalSchema = z.object({
  project_id: z.string().min(1),
  agent_id: z.string().uuid(),
  summary: z.string().min(5).max(1000),
  decisions: z.array(z.string()).default([]),
  files_modified: z.array(z.string()).default([]),
  apis_affected: z.array(z.any()).default([]),
  db_changes: z.array(z.any()).default([]),
  commit_sha: z.string().optional(),
  branch: z.string().optional(),
  tests_passed: z.boolean().optional(),
  human_reviewed: z.boolean().optional(),
})

// 14. Injection query / read
export const injectionSchema = z.object({
  project_id: z.string().min(1),
  agent_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
})

// 15. Replay Schema
export const replaySchema = z.object({
  agent_id: z.string().uuid(),
  checkpoint_id: z.string().uuid().optional(),
  from_step: z.number().int().min(0).optional(),
  to_step: z.number().int().min(0).optional(),
})

// 16. Contracts Schema
export const contractsSchema = z.object({
  project_id: z.string().min(1),
  contract_type: z.string().optional(),
})

// 17. Evals Schemas
export const evalsFromTraceSchema = z.object({
  agent_id: z.string().uuid(),
  trace_id: z.string().min(1),
  rubric: z.string().optional(),
})

export const evalsJudgeSchema = z.object({
  agent_id: z.string().uuid(),
  eval_id: z.string().uuid().optional(),
  criteria: z.record(z.string(), z.any()),
})

export const evalsRegressionSchema = z.object({
  agent_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  test_suite_id: z.string().optional(),
})

export const evalsResultsSchema = z.object({
  agent_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
})

// 18. Handoff Schema
export const handoffSchema = z.object({
  from_agent_id: z.string().uuid(),
  to_agent_id: z.string().uuid().optional(),
  context_summary: z.string().min(1),
  artifacts: z.record(z.string(), z.any()).optional(),
})

// 19. Reasoning Schema
export const reasoningSchema = z.object({
  agent_id: z.string().uuid(),
  step_index: z.number().int().min(0),
  thought: z.string().min(1),
  action: z.string().optional(),
  observation: z.string().optional(),
  context_used: z.array(z.string()).optional(),
})

// 20. Command Schema
export const commandSchema = z.object({
  agent_id: z.string().uuid(),
  command: z.string().min(1),
  args: z.record(z.string(), z.any()).optional(),
})
