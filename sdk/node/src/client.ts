import { OfflineQueue } from './queue'

const DEFAULT_BASE_URL = 'https://agenthelm.online/api/sdk'

// ─── TYPES ────────────────────────────────────────────

export interface AgentHelmOptions {
  key: string
  name?: string
  agentType?: 'python' | 'node' | 'other'
  version?: string
  baseUrl?: string
  autoPing?: boolean
  pingInterval?: number
  commandPollInterval?: number
  verbose?: boolean
  timeout?: number
  burnRateThreshold?: number
}

export interface TrackTokensOptions {
  used: number
  model: string
  costPer1k?: number
  promptTokens?: number
  completionTokens?: number
}

export type LogLevel = 'info' | 'warning' | 'error' | 'success'
export type CommandHandler = (payload: Record<string, unknown>) => void | Promise<void>
export type ChatHandler = (message: string) => void | Promise<void>

export interface CheckpointOptions {
  stepIndex?: number
  inputData?: Record<string, unknown>
  outputData?: Record<string, unknown>
  status?: 'running' | 'completed' | 'failed' | 'skipped'
}

interface Command {
  id: string
  command_type: string
  payload: Record<string, unknown>
  status: string
}

// ─── CLIENT ───────────────────────────────────────────

export class AgentHelm {
  private readonly key: string
  private readonly _name: string
  private readonly agentType: string
  private readonly version: string
  private readonly baseUrl: string
  private readonly verbose: boolean
  private readonly timeoutMs: number
  private readonly pingInterval: number
  private readonly commandPollInterval: number

  private _agentId: string | null = null
  private _agentToken: string | null = null
  private _connected = false
  private _running = true
  private _tokensToday = 0
  private _tokensSession = 0

  private commandHandlers = new Map<string, CommandHandler>()
  private chatHandler: ChatHandler | null = null
  private queue = new OfflineQueue()

  private pingTimer: ReturnType<typeof setInterval> | null = null
  private commandTimer: ReturnType<typeof setInterval> | null = null
  private flushTimer: ReturnType<typeof setInterval> | null = null

  // Checkpoint state
  private _currentTaskId: string | null = null
  private _stepCounter = 0
  private _lastCheckpointState: Record<string, unknown> | null = null
  private _stepStartTime: number | null = null
  // Burn-rate monitoring
  private _tokenWindow: { timestamp: number; used: number }[] = []
  private _burnRateThreshold: number
  private _burnRateAlerted = false

  constructor(options: AgentHelmOptions) {
    const {
      key,
      name = 'Node Agent',
      agentType = 'node',
      version = '1.0.0',
      baseUrl = DEFAULT_BASE_URL,
      autoPing = true,
      pingInterval = 30000,
      commandPollInterval = 5000,
      verbose = true,
      timeout = 5000,
      burnRateThreshold = 10000,
    } = options

    this._burnRateThreshold = burnRateThreshold

    if (!key || !key.startsWith('ahe_')) {
      throw new Error(
        'Invalid AgentHelm key. ' +
        'Keys must start with "ahe_". ' +
        'Get your key at agenthelm.online/dashboard/settings'
      )
    }

    this.key = key
    this._name = name
    this.agentType = agentType
    this.version = version
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.verbose = verbose
    this.timeoutMs = timeout
    this.pingInterval = pingInterval
    this.commandPollInterval = commandPollInterval

    // Register on startup
    this.register()

    // Start background intervals
    if (autoPing) {
      this.pingTimer = setInterval(
        () => this.sendPing(),
        this.pingInterval
      )
    }

    this.commandTimer = setInterval(
      () => this.pollCommands(),
      this.commandPollInterval
    )

    this.flushTimer = setInterval(
      () => this.flushQueue(),
      10000
    )
  }

  // ─── PUBLIC API ─────────────────────────────────────

  /**
   * Send a log message to AgentHelm dashboard.
   * @param message - The log message
   * @param level - Log level: info | warning | error | success
   * @param data - Optional structured data
   */
  log(
    message: string,
    level: LogLevel = 'info',
    data?: Record<string, unknown>
  ): void {
    this.send('/log', {
      key: this.getAuthKey(),
      agent_id: this._agentId,
      type: 'log',
      level,
      message: String(message),
      data: data ?? null,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Send structured output/results to dashboard.
   * @param data - Results object (must be JSON-serializable)
   * @param label - Optional label for this output
   */
  output(
    data: Record<string, unknown>,
    label = 'output'
  ): void {
    this.send('/output', {
      key: this.getAuthKey(),
      agent_id: this._agentId,
      type: 'output',
      level: 'success',
      message: `[${label}] ${JSON.stringify(data)}`,
      data,
      label,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Report an error to AgentHelm dashboard.
   * Automatically updates agent status to "error".
   * @param message - Error description
   * @param error - Optional Error object
   */
  error(message: string, error?: Error): void {
    const errorData: Record<string, unknown> = { message }

    if (error) {
      errorData.exception_type = error.constructor.name
      errorData.exception_message = error.message
      errorData.stack = error.stack
    }

    this.send('/log', {
      key: this.getAuthKey(),
      agent_id: this._agentId,
      type: 'log',
      level: 'error',
      message: String(message),
      data: errorData,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Send a warning message to AgentHelm dashboard.
   * @param message - The warning message
   */
  warn(message: string): void {
    this.log(message, 'warning')
  }

  /**
   * Send a success message to AgentHelm dashboard.
   * @param message - The success message
   */
  success(message: string): void {
    this.log(message, 'success')
  }

  /**
   * Report progress of a long-running task.
   * @param percent - Progress percentage (0-100)
   * @param message - Progress description
   */
  progress(percent: number, message: string): void {
    this.log(`[${percent}%] ${message}`, 'info', { percent, message })
  }

  /**
   * Save a checkpoint at the current step for resumability.
   * Call between each tool/chain step to enable resume on crash.
   * @param stepName - Human-readable label for this step
   * @param state - Serializable state object at this step
   * @param options - Optional step_index, input/output data, status
   */
  checkpoint(
    stepName: string,
    state: Record<string, unknown>,
    options: CheckpointOptions = {}
  ): void {
    const {
      stepIndex,
      inputData,
      outputData,
      status = 'completed',
    } = options

    const idx = stepIndex ?? this._stepCounter
    this._stepCounter = idx + 1

    // Calculate latency since last checkpoint
    let latencyMs: number | null = null
    if (this._stepStartTime !== null) {
      latencyMs = Math.round(Date.now() - this._stepStartTime)
    }
    this._stepStartTime = Date.now()

    // Delta encoding: step 0 = full snapshot, step 1+ = delta only
    let stateDelta: Record<string, unknown> | null = null
    let sendSnapshot: Record<string, unknown> | null = state
    if (idx > 0 && this._lastCheckpointState !== null) {
      stateDelta = this.computeDelta(this._lastCheckpointState, state)
      sendSnapshot = null // Don't send full snapshot for deltas
    }

    this._lastCheckpointState = state

    const payload: Record<string, unknown> = {
      key: this.getAuthKey(),
      agent_id: this._agentId,
      task_id: this._currentTaskId,
      step_index: idx,
      step_name: stepName,
      status,
      state_snapshot: sendSnapshot,
      state_delta: stateDelta,
      input_data: inputData ?? null,
      output_data: outputData ?? null,
      latency_ms: latencyMs,
    }

    if (status === 'failed') {
      payload.error_data = outputData ?? null
    }

    this.send('/checkpoint', payload)

    // Phase 4: Check for user interventions (stop, pause, override)
    this.processInterventions().catch((err) => {
      if (this.verbose) {
        console.error('[AgentHelm] \u26A0\uFE0F Failed to check interventions:', err)
      }
    })

    if (this.verbose) {
      console.log(
        `[AgentHelm] \uD83D\uDCCC Checkpoint: ${stepName} (step ${idx})`
      )
    }
  }

  /**
   * Resume a failed task from the last successful checkpoint.
   * Returns the state snapshot at that checkpoint, or null.
   * @param taskId - The task UUID to resume
   * @param stepIndex - Specific step to resume from (defaults to last successful)
   */
  async resumeFrom(
    taskId: string,
    stepIndex?: number
  ): Promise<Record<string, unknown> | null> {
    try {
      let url =
        `${this.baseUrl}/checkpoint` +
        `?key=${encodeURIComponent(this.getAuthKey())}` +
        `&task_id=${encodeURIComponent(taskId)}`

      if (stepIndex !== undefined) {
        url += `&step_index=${stepIndex}`
      }

      const res = await this.fetchGet(url)

      if (res.ok) {
        const data = await res.json() as {
          checkpoint?: {
            step_index: number
            step_name: string
            state_snapshot: Record<string, unknown>
          }
          has_checkpoint: boolean
        }

        if (data.checkpoint) {
          this._currentTaskId = taskId
          this._stepCounter = data.checkpoint.step_index + 1
          this._stepStartTime = Date.now()
          this._lastCheckpointState = data.checkpoint.state_snapshot

          if (this.verbose) {
            console.log(
              `[AgentHelm] \uD83D\uDD04 Resuming from: ` +
              `${data.checkpoint.step_name} (step ${data.checkpoint.step_index})`
            )
          }

          return data.checkpoint.state_snapshot
        }

        if (this.verbose) {
          console.log(
            `[AgentHelm] \u26A0\uFE0F No checkpoint found for task ${taskId.slice(0, 8)}...`
          )
        }
        return null
      }

      return null
    } catch {
      if (this.verbose) {
        console.log('[AgentHelm] \u26A0\uFE0F Failed to resume from checkpoint')
      }
      return null
    }
  }

  /**
   * Register a handler for dispatched tasks from the dashboard/Telegram.
   * @param handler - Function called with task name and data object
   */
  onDispatch(
    handler: (task: string, data: Record<string, unknown>) => unknown
  ): this {
    this.onCommand('dispatch', async (payload) => {
      const task = String(payload.task ?? '')
      const result = await handler(task, payload)
      if (result) {
        this.output(result as Record<string, unknown>, 'dispatch_result')
      }
    })
    return this
  }

  /**
   * Track token usage for credits dashboard.
   * @param options - Token tracking options
   */
  trackTokens(options: TrackTokensOptions): void {
    const {
      used,
      model,
      costPer1k = 0,
      promptTokens,
      completionTokens,
    } = options

    const costUsd = parseFloat(
      ((used / 1000) * costPer1k).toFixed(8)
    )

    this._tokensToday += used
    this._tokensSession += used

    this.send('/log', {
      key: this.getAuthKey(),
      agent_id: this._agentId,
      type: 'tokens',
      level: 'info',
      message: `Token usage: ${used.toLocaleString()} tokens (${model})`,
      tokens_used: used,
      model,
      cost_usd: costUsd,
      data: {
        prompt_tokens: promptTokens ?? null,
        completion_tokens: completionTokens ?? null,
        total_tokens: used,
        model,
        cost_usd: costUsd,
      },
      timestamp: new Date().toISOString(),
    })

    // Burn-rate monitoring: sliding 60-second window
    const now = Date.now()
    this._tokenWindow.push({ timestamp: now, used })
    this._tokenWindow = this._tokenWindow.filter(
      (item) => now - item.timestamp < 60000
    )

    const tokensPerMinute = this._tokenWindow.reduce(
      (sum, item) => sum + item.used,
      0
    )

    if (
      tokensPerMinute > this._burnRateThreshold &&
      !this._burnRateAlerted
    ) {
      this._burnRateAlerted = true
      this.warn(
        `\uD83D\uDD25 Token burn rate: ${tokensPerMinute.toLocaleString()}/min ` +
          `exceeds threshold (${this._burnRateThreshold.toLocaleString()}/min)`
      )

      // Send a special burn_rate log for Telegram alerts
      this.send('/log', {
        key: this.getAuthKey(),
        agent_id: this._agentId,
        type: 'burn_rate',
        level: 'warning',
        message: `Token burn rate: ${tokensPerMinute.toLocaleString()}/min`,
        data: {
          tokens_per_minute: tokensPerMinute,
          threshold: this._burnRateThreshold,
          window_seconds: 60,
          model,
        },
        timestamp: new Date().toISOString(),
      })
    } else if (tokensPerMinute <= this._burnRateThreshold) {
      this._burnRateAlerted = false
    }
  }

  /**
   * Send a reply back to a dashboard/Telegram chat message.
   * Call this inside onChat handlers.
   * @param message - The reply message
   */
  reply(message: string): void {
    this.send('/log', {
      key: this.getAuthKey(),
      agent_id: this._agentId,
      type: 'chat_reply',
      level: 'info',
      message: String(message),
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Register a handler for dashboard commands.
   * @param commandType - Command name to listen for
   * @param handler - Function to call when command received
   */
  onCommand(
    commandType: string,
    handler: CommandHandler
  ): this {
    this.commandHandlers.set(commandType, handler)
    return this
  }

  /**
   * Register a handler for chat messages.
   * Use reply() to respond.
   * @param handler - Function called with message string
   */
  onChat(handler: ChatHandler): this {
    this.chatHandler = handler
    return this
  }

  /**
   * Gracefully stop the agent and notify dashboard.
   */
  stop(): void {
    this._running = false

    // Clear all intervals
    if (this.pingTimer) clearInterval(this.pingTimer)
    if (this.commandTimer) clearInterval(this.commandTimer)
    if (this.flushTimer) clearInterval(this.flushTimer)

    // Notify dashboard
    this.send('/ping', {
      key: this.getAuthKey(),
      agent_id: this._agentId,
      status: 'stopped',
      timestamp: new Date().toISOString(),
    })

    if (this.verbose) {
      console.log(`[AgentHelm] ⏹  ${this._name} stopped`)
    }
  }

  /**
   * Keep process alive listening for commands.
   * Resolves when stop() is called.
   */
  listen(): Promise<void> {
    if (this.verbose) {
      console.log(
        `[AgentHelm] 👂 ${this._name} listening for commands...`
      )
    }

    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!this._running) {
          clearInterval(check)
          resolve()
        }
      }, 1000)
    })
  }

  // ─── GETTERS ────────────────────────────────────────

  get agentId(): string | null {
    return this._agentId
  }

  get isConnected(): boolean {
    return this._connected
  }

  get name(): string {
    return this._name
  }

  get tokensToday(): number {
    return this._tokensToday
  }

  get tokensSession(): number {
    return this._tokensSession
  }

  // ─── PRIVATE METHODS ────────────────────────────────
  
  private getAuthKey(): string {
    return this._agentToken ?? this.key
  }

  private async register(): Promise<void> {
    try {
      const res = await this.fetch('/ping', {
        key: this.key,
        name: this._name,
        agent_type: this.agentType,
        version: this.version,
        status: 'running',
        started_at: new Date().toISOString(),
      })

      if (res.ok) {
        const data = await res.json() as {
          agent_id?: string
          user_id?: string
          agent_token?: string
        }
        this._agentId = data.agent_id ?? null
        this._agentToken = data.agent_token ?? null
        this._connected = true

        if (this.verbose) {
          const short = this._agentId
            ? this._agentId.slice(0, 8) + '...'
            : 'unknown'
          console.log(
            `[AgentHelm] ✅ Connected: ${this._name} (${short})`
          )
        }
      } else if (res.status === 401) {
        console.error(
          '[AgentHelm] ❌ Invalid key. ' +
          'Check agenthelm.dev/dashboard/settings'
        )
      } else {
        throw new Error(`HTTP ${res.status}`)
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.log(
          `[AgentHelm] ⚠️  Offline mode — will retry...`
        )
      } else {
        console.log(
          `[AgentHelm] ⚠️  Connection failed: ${String(err)}`
        )
      }
    }
  }

  private send(
    endpoint: string,
    payload: Record<string, unknown>
  ): void {
    this.fetch(endpoint, payload).catch(() => {
      this.queue.push(endpoint, payload)
    })
  }

  private async fetch(
    endpoint: string,
    payload: Record<string, unknown>
  ): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(
      () => controller.abort(),
      this.timeoutMs
    )

    try {
      const res = await globalThis.fetch(
        `${this.baseUrl}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      )
      return res
    } finally {
      clearTimeout(timer)
    }
  }

  private async fetchGet(url: string): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(
      () => controller.abort(),
      this.timeoutMs
    )

    try {
      const res = await globalThis.fetch(url, {
        signal: controller.signal,
      })
      return res
    } finally {
      clearTimeout(timer)
    }
  }

  private sendPing(): void {
    this.fetch('/ping', {
      key: this.getAuthKey(),
      agent_id: this._agentId,
      status: 'running',
      timestamp: new Date().toISOString(),
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json() as { agent_token?: string }
        if (data.agent_token) {
          this._agentToken = data.agent_token
        }
      }
    }).catch(() => {})
  }

  private async pollCommands(): Promise<void> {
    if (!this._agentId) return

    try {
      const url =
        `${this.baseUrl}/command` +
        `?key=${encodeURIComponent(this.getAuthKey())}` +
        `&agent_id=${encodeURIComponent(this._agentId)}`

      const res = await this.fetchGet(url)

      if (res.ok) {
        const data = await res.json() as {
          commands?: Command[]
        }
        const commands = data.commands ?? []

        for (const cmd of commands) {
          await this.handleCommand(cmd)
        }
      }
    } catch {
      // Silently fail — network issues are normal
    }
  }

  private async handleCommand(cmd: Command): Promise<void> {
    const { command_type, payload = {} } = cmd

    try {
      if (command_type === 'chat') {
        if (this.chatHandler) {
          const message = String(
            (payload as { message?: string }).message ?? ''
          )
          await this.chatHandler(message)
        }
      } else {
        const handler = this.commandHandlers.get(command_type)
        if (handler) {
          await handler(payload)
        }
      }
    } catch (err) {
      console.error(
        `[AgentHelm] ❌ Command handler error for "${command_type}":`,
        err
      )
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.queue.isEmpty) return

    const item = this.queue.pop()
    if (!item) return

    try {
      await this.fetch(item.endpoint, item.payload)
    } catch {
      // Put back at front if still failing
      this.queue.push(item.endpoint, item.payload)
    }
  }

  /**
   * Compute what changed between two state snapshots.
   * Returns a dict of {key: {op, value}} operations.
   */
  private computeDelta(
    previous: Record<string, unknown>,
    current: Record<string, unknown>
  ): Record<string, unknown> {
    const delta: Record<string, unknown> = {}
    const allKeys = Array.from(new Set(
      Object.keys(previous).concat(Object.keys(current))
    ))

    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i]
      if (!(key in previous)) {
        delta[key] = { op: 'add', value: current[key] }
      } else if (!(key in current)) {
        delta[key] = { op: 'remove' }
      } else if (
        JSON.stringify(previous[key]) !== JSON.stringify(current[key])
      ) {
        delta[key] = { op: 'replace', value: current[key] }
      }
    }

    return delta
  }

  /**
   * Check for and apply user interventions (stop, pause, override, etc.).
   * Should be called at checkpoint boundaries.
   */
  private async processInterventions(): Promise<void> {
    if (!this._currentTaskId) return

    try {
      if (!this._agentId) return

      const url =
        `${this.baseUrl}/interventions` +
        `?key=${encodeURIComponent(this.getAuthKey())}` +
        `&agent_id=${encodeURIComponent(this._agentId)}` +
        `&task_id=${encodeURIComponent(this._currentTaskId)}`

      const res = await this.fetchGet(url)
      if (!res.ok) return

      const data = (await res.json()) as {
        interventions: {
          id: string
          type: 'stop' | 'pause' | 'resume' | 'rollback' | 'state_override'
          payload: Record<string, unknown>
        }[]
      }

      const interventions = data.interventions || []
      if (interventions.length === 0) return

      const appliedIds: string[] = []

      for (const intervention of interventions) {
        if (this.verbose) {
          console.log(
            `[AgentHelm] \uD83D\uDEA8 Intervention detected: ${intervention.type}`
          )
        }

        if (intervention.type === 'stop') {
          this.stop()
          throw new Error('Agent stopped by user intervention')
        }

        if (intervention.type === 'state_override') {
          if (this._lastCheckpointState) {
            Object.assign(this._lastCheckpointState, intervention.payload)
            if (this.verbose) {
              console.log(
                `[AgentHelm] \uD83D\uDCDD State override applied: ${Object.keys(
                  intervention.payload
                ).join(', ')}`
              )
            }
          }
        }

        if (intervention.type === 'pause') {
          if (this.verbose) {
            console.log(
              '[AgentHelm] \u23F8 Agent paused by user. Waiting for resume...'
            )
          }

          // Polling for resume
          let resumed = false
          while (!resumed) {
            await new Promise((resolve) => setTimeout(resolve, 5000))
            const checkRes = await this.fetchGet(url)
            if (checkRes.ok) {
              const checkData = (await checkRes.json()) as any
              const pending = checkData.interventions || []
              const resumeInt = pending.find((p: any) => p.type === 'resume')
              if (resumeInt) {
                appliedIds.push(resumeInt.id)
                resumed = true
                if (this.verbose) {
                  console.log('[AgentHelm] \u25B6\uFE0F Agent resumed')
                }
              }
            }
          }
        }

        appliedIds.push(intervention.id)
      }

      if (appliedIds.length > 0) {
        await this.fetchPatch('/interventions', { ids: appliedIds })
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Agent stopped by user intervention') {
        throw err
      }
      throw err
    }
  }

  /**
   * Helper for PATCH requests.
   */
  private async fetchPatch(
    endpoint: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const url = `${this.baseUrl}${endpoint}?key=${encodeURIComponent(
      this.getAuthKey()
    )}`
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }
}

// ─── FACTORY FUNCTION ─────────────────────────────────

/**
 * One-line shortcut to connect an agent to AgentHelm.
 *
 * @example
 * import { connect } from 'agenthelm-sdk'
 * const dock = connect({ key: 'ahe_live_xxxxx', name: 'My Agent' })
 */
export function connect(options: AgentHelmOptions): AgentHelm {
  return new AgentHelm(options)
}
