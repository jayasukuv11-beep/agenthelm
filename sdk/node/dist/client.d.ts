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
    burnRateThreshold?: number;
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
export interface CheckpointOptions {
    stepIndex?: number;
    inputData?: Record<string, unknown>;
    outputData?: Record<string, unknown>;
    status?: 'running' | 'completed' | 'failed' | 'skipped';
}
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
    private _agentToken;
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
    private _currentTaskId;
    private _stepCounter;
    private _lastCheckpointState;
    private _stepStartTime;
    private _tokenWindow;
    private _burnRateThreshold;
    private _burnRateAlerted;
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
     * Save a checkpoint at the current step for resumability.
     * Call between each tool/chain step to enable resume on crash.
     * @param stepName - Human-readable label for this step
     * @param state - Serializable state object at this step
     * @param options - Optional step_index, input/output data, status
     */
    checkpoint(stepName: string, state: Record<string, unknown>, options?: CheckpointOptions): void;
    /**
     * Resume a failed task from the last successful checkpoint.
     * Returns the state snapshot at that checkpoint, or null.
     * @param taskId - The task UUID to resume
     * @param checkpointId - Specific checkpoint UUID to resume from
     * @param stepIndex - Specific step to resume from (defaults to last successful)
     */
    resumeFrom(taskId: string, checkpointId?: string, stepIndex?: number): Promise<Record<string, unknown> | null>;
    /**
     * Register a handler for dispatched tasks from the dashboard/Telegram.
     * @param handler - Function called with task name and data object
     */
    onDispatch(handler: (task: string, data: Record<string, unknown>) => unknown): this;
    private dispatchHandler;
    private runDispatchSafe;
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
    private getAuthKey;
    private register;
    private send;
    private fetch;
    private fetchGet;
    private sendPing;
    private pollCommands;
    private handleCommand;
    private flushQueue;
    /**
     * Compute what changed between two state snapshots.
     * Returns a dict of {key: {op, value}} operations.
     */
    private computeDelta;
    /**
     * Check for and apply user interventions (stop, pause, override, etc.).
     * Should be called at checkpoint boundaries.
     */
    private processInterventions;
    /**
     * Helper for PATCH requests.
     */
    private fetchPatch;
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