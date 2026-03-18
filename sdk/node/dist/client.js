"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentHelm = void 0;
exports.connect = connect;
const queue_1 = require("./queue");
const DEFAULT_BASE_URL = 'https://agenthelm.dev/api/sdk';
// ─── CLIENT ───────────────────────────────────────────
class AgentHelm {
    constructor(options) {
        this._agentId = null;
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
        const { key, name = 'Node Agent', agentType = 'node', version = '1.0.0', baseUrl = DEFAULT_BASE_URL, autoPing = true, pingInterval = 30000, commandPollInterval = 5000, verbose = true, timeout = 5000, } = options;
        if (!key || (!key.startsWith('ahe_') && !key.startsWith('agd_'))) {
            throw new Error('Invalid AgentHelm key. ' +
                'Keys must start with "ahe_" or "agd_". ' +
                'Get your key at agenthelm.dev/dashboard/settings');
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
            key: this.key,
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
            key: this.key,
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
            key: this.key,
            agent_id: this._agentId,
            type: 'log',
            level: 'error',
            message: String(message),
            data: errorData,
            timestamp: new Date().toISOString(),
        });
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
            key: this.key,
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
    }
    /**
     * Send a reply back to a dashboard/Telegram chat message.
     * Call this inside onChat handlers.
     * @param message - The reply message
     */
    reply(message) {
        this.send('/log', {
            key: this.key,
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
            key: this.key,
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
            key: this.key,
            agent_id: this._agentId,
            status: 'running',
            timestamp: new Date().toISOString(),
        }).catch(() => { });
    }
    async pollCommands() {
        if (!this._agentId)
            return;
        try {
            const url = `${this.baseUrl}/command` +
                `?key=${encodeURIComponent(this.key)}` +
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