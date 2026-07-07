/**
 * Sprint 6 — Retry with Exponential Backoff
 *
 * Retries only *transient* failures (network timeout, connection error).
 * Never retries validation, verification, or conflict errors.
 */

export interface RetryConfig {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
}

// ---------------------------------------------------------------------------
// Error Classification
// ---------------------------------------------------------------------------

const TRANSIENT_PATTERNS = [
  /timeout/i,
  /connection refused/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /temporary/i,
  /503/i,
  /504/i,
  /network/i,
]

/**
 * Returns true if the error looks transient (worth retrying).
 * Validation, verification, and conflict errors are NEVER transient.
 */
export function isTransientError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error || "").toLowerCase()

  // Explicit non-transient keywords (fast-path rejection)
  const nonTransient = [
    "validation",
    "conflict",
    "duplicate",
    "not found",
    "already published",
    "rejected",
    "unauthorized",
    "forbidden",
  ]
  for (const keyword of nonTransient) {
    if (message.includes(keyword)) return false
  }

  return TRANSIENT_PATTERNS.some((p) => p.test(message))
}

// ---------------------------------------------------------------------------
// Exponential Backoff
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function calculateDelay(attempt: number, config: Required<RetryConfig>): number {
  const exponential = config.baseDelayMs * Math.pow(2, attempt - 1)
  const jitter = Math.random() * 50 // small jitter to avoid thundering herd
  return Math.min(exponential + jitter, config.maxDelayMs)
}

// ---------------------------------------------------------------------------
// Retry Runner
// ---------------------------------------------------------------------------

export interface RetryResult<T> {
  ok: boolean
  data?: T
  error?: Error
  attempts: number
}

/**
 * Executes `fn` with exponential-backoff retry.
 * Only retries when `isTransientError` returns true for the thrown error.
 *
 * @returns  RetryResult with `ok: true` and `data` on success,
 *          or `ok: false` and `error` on permanent failure / exhaustion.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      const data = await fn()
      return { ok: true, data, attempts: attempt }
    } catch (err) {
      const isLastAttempt = attempt === cfg.maxAttempts

      if (!isTransientError(err) || isLastAttempt) {
        return {
          ok: false,
          error: err instanceof Error ? err : new Error(String(err)),
          attempts: attempt,
        }
      }

      // Exponential backoff before next attempt
      const wait = calculateDelay(attempt, cfg)
      await delay(wait)
    }
  }

  // Unreachable — compiled for TypeScript exhaustiveness
  return {
    ok: false,
    error: new Error("Retry exhausted"),
    attempts: cfg.maxAttempts,
  }
}
