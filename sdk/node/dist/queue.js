"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineQueue = void 0;
class OfflineQueue {
    constructor(maxSize = 1000) {
        this.items = [];
        this.maxSize = maxSize;
    }
    push(endpoint, payload) {
        if (this.items.length >= this.maxSize) {
            // Remove oldest item to make room
            this.items.shift();
        }
        this.items.push({
            endpoint,
            payload,
            timestamp: Date.now()
        });
    }
    pop() {
        return this.items.shift() ?? null;
    }
    get size() {
        return this.items.length;
    }
    get isEmpty() {
        return this.items.length === 0;
    }
    clear() {
        this.items = [];
    }
}
exports.OfflineQueue = OfflineQueue;
//# sourceMappingURL=queue.js.map