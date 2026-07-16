import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { StructuredLogger, createStructuredLogger, logger } from "../logger"
import { LogLevel } from "../logger"

function captureConsole() {
  const logs: string[] = []
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  const originalDebug = console.debug

  console.log = (...args) => logs.push(args.join(" "))
  console.warn = (...args) => logs.push(args.join(" "))
  console.error = (...args) => logs.push(args.join(" "))
  console.debug = (...args) => logs.push(args.join(" "))

  return {
    logs,
    restore: () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
      console.debug = originalDebug
    },
  }
}

describe("StructuredLogger", () => {
  let consoleCapture: ReturnType<typeof captureConsole>

  beforeEach(() => {
    consoleCapture = captureConsole()
  })

  afterEach(() => {
    consoleCapture.restore()
  })

  it("outputs valid JSON with required fields", () => {
    const log = new StructuredLogger("test")
    log.info("test message", { proposalId: "prop-1", projectId: "proj-1" })

    expect(consoleCapture.logs).toHaveLength(1)
    const entry = JSON.parse(consoleCapture.logs[0])
    expect(entry).toHaveProperty("timestamp")
    expect(entry).toHaveProperty("level", "info")
    expect(entry).toHaveProperty("name", "test")
    expect(entry).toHaveProperty("message", "test message")
    expect(entry).toHaveProperty("proposalId", "prop-1")
    expect(entry).toHaveProperty("projectId", "proj-1")
  })

  it("includes traceId when provided", () => {
    const log = new StructuredLogger("test")
    log.info("test", { traceId: "trace-123" })

    const entry = JSON.parse(consoleCapture.logs[0])
    expect(entry.traceId).toBe("trace-123")
  })

  it("includes stage and duration", () => {
    const log = new StructuredLogger("test")
    log.info("stage complete", { stage: "verify", duration: 42, status: "ok" })

    const entry = JSON.parse(consoleCapture.logs[0])
    expect(entry.stage).toBe("verify")
    expect(entry.duration).toBe(42)
    expect(entry.status).toBe("ok")
  })

  it("includes errorCode on failure", () => {
    const log = new StructuredLogger("test")
    log.error("stage failed", { errorCode: "STAGE_VERIFY_FAILED", status: "failed" })

    const entry = JSON.parse(consoleCapture.logs[0])
    expect(entry.level).toBe("error")
    expect(entry.errorCode).toBe("STAGE_VERIFY_FAILED")
    expect(entry.status).toBe("failed")
  })

  it("debug level uses console.debug", () => {
    const log = new StructuredLogger("test")
    log.debug("debug message")

    expect(consoleCapture.logs).toHaveLength(1)
    const entry = JSON.parse(consoleCapture.logs[0])
    expect(entry.level).toBe("debug")
  })

  it("warn level uses console.warn", () => {
    const log = new StructuredLogger("test")
    log.warn("warning message")

    expect(consoleCapture.logs).toHaveLength(1)
    const entry = JSON.parse(consoleCapture.logs[0])
    expect(entry.level).toBe("warn")
  })

  it("createStructuredLogger returns a logger with correct name", () => {
    const customLogger = createStructuredLogger("custom-name")
    customLogger.info("test")

    const entry = JSON.parse(consoleCapture.logs[0])
    expect(entry.name).toBe("custom-name")
  })

  it("default logger is exported", () => {
    logger.info("default logger test")

    const entry = JSON.parse(consoleCapture.logs[0])
    expect(entry.name).toBe("agenthelm")
  })

  it("meta field accepts arbitrary data", () => {
    const log = new StructuredLogger("test")
    log.info("test", { meta: { customField: "value", count: 5 } })

    const entry = JSON.parse(consoleCapture.logs[0])
    expect(entry.meta).toEqual({ customField: "value", count: 5 })
  })
})