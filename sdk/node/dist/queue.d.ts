export interface QueueItem {
    endpoint: string;
    payload: Record<string, unknown>;
    timestamp: number;
}
export declare class OfflineQueue {
    private items;
    private maxSize;
    constructor(maxSize?: number);
    push(endpoint: string, payload: Record<string, unknown>): void;
    pop(): QueueItem | null;
    get size(): number;
    get isEmpty(): boolean;
    clear(): void;
}
//# sourceMappingURL=queue.d.ts.map