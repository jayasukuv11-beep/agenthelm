export interface QueueItem {
  endpoint: string
  payload: Record<string, unknown>
  timestamp: number
}

export class OfflineQueue {
  private items: QueueItem[] = []
  private maxSize: number

  constructor(maxSize = 1000) {
    this.maxSize = maxSize
  }

  push(endpoint: string, payload: Record<string, unknown>): void {
    if (this.items.length >= this.maxSize) {
      // Remove oldest item to make room
      this.items.shift()
    }
    this.items.push({
      endpoint,
      payload,
      timestamp: Date.now()
    })
  }

  pop(): QueueItem | null {
    return this.items.shift() ?? null
  }

  get size(): number {
    return this.items.length
  }

  get isEmpty(): boolean {
    return this.items.length === 0
  }

  clear(): void {
    this.items = []
  }
}
