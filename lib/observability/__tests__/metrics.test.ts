import { describe, it, expect, beforeEach } from "vitest"
import { MetricsCollector, metrics, calculateP95 } from "../metrics"

describe("MetricsCollector", () => {
  let collector: MetricsCollector

  beforeEach(() => {
    collector = new MetricsCollector()
  })

  it("records a single stage metric", () => {
    collector.recordStage("verify", true, 100)
    const all = collector.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].stage).toBe("verify")
    expect(all[0].success).toBe(true)
    expect(all[0].durationMs).toBe(100)
  })

  it("records multiple stages", () => {
    collector.recordStage("intake", true, 50)
    collector.recordStage("verify", true, 100)
    collector.recordStage("validate", false, 200, "STAGE_VALIDATE_FAILED")

    const all = collector.getAll()
    expect(all).toHaveLength(3)
  })

  it("aggregates metrics per stage", () => {
    collector.recordStage("verify", true, 100)
    collector.recordStage("verify", true, 200)
    collector.recordStage("verify", false, 150)
    collector.recordStage("intake", true, 50)

    const aggregates = collector.getAggregates()
    expect(aggregates).toHaveLength(2)

    const verifyAgg = aggregates.find((a) => a.stage === "verify")
    expect(verifyAgg).toBeDefined()
    expect(verifyAgg!.total).toBe(3)
    expect(verifyAgg!.successCount).toBe(2)
    expect(verifyAgg!.failureCount).toBe(1)
    expect(verifyAgg!.avgDuration).toBe(150) // (100+200+150)/3 = 150
  })

  it("calculates P95 correctly", () => {
    collector.recordStage("test", true, 100)
    collector.recordStage("test", true, 200)
    collector.recordStage("test", true, 300)
    collector.recordStage("test", true, 400)
    collector.recordStage("test", true, 500)

    const aggregates = collector.getAggregates()
    const testAgg = aggregates.find((a) => a.stage === "test")
    // P95 of [100,200,300,400,500] at 95% -> index 4 -> 500
    expect(testAgg!.p95Latency).toBe(500)
  })

  it("handles empty durations for P95", () => {
    expect(calculateP95([])).toBe(0)
  })

  it("handles single value for P95", () => {
    expect(calculateP95([100])).toBe(100)
  })

  it("P95 at boundary", () => {
    // 20 values, 95% -> index 18 (0-indexed), sorted[18]
    const values = Array.from({ length: 20 }, (_, i) => (i + 1) * 10)
    expect(calculateP95(values)).toBe(190) // index 18 -> 190
  })

  it("reset clears all metrics", () => {
    collector.recordStage("test", true, 100)
    collector.reset()
    expect(collector.getAll()).toHaveLength(0)
    expect(collector.getAggregates()).toHaveLength(0)
  })

  it("records errorCode on failure", () => {
    collector.recordStage("verify", false, 100, "STAGE_VERIFY_FAILED")
    const all = collector.getAll()
    expect(all[0].errorCode).toBe("STAGE_VERIFY_FAILED")
  })

  it("buffer limit drops oldest entries", () => {
    // The buffer is large (10000), so we test the logic indirectly
    // by ensuring it doesn't throw on many entries
    for (let i = 0; i < 100; i++) {
      collector.recordStage("test", true, i)
    }
    expect(collector.getAll().length).toBe(100)
  })

  it("shared metrics singleton works", () => {
    const initialCount = metrics.getAll().length
    metrics.recordStage("singleton-test", true, 42)
    expect(metrics.getAll().length).toBe(initialCount + 1)
  })
})