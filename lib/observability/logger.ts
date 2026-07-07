export type LogLevel = "debug" | "info" | "warn" | "error"

export interface StructuredLogEntry {
  timestamp: string
  level: LogLevel
  name: string
  message: string
  traceId?: string
  proposalId?: string
  projectId?: string
  stage?: string
  duration?: number
  status?: "ok" | "failed" | "skipped"
  errorCode?: string
  meta?: Record<string, unknown>
}

export class StructuredLogger {
  constructor(private readonly loggerName: string) {}

  private log(
    level: LogLevel,
    message: string,
    fields: Partial<StructuredLogEntry> = {}
  ): void {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      name: this.loggerName,
      message,
      ...fields,
    }

    const output = JSON.stringify(entry)

    switch (level) {
      case "error":
        console.error(output)
        break
      case "warn":
        console.warn(output)
        break
      case "debug":
        console.debug(output)
        break
      default:
        console.log(output)
    }
  }

  debug(message: string, fields?: Partial<StructuredLogEntry>): void {
    this.log("debug", message, fields)
  }

  info(message: string, fields?: Partial<StructuredLogEntry>): void {
    this.log("info", message, fields)
  }

  warn(message: string, fields?: Partial<StructuredLogEntry>): void {
    this.log("warn", message, fields)
  }

  error(message: string, fields?: Partial<StructuredLogEntry>): void {
    this.log("error", message, fields)
  }
}

export function createStructuredLogger(name: string): StructuredLogger {
  return new StructuredLogger(name)
}

export const logger = createStructuredLogger("agenthelm")
