"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentHelm = void 0;
exports.connect = connect;
const queue_1 = require("./queue");
const DEFAULT_BASE_URL = 'https://agenthelm.online/api/sdk';
// ─── CLIENT ───────────────────────────────────────────
class AgentHelm {
    constructor(options) {
        this._agentId = null;
        this._agentToken = null;
        this._connected = false;
        this._running = true;
        this._tokensToday = 0;
        this._tokensSession = 0;
        this.commandHandlers = new Map();
        this.chatHandler = null;
        this.queue = new queue_1.OfflineQueue();
        this.pingTimer = null;
        this.commandTimer = null;
        this.flushTimer = null;
        // Checkpoint state
        this._currentTaskId = null;
        this._stepCounter = 0;
        this._lastCheckpointState = null;
        this._stepStartTime = null;
        // Burn-rate monitoring
        this._tokenWindow = [];
        this._burnRateAlerted = false;
        this.dispatchHandler = null;
        const { key, name = 'Node Agent', agentType = 'node', version = '1.0.0', baseUrl = DEFAULT_BASE_URL, autoPing = true, pingInterval = 30000, commandPollInterval = 5000, verbose = true, timeout = 5000, burnRateThreshold = 10000, } = options;
        this._burnRateThreshold = burnRateThreshold;
        if (!key || !key.startsWith('ahe_')) {
            throw new Error('Invalid AgentHelm key. ' +
                'Keys must start with "ahe_". ' +
                'Get your key at agenthelm.online/dashboard/settings');
        }
        this.key = key;
        this._name = name;
        this.agentType = agentType;
        this.version = version;
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.verbose = verbose;
        this.timeoutMs = timeout;
        this.pingInterval = pingInterval;
        this.commandPollInterval = commandPollInterval;
        // Register on startup
        this.register();
        // Start background intervals
        if (autoPing) {
            this.pingTimer = setInterval(() => this.sendPing(), this.pingInterval);
        }
        this.commandTimer = setInterval(() => this.pollCommands(), this.commandPollInterval);
        this.flushTimer = setInterval(() => this.flushQueue(), 10000);
    }
    // ─── PUBLIC API ─────────────────────────────────────
    /**
     * Send a log message to AgentHelm dashboard.
     * @param message - The log message
     * @param level - Log level: info | warning | error | success
     * @param data - Optional structured data
     */
    log(message, level = 'info', data) {
        this.send('/log', {
            key: this.getAuthKey(),
            agent_id: this._agentId,
            type: 'log',
            level,
            message: String(message),
            data: data ?? null,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Send structured output/results to dashboard.
     * @param data - Results object (must be JSON-serializable)
     * @param label - Optional label for this output
     */
    output(data, label = 'output') {
        this.send('/output', {
            key: this.getAuthKey(),
            agent_id: this._agentId,
            type: 'output',
            level: 'success',
            message: `[${label}] ${JSON.stringify(data)}`,
            data,
            label,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Report an error to AgentHelm dashboard.
     * Automatically updates agent status to "error".
     * @param message - Error description
     * @param error - Optional Error object
     */
    error(message, error) {
        const errorData = { message };
        if (error) {
            errorData.exception_type = error.constructor.name;
            errorData.exception_message = error.message;
            errorData.stack = error.stack;
        }
        this.send('/log', {
            key: this.getAuthKey(),
            agent_id: this._agentId,
            type: 'log',
            level: 'error',
            message: String(message),
            data: errorData,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Send a warning message to AgentHelm dashboard.
     * @param message - The warning message
     */
    warn(message) {
        this.log(message, 'warning');
    }
    /**
     * Send a success message to AgentHelm dashboard.
     * @param message - The success message
     */
    success(message) {
        this.log(message, 'success');
    }
    /**
     * Report progress of a long-running task.
     * @param percent - Progress percentage (0-100)
     * @param message - Progress description
     */
    progress(percent, message) {
        this.log(`[${percent}%] ${message}`, 'info', { percent, message });
    }
    /**
     * Save a checkpoint at the current step for resumability.
     * Call between each tool/chain step to enable resume on crash.
     * @param stepName - Human-readable label for this step
     * @param state - Serializable state object at this step
     * @param options - Optional step_index, input/output data, status
     */
    checkpoint(stepName, state, options = {}) {
        const { stepIndex, inputData, outputData, status = 'completed', } = options;
        const idx = stepIndex ?? this._stepCounter;
        this._stepCounter = idx + 1;
        // Calculate latency since last checkpoint
        let latencyMs = null;
        if (this._stepStartTime !== null) {
            latencyMs = Math.round(Date.now() - this._stepStartTime);
        }
        this._stepStartTime = Date.now();
        // Delta encoding: step 0 = full snapshot, step 1+ = delta only
        let stateDelta = null;
        let sendSnapshot = state;
        if (idx > 0 && this._lastCheckpointState !== null) {
            stateDelta = this.computeDelta(this._lastCheckpointState, state);
            sendSnapshot = null; // Don't send full snapshot for deltas
        }
        this._lastCheckpointState = state;
        const payload = {
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
        };
        if (status === 'failed') {
            payload.error_data = outputData ?? null;
        }
        this.send('/checkpoint', payload);
        // Phase 4: Check for user interventions (stop, pause, override)
        this.processInterventions().catch((err) => {
            if (this.verbose) {
                console.error('[AgentHelm] \u26A0\uFE0F Failed to check interventions:', err);
            }
        });
        if (this.verbose) {
            console.log(`[AgentHelm] \uD83D\uDCCC Checkpoint: ${stepName} (step ${idx})`);
        }
    }
    /**
     * Resume a failed task from the last successful checkpoint.
     * Returns the state snapshot at that checkpoint, or null.
     * @param taskId - The task UUID to resume
     * @param checkpointId - Specific checkpoint UUID to resume from
     * @param stepIndex - Specific step to resume from (defaults to last successful)
     */
    async resumeFrom(taskId, checkpointId, stepIndex) {
        try {
            let url = `${this.baseUrl}/checkpoint` +
                `?key=${encodeURIComponent(this.getAuthKey())}` +
                `&task_id=${encodeURIComponent(taskId)}`;
            if (checkpointId !== undefined) {
                url += `&checkpoint_id=${encodeURIComponent(checkpointId)}`;
            }
            if (stepIndex !== undefined) {
                url += `&step_index=${stepIndex}`;
            }
            const res = await this.fetchGet(url);
            if (res.ok) {
                const data = await res.json();
                if (data.checkpoint) {
                    this._currentTaskId = taskId;
                    this._stepCounter = data.checkpoint.step_index + 1;
                    this._stepStartTime = Date.now();
                    this._lastCheckpointState = data.checkpoint.state_snapshot;
                    if (this.verbose) {
                        console.log(`[AgentHelm] \uD83D\uDD04 Resuming from: ` +
                            `${data.checkpoint.step_name} (step ${data.checkpoint.step_index})`);
                    }
                    return data.checkpoint.state_snapshot;
                }
                if (this.verbose) {
                    console.log(`[AgentHelm] \u26A0\uFE0F No checkpoint found for task ${taskId.slice(0, 8)}...`);
                }
                return null;
            }
            return null;
        }
        catch {
            if (this.verbose) {
                console.log('[AgentHelm] \u26A0\uFE0F Failed to resume from checkpoint');
            }
            return null;
        }
    }
    /**
     * Register a handler for dispatched tasks from the dashboard/Telegram.
     * @param handler - Function called with task name and data object
     */
    onDispatch(handler) {
        this.dispatchHandler = handler;
        this.onCommand('dispatch', async (payload) => {
            await this.runDispatchSafe(String(payload.task ?? ''), payload);
        });
        this.onCommand('custom', async (payload) => {
            if (payload.action === 'resume') {
                const taskId = payload.task_id;
                const checkpointId = payload.checkpoint_id;
                const taskDescription = (payload.task_description ?? 'Resumed Task');
                await this.resumeFrom(taskId, checkpointId);
                await this.runDispatchSafe(taskDescription, payload, true);
            }
        });
        return this;
    }
    async runDispatchSafe(task, data, isResume = false) {
        if (!this.dispatchHandler)
            return;
        try {
            if (!isResume) {
                this._stepCounter = 0;
                this._stepStartTime = Date.now();
                this._lastCheckpointState = null;
            }
            this.progress(0, `${isResume ? 'Resuming' : 'Starting'} task: ${task}`);
            const result = await this.dispatchHandler(task, data);
            if (result) {
                this.output(result, 'dispatch_result');
            }
        }
        catch (err) {
            if (this.verbose) {
                console.error('[AgentHelm] \u274C Task failed:', err);
            }
            this.error(`Task failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    /**
     * Track token usage for credits dashboard.
     * @param options - Token tracking options
     */
    trackTokens(options) {
        const { used, model, costPer1k = 0, promptTokens, completionTokens, } = options;
        const costUsd = parseFloat(((used / 1000) * costPer1k).toFixed(8));
        this._tokensToday += used;
        this._tokensSession += used;
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
        });
        // Burn-rate monitoring: sliding 60-second window
        const now = Date.now();
        this._tokenWindow.push({ timestamp: now, used });
        this._tokenWindow = this._tokenWindow.filter((item) => now - item.timestamp < 60000);
        const tokensPerMinute = this._tokenWindow.reduce((sum, item) => sum + item.used, 0);
        if (tokensPerMinute > this._burnRateThreshold &&
            !this._burnRateAlerted) {
            this._burnRateAlerted = true;
            this.warn(`\uD83D\uDD25 Token burn rate: ${tokensPerMinute.toLocaleString()}/min ` +
                `exceeds threshold (${this._burnRateThreshold.toLocaleString()}/min)`);
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
            });
        }
        else if (tokensPerMinute <= this._burnRateThreshold) {
            this._burnRateAlerted = false;
        }
    }
    /**
     * Send a reply back to a dashboard/Telegram chat message.
     * Call this inside onChat handlers.
     * @param message - The reply message
     */
    reply(message) {
        this.send('/log', {
            key: this.getAuthKey(),
            agent_id: this._agentId,
            type: 'chat_reply',
            level: 'info',
            message: String(message),
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Register a handler for dashboard commands.
     * @param commandType - Command name to listen for
     * @param handler - Function to call when command received
     */
    onCommand(commandType, handler) {
        this.commandHandlers.set(commandType, handler);
        return this;
    }
    /**
     * Register a handler for chat messages.
     * Use reply() to respond.
     * @param handler - Function called with message string
     */
    onChat(handler) {
        this.chatHandler = handler;
        return this;
    }
    /**
     * Safety Gate: Read-only action (Always safe, no gating)
     */
    async read(task) {
        return Promise.resolve(task());
    }
    /**
     * Safety Gate: Side Effect (Logs and retries, but non-blocking)
     */
    async sideEffect(task, options = {}) {
        const { maxRetries = 3 } = options;
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await task();
                this.log(`[SIDE_EFFECT] Task executed (attempt ${attempt})`, 'success');
                return result;
            }
            catch (err) {
                lastError = err;
                if (this.verbose) {
                    console.warn(`[AgentHelm] \u26A1 SIDE_EFFECT failed (attempt ${attempt}/${maxRetries}): ${err}`);
                }
                if (attempt < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, Math.min(Math.pow(2, attempt) * 1000, 10000)));
                }
            }
        }
        this.warn(`Side-effect failed after ${maxRetries} retries.`);
        throw lastError;
    }
    /**
     * Safety Gate: Irreversible (BLOCKS until approved by Human via Telegram/Dashboard)
     */
    async irreversible(task, options = {}) {
        const { confirm = 'telegram', timeout = 60000 } = options;
        const toolName = task.name || 'anonymous_irreversible_task';
        if (this.verbose) {
            console.log(`[AgentHelm] \uD83D\uDED1 IRREVERSIBLE: ${toolName} \u2014 requesting human approval (${confirm})...`);
        }
        // Notify the gateway (Intervention needed)
        this.log(`[IRREVERSIBLE] Action '${toolName}' pending approval via ${confirm}`, 'warning');
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (!this._running)
                return null;
            try {
                const url = `${this.baseUrl}/execution` +
                    `?key=${encodeURIComponent(this.getAuthKey())}` +
                    `&agent_id=${encodeURIComponent(this._agentId || '')}` +
                    `&tool_name=${encodeURIComponent(toolName)}`;
                const res = await this.fetchGet(url);
                if (res.ok) {
                    const data = (await res.json());
                    if (data.status === 'approved') {
                        if (this.verbose) {
                            console.log(`[AgentHelm] \u2705 APPROVED: ${toolName} \u2014 executing`);
                        }
                        return await task();
                    }
                    else if (data.status === 'rejected') {
                        if (this.verbose) {
                            console.log(`[AgentHelm] \u274C REJECTED: ${toolName} \u2014 skipped`);
                        }
                        return null;
                    }
                }
            }
            catch {
                // Silently retry polling
            }
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
        this.warn(`Irreversible action '${toolName}' auto-rejected after ${timeout / 1000}s timeout.`);
        return null;
    }
    /**
     * Gracefully stop the agent and notify dashboard.
     */
    stop() {
        this._running = false;
        // Clear all intervals
        if (this.pingTimer)
            clearInterval(this.pingTimer);
        if (this.commandTimer)
            clearInterval(this.commandTimer);
        if (this.flushTimer)
            clearInterval(this.flushTimer);
        // Notify dashboard
        this.send('/ping', {
            key: this.getAuthKey(),
            agent_id: this._agentId,
            status: 'stopped',
            timestamp: new Date().toISOString(),
        });
        if (this.verbose) {
            console.log(`[AgentHelm] ⏹  ${this._name} stopped`);
        }
    }
    /**
     * Keep process alive listening for commands.
     * Resolves when stop() is called.
     */
    listen() {
        if (this.verbose) {
            console.log(`[AgentHelm] 👂 ${this._name} listening for commands...`);
        }
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (!this._running) {
                    clearInterval(check);
                    resolve();
                }
            }, 1000);
        });
    }
    // ─── GETTERS ────────────────────────────────────────
    get agentId() {
        return this._agentId;
    }
    get isConnected() {
        return this._connected;
    }
    get name() {
        return this._name;
    }
    get tokensToday() {
        return this._tokensToday;
    }
    get tokensSession() {
        return this._tokensSession;
    }
    // ─── PRIVATE METHODS ────────────────────────────────
    getAuthKey() {
        return this._agentToken ?? this.key;
    }
    async register() {
        try {
            const res = await this.fetch('/ping', {
                key: this.key,
                name: this._name,
                agent_type: this.agentType,
                version: this.version,
                status: 'running',
                started_at: new Date().toISOString(),
            });
            if (res.ok) {
                const data = await res.json();
                this._agentId = data.agent_id ?? null;
                this._agentToken = data.agent_token ?? null;
                this._connected = true;
                if (this.verbose) {
                    const short = this._agentId
                        ? this._agentId.slice(0, 8) + '...'
                        : 'unknown';
                    console.log(`[AgentHelm] ✅ Connected: ${this._name} (${short})`);
                }
            }
            else if (res.status === 401) {
                console.error('[AgentHelm] ❌ Invalid key. ' +
                    'Check agenthelm.dev/dashboard/settings');
            }
            else {
                throw new Error(`HTTP ${res.status}`);
            }
        }
        catch (err) {
            if (err instanceof TypeError && err.message.includes('fetch')) {
                console.log(`[AgentHelm] ⚠️  Offline mode — will retry...`);
            }
            else {
                console.log(`[AgentHelm] ⚠️  Connection failed: ${String(err)}`);
            }
        }
    }
    send(endpoint, payload) {
        this.fetch(endpoint, payload).catch(() => {
            this.queue.push(endpoint, payload);
        });
    }
    async fetch(endpoint, payload) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await globalThis.fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            return res;
        }
        finally {
            clearTimeout(timer);
        }
    }
    async fetchGet(url) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await globalThis.fetch(url, {
                signal: controller.signal,
            });
            return res;
        }
        finally {
            clearTimeout(timer);
        }
    }
    sendPing() {
        this.fetch('/ping', {
            key: this.getAuthKey(),
            agent_id: this._agentId,
            status: 'running',
            timestamp: new Date().toISOString(),
        }).then(async (res) => {
            if (res.ok) {
                const data = await res.json();
                if (data.agent_token) {
                    this._agentToken = data.agent_token;
                }
            }
        }).catch(() => { });
    }
    async pollCommands() {
        if (!this._agentId)
            return;
        try {
            const url = `${this.baseUrl}/command` +
                `?key=${encodeURIComponent(this.getAuthKey())}` +
                `&agent_id=${encodeURIComponent(this._agentId)}`;
            const res = await this.fetchGet(url);
            if (res.ok) {
                const data = await res.json();
                const commands = data.commands ?? [];
                for (const cmd of commands) {
                    await this.handleCommand(cmd);
                }
            }
        }
        catch {
            // Silently fail — network issues are normal
        }
    }
    async handleCommand(cmd) {
        const { command_type, payload = {} } = cmd;
        try {
            if (command_type === 'chat') {
                if (this.chatHandler) {
                    const message = String(payload.message ?? '');
                    await this.chatHandler(message);
                }
            }
            else {
                const handler = this.commandHandlers.get(command_type);
                if (handler) {
                    await handler(payload);
                }
            }
        }
        catch (err) {
            console.error(`[AgentHelm] ❌ Command handler error for "${command_type}":`, err);
        }
    }
    async flushQueue() {
        if (this.queue.isEmpty)
            return;
        const item = this.queue.pop();
        if (!item)
            return;
        try {
            await this.fetch(item.endpoint, item.payload);
        }
        catch {
            // Put back at front if still failing
            this.queue.push(item.endpoint, item.payload);
        }
    }
    /**
     * Compute what changed between two state snapshots.
     * Returns a dict of {key: {op, value}} operations.
     */
    computeDelta(previous, current) {
        const delta = {};
        const allKeys = Array.from(new Set(Object.keys(previous).concat(Object.keys(current))));
        for (let i = 0; i < allKeys.length; i++) {
            const key = allKeys[i];
            if (!(key in previous)) {
                delta[key] = { op: 'add', value: current[key] };
            }
            else if (!(key in current)) {
                delta[key] = { op: 'remove' };
            }
            else if (JSON.stringify(previous[key]) !== JSON.stringify(current[key])) {
                delta[key] = { op: 'replace', value: current[key] };
            }
        }
        return delta;
    }
    /**
     * Check for and apply user interventions (stop, pause, override, etc.).
     * Should be called at checkpoint boundaries.
     */
    async processInterventions() {
        if (!this._currentTaskId)
            return;
        try {
            if (!this._agentId)
                return;
            const url = `${this.baseUrl}/interventions` +
                `?key=${encodeURIComponent(this.getAuthKey())}` +
                `&agent_id=${encodeURIComponent(this._agentId)}` +
                `&task_id=${encodeURIComponent(this._currentTaskId)}`;
            const res = await this.fetchGet(url);
            if (!res.ok)
                return;
            const data = (await res.json());
            const interventions = data.interventions || [];
            if (interventions.length === 0)
                return;
            const appliedIds = [];
            for (const intervention of interventions) {
                if (this.verbose) {
                    console.log(`[AgentHelm] \uD83D\uDEA8 Intervention detected: ${intervention.type}`);
                }
                if (intervention.type === 'stop') {
                    this.stop();
                    throw new Error('Agent stopped by user intervention');
                }
                if (intervention.type === 'state_override') {
                    if (this._lastCheckpointState) {
                        Object.assign(this._lastCheckpointState, intervention.payload);
                        if (this.verbose) {
                            console.log(`[AgentHelm] \uD83D\uDCDD State override applied: ${Object.keys(intervention.payload).join(', ')}`);
                        }
                    }
                }
                if (intervention.type === 'pause') {
                    if (this.verbose) {
                        console.log('[AgentHelm] \u23F8 Agent paused by user. Waiting for resume...');
                    }
                    // Polling for resume
                    let resumed = false;
                    while (!resumed) {
                        await new Promise((resolve) => setTimeout(resolve, 5000));
                        const checkRes = await this.fetchGet(url);
                        if (checkRes.ok) {
                            const checkData = (await checkRes.json());
                            const pending = checkData.interventions || [];
                            const resumeInt = pending.find((p) => p.type === 'resume');
                            if (resumeInt) {
                                appliedIds.push(resumeInt.id);
                                resumed = true;
                                if (this.verbose) {
                                    console.log('[AgentHelm] \u25B6\uFE0F Agent resumed');
                                }
                            }
                        }
                    }
                }
                appliedIds.push(intervention.id);
            }
            if (appliedIds.length > 0) {
                await this.fetchPatch('/interventions', { ids: appliedIds });
            }
        }
        catch (err) {
            if (err instanceof Error && err.message === 'Agent stopped by user intervention') {
                throw err;
            }
            throw err;
        }
    }
    /**
     * Helper for PATCH requests.
     */
    async fetchPatch(endpoint, payload) {
        const url = `${this.baseUrl}${endpoint}?key=${encodeURIComponent(this.getAuthKey())}`;
        await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    }
}
exports.AgentHelm = AgentHelm;
// ─── FACTORY FUNCTION ─────────────────────────────────
/**
 * One-line shortcut to connect an agent to AgentHelm.
 *
 * @example
 * import { connect } from 'agenthelm-sdk'
 * const dock = connect({ key: 'ahe_live_xxxxx', name: 'My Agent' })
 */
function connect(options) {
    return new AgentHelm(options);
}
//# sourceMappingURL=client.js.map