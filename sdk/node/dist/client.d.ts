export interface AgentHelmOptions {
    key: string;
    name?: string;
    agentType?: 'python' | 'node' | 'other';
    version?: string;
    baseUrl?: string;
    autoPing?: boolean;
    pingInterval?: number;
    commandPollInterval?: number;
    verbose?: boolean;
    timeout?: number;
}
export interface TrackTokensOptions {
    used: number;
    model: string;
    costPer1k?: number;
    promptTokens?: number;
    completionTokens?: number;
}
export type LogLevel = 'info' | 'warning' | 'error' | 'success';
export type CommandHandler = (payload: Record<string, unknown>) => void | Promise<void>;
export type ChatHandler = (message: string) => void | Promise<void>;
export declare class AgentHelm {
    private readonly key;
    private readonly _name;
    private readonly agentType;
    private readonly version;
    private readonly baseUrl;
    private readonly verbose;
    private readonly timeoutMs;
    private readonly pingInterval;
    private readonly commandPollInterval;
    private _agentId;
    private _connected;
    private _running;
    private _tokensToday;
    private _tokensSession;
    private commandHandlers;
    private chatHandler;
    private queue;
    private pingTimer;
    private commandTimer;
    private flushTimer;
    constructor(options: AgentHelmOptions);
    /**
     * Send a log message to AgentHelm dashboard.
     * @param message - The log message
     * @param level - Log level: info | warning | error | success
     * @param data - Optional structured data
     */
    log(message: string, level?: LogLevel, data?: Record<string, unknown>): void;
    /**
     * Send structured output/results to dashboard.
     * @param data - Results object (must be JSON-serializable)
     * @param label - Optional label for this output
     */
    output(data: Record<string, unknown>, label?: string): void;
    /**
     * Report an error to AgentHelm dashboard.
     * Automatically updates agent status to "error".
     * @param message - Error description
     * @param error - Optional Error object
     */
    error(message: string, error?: Error): void;
    /**
     * Send a warning message to AgentHelm dashboard.
     * @param message - The warning message
     */
    warn(message: string): void;
    /**
     * Send a success message to AgentHelm dashboard.
     * @param message - The success message
     */
    success(message: string): void;
    /**
     * Report progress of a long-running task.
     * @param percent - Progress percentage (0-100)
     * @param message - Progress description
     */
    progress(percent: number, message: string): void;
    /**
     * Register a handler for dispatched tasks from the dashboard/Telegram.
     * @param handler - Function called with task name and data object
     */
    onDispatch(handler: (task: string, data: Record<string, unknown>) => unknown): this;
    /**
     * Track token usage for credits dashboard.
     * @param options - Token tracking options
     */
    trackTokens(options: TrackTokensOptions): void;
    /**
     * Send a reply back to a dashboard/Telegram chat message.
     * Call this inside onChat handlers.
     * @param message - The reply message
     */
    reply(message: string): void;
    /**
     * Register a handler for dashboard commands.
     * @param commandType - Command name to listen for
     * @param handler - Function to call when command received
     */
    onCommand(commandType: string, handler: CommandHandler): this;
    /**
     * Register a handler for chat messages.
     * Use reply() to respond.
     * @param handler - Function called with message string
     */
    onChat(handler: ChatHandler): this;
    /**
     * Gracefully stop the agent and notify dashboard.
     */
    stop(): void;
    /**
     * Keep process alive listening for commands.
     * Resolves when stop() is called.
     */
    listen(): Promise<void>;
    get agentId(): string | null;
    get isConnected(): boolean;
    get name(): string;
    get tokensToday(): number;
    get tokensSession(): number;
    private register;
    private send;
    private fetch;
    private fetchGet;
    private sendPing;
    private pollCommands;
    private handleCommand;
    private flushQueue;
}
/**
 * One-line shortcut to connect an agent to AgentHelm.
 *
 * @example
 * import { connect } from 'agenthelm-sdk'
 * const dock = connect({ key: 'ahe_live_xxxxx', name: 'My Agent' })
 */
export declare function connect(options: AgentHelmOptions): AgentHelm;
//# sourceMappingURL=client.d.ts.map