"use client";

import { useState, useEffect } from "react";
import { BarChart3, Network, FileText, Activity, Bell, Clock, Cpu, HardDrive, Wifi, CheckCircle, Zap, AlertTriangle, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface Metrics {
  pipelineLatency: { p50: string; p95: string; p99: string };
  proposalThroughput: string;
  brainPublishRate: string;
  contextTokenUsage: string;
  agentHeartbeat: string;
  errorRate: string;
}

interface TraceStep {
  name: string;
  duration: string;
  status: "success" | "failed" | "pending";
  error?: string;
}

interface Trace {
  id: string;
  traceId: string;
  duration: string;
  status: "success" | "failed";
  steps: TraceStep[];
}

interface Log {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  traceId: string;
  agentId: string;
}

interface Alert {
  id: string;
  timestamp: string;
  severity: "warning" | "error" | "info";
  message: string;
  status: "active" | "resolved";
}

export default function ObservabilityPage() {
  const [metrics, setMetrics] = useState<Metrics>({
    pipelineLatency: { p50: "120ms", p95: "350ms", p99: "650ms" },
    proposalThroughput: "45 req/s",
    brainPublishRate: "2.3 /hr",
    contextTokenUsage: "1.2K tokens/hr",
    agentHeartbeat: "98%",
    errorRate: "0.3%"
  });

  const [traces, setTraces] = useState<Trace[]>([
    {
      id: "tr_001",
      traceId: "a1b2c3d4e5f67890",
      duration: "420ms",
      status: "success",
      steps: [
        { name: "Proposal Received", duration: "15ms", status: "success" },
        { name: "Sanitization", duration: "25ms", status: "success" },
        { name: "Permission Check", duration: "10ms", status: "success" },
        { name: "Replay Protection", duration: "5ms", status: "success" },
        { name: "Verification", duration: "180ms", status: "success" },
        { name: "Analysis", duration: "120ms", status: "success" },
        { name: "Merge Planning", duration: "30ms", status: "success" },
        { name: "Publishing", duration: "35ms", status: "success" }
      ]
    },
    {
      id: "tr_002",
      traceId: "f6e5d4c3b2a10987",
      duration: "580ms",
      status: "failed",
      steps: [
        { name: "Proposal Received", duration: "12ms", status: "success" },
        { name: "Sanitization", duration: "20ms", status: "success" },
        { name: "Permission Check", duration: "8ms", status: "failed", error: "Unauthorized tool: Tool 'shell' not permitted" },
        { name: "Permission Check", duration: "10ms", status: "success" }
      ]
    }
  ]);

  const [logs, setLogs] = useState<Log[]>([
    {
      timestamp: "2026-07-05T10:29:15Z",
      level: "info",
      message: "Proposal processed successfully",
      traceId: "a1b2c3d4e5f67890",
      agentId: "agd_abc123"
    },
    {
      timestamp: "2026-07-05T10:28:42Z",
      level: "error",
      message: "Unauthorized tool access attempt",
      traceId: "f6e5d4c3b2a10987",
      agentId: "agd_def456"
    },
    {
      timestamp: "2026-07-05T10:28:01Z",
      level: "info",
      message: "Context injection completed",
      traceId: "d4c3b2a1e5f67890",
      agentId: "agd_ghi789"
    }
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "alt_001",
      timestamp: "2026-07-05T10:25:00Z",
      severity: "warning",
      message: "Pipeline latency above threshold (p95: 350ms > 300ms)",
      status: "active"
    },
    {
      id: "alt_002",
      timestamp: "2026-07-05T09:15:00Z",
      severity: "info",
      message: "New agent connected: agent-ghi789",
      status: "resolved"
    }
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight font-mono uppercase">
            Observability
          </h1>
          <p className="text-zinc-500 mt-1 font-mono text-sm">
            Monitor system performance, traces, logs, and health metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // TODO: Export metrics
            }}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-mono text-zinc-500 hover:text-white hover:bg-zinc-800/50 border border-transparent transition-colors"
          >
            <FileText className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <h2 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
          System Metrics
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">
              Pipeline Latency
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span>p50:</span>
                <span className="font-mono text-zinc-400">{metrics.pipelineLatency.p50}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>p95:</span>
                <span className="font-mono text-zinc-400">{metrics.pipelineLatency.p95}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>p99:</span>
                <span className="font-mono text-zinc-400">{metrics.pipelineLatency.p99}</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">
              Throughput
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span>Proposals/sec:</span>
                <span className="font-mono text-zinc-400">{metrics.proposalThroughput}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Brain publishes/hr:</span>
                <span className="font-mono text-zinc-400">{metrics.brainPublishRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Context tokens/hr:</span>
                <span className="font-mono text-zinc-400">{metrics.contextTokenUsage}</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">
              Health & Errors
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span>Agent heartbeat:</span>
                <span className="font-mono text-zinc-400">{metrics.agentHeartbeat}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Error rate:</span>
                <span className="font-mono text-zinc-400">{metrics.errorRate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Traces */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <h2 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
          Recent Traces
        </h2>
        <div className="space-y-4">
          {traces.length > 0 ? (
            traces.map((trace) => (
              <motion.div
                key={trace.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: traces.indexOf(trace) * 0.05 }}
                className="border border-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="bg-[#0a0a0a] border-b border-zinc-800 px-4 py-3 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-${trace.status === "success" ? "green-500/20" : "red-500/20"} text-${trace.status === "success" ? "green-400" : "red-400"}`}>
                        {trace.status === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                          Trace {trace.traceId.slice(-8)}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-400">
                          {trace.duration} • {trace.steps.length} steps
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono ${trace.status === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {trace.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="space-y-2">
                    {trace.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full bg-${step.status === "success" ? "green-500" : step.status === "failed" ? "red-500" : "yellow-500"} ${step.status === "success" ? "" : "animate-pulse"}`} />
                        <div className="flex-1 space-y-1 text-xs font-mono">
                          <div className="flex">
                            <span className="w-1/2">{step.name}</span>
                            <span className="text-zinc-400">{step.duration}</span>
                          </div>
                          {step.error && (
                            <div className="flex">
                              <span className="w-1/2">Error:</span>
                              <span className="text-red-400 text-xs">{step.error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-500 font-mono">
                No traces available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <h2 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
          System Logs
        </h2>
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-zinc-400">Level:</label>
              <select
                className="px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-zinc text-zinc-400"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-zinc-400">Time:</label>
              <select
                className="px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-zinc text-zinc-400"
              >
                <option value="1h">Last Hour</option>
                <option value="6h" selected>Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
          </div>
          <div className="h-64 overflow-y-auto bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <motion.div
                  key={log.timestamp + index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-l-2 border-zinc-700 pl-3 py-2"
                >
                  <div className="flex items-start gap-3 mb-1">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${log.level === "error" ? "bg-red-500" : log.level === "warn" ? "bg-yellow-500" : log.level === "info" ? "bg-blue-500" : "bg-green-500"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-mono text-xs text-zinc-300">
                        {log.message}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {log.agentId} • {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-500 font-mono">
                  No logs available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <h2 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
          Active Alerts
        </h2>
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: alerts.indexOf(alert) * 0.05 }}
                className="border border-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="bg-[#0a0a0a] border-b border-zinc-800 px-4 py-3 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-${alert.severity === "warning" ? "yellow-500/20" : alert.severity === "error" ? "red-500/20" : "blue-500/20"} text-${alert.severity === "warning" ? "yellow-400" : alert.severity === "error" ? "red-400" : "blue-400"}`}>
                        {alert.severity === "warning" ? <AlertTriangle className="w-4 h-4" /> : alert.severity === "error" ? <Bell className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                          Alert
                        </h3>
                        <p className="mt-1 text-xs text-zinc-400">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono ${alert.severity === "warning" ? "bg-yellow-500/20 text-yellow-400" : alert.severity === "error" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono ${alert.status === "active" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-500 font-mono">
                No active alerts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}