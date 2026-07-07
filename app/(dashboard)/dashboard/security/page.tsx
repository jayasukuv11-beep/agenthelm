"use client";

import React from "react";
import { Shield, AlertTriangle, Key, FileText, Clock, Eye, Zap, CheckCircle, Lock, RotateCcw, Bug, ScanLine } from "lucide-react";
import { motion } from "framer-motion";

export default function SecurityPage() {
  const [events, setEvents] = React.useState([
    {
      id: "sec_001",
      timestamp: "2026-07-05T10:30:00Z",
      type: "replay_attempt",
      severity: "blocked",
      description: "Replay attack detected and blocked",
      details: {
        agentId: "agd_abc123",
        nonce: "a1b2c3d4e5f6",
        window: "5 minutes",
        action: "Blocked request"
      }
    },
    {
      id: "sec_002",
      timestamp: "2026-07-05T09:15:00Z",
      type: "context_poisoning",
      severity: "blocked",
      description: "Context poisoning attempt detected and sanitized",
      details: {
        agentId: "agd_def456",
        threatType: "API key exposure",
        action: "Secrets stripped, proposal sanitized"
      }
    },
    {
      id: "sec_003",
      timestamp: "2026-07-05T08:45:00Z",
      type: "permission_violation",
      severity: "blocked",
      description: "Unauthorized tool call blocked",
      details: {
        agentId: "agd_ghi789",
        tool: "shell.exec",
        requiredPermission: "filesystem.write",
        action: "Blocked at runtime"
      }
    },
    {
      id: "sec_004",
      timestamp: "2026-07-04T16:20:00Z",
      type: "audit_event",
      severity: "info",
      description: "Permission updated for agent",
      details: {
        agentId: "agd_jkl012",
        change: "Added filesystem.read permission",
        actor: "system"
      }
    },
    {
      id: "sec_005",
      timestamp: "2026-07-04T14:10:00Z",
      type: "rate_limit",
      severity: "warning",
      description: "Rate limit threshold approached",
      details: {
        agentId: "agd_mno345",
        currentRate: "45 req/min",
        threshold: "50 req/min",
        action: "Monitoring"
      }
    }
  ]);

  const [filters, setFilters] = React.useState({
    type: "all",
    severity: "all",
    timeRange: "24h"
  });

  const filteredEvents = events.filter(event => {
    const typeMatch = filters.type === "all" || event.type === filters.type;
    const severityMatch = filters.severity === "all" || event.severity === filters.severity;
    return typeMatch && severityMatch;
  });

  const severityColors: Record<string, string> = {
    blocked: "text-red-500",
    warning: "text-yellow-500",
    info: "text-blue-500"
  };

  const typeIcons: Record<string, React.ComponentType<any>> = {
    replay_attempt: RotateCcw,
    context_poisoning: Bug,
    permission_violation: Key,
    audit_event: FileText,
    rate_limit: ScanLine
  };

  const typeLabels: Record<string, string> = {
    replay_attempt: "Replay Protection",
    context_poisoning: "Context Poisoning Defense",
    permission_violation: "Permission Validation",
    audit_event: "Audit Log",
    rate_limit: "Rate Limiting"
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight font-mono uppercase">
            Security
          </h1>
          <p className="text-zinc-500 mt-1 font-mono text-sm">
            Monitor and manage security events and protections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // TODO: Export security logs
            }}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-mono text-zinc-500 hover:text-white hover:bg-zinc-800/50 border border-transparent transition-colors"
          >
            <FileText className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Security Filters */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <h2 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
          Filters
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">Event Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-zinc text-zinc-400"
            >
              <option value="all">All Types</option>
              <option value="replay_attempt">Replay Attempts</option>
              <option value="context_poisoning">Context Poisoning</option>
              <option value="permission_violation">Permission Violations</option>
              <option value="audit_event">Audit Events</option>
              <option value="rate_limit">Rate Limiting</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-zinc text-zinc-400"
            >
              <option value="all">All Severities</option>
              <option value="blocked">Blocked</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-zinc text-zinc-400"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security Stats */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <h2 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
          Security Overview
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">
              Threats Blocked
            </h3>
            <p className="text-2xl font-mono font-black text-white">
              127
            </p>
            <p className="text-xs text-zinc-400">
              Today
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">
              Agents Protected
            </h3>
            <p className="text-2xl font-mono font-black text-white">
              3
            </p>
            <p className="text-xs text-zinc-400">
              Active
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">
              Security Score
            </h3>
            <p className="text-2xl font-mono font-black text-white">
              98%
            </p>
            <p className="text-xs text-zinc-400">
              Excellent
            </p>
          </div>
          <div className="text-center">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">
              Audit Events
            </h3>
            <p className="text-2xl font-mono font-black text-white">
              45
            </p>
            <p className="text-xs text-zinc-400">
              This Week
            </p>
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <h2 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
          Security Events
        </h2>
        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: filteredEvents.indexOf(event) * 0.05 }}
                className="border border-zinc-800 rounded-xl overflow-hidden"
              >
                <div className="bg-[#0a0a0a] border-b border-zinc-800 px-4 py-3 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/20 text-red-500`}>
                        {typeIcons[event.type] && React.createElement(typeIcons[event.type], { className: "w-4 h-4" })}
                      </div>
                      <div>
                        <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                          {typeLabels[event.type]}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-400">
                          {event.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono ${severityColors[event.severity]}`}>
                      {event.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="space-y-2 text-xs font-mono text-zinc-400">
                    {Object.keys(event.details).map((key, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="font-mono text-zinc-500">{key}:</span>
                        <span className="flex-1 break-all">{event.details[key as keyof typeof event.details]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-500 font-mono">
                No security events match your filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Security Controls */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <h2 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
          Security Controls
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">
              Protection Levels
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Replay Protection
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    disabled
                    className="w-4 h-4 text-orange-500 bg-zinc-900/50 border-zinc-800 rounded"
                  />
                  <span className="ml-2 text-xs font-mono">Always ON (fail-closed)</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Context Poisoning Defense
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    disabled
                    className="w-4 h-4 text-orange-500 bg-zinc-900/50 border-zinc-800 rounded"
                  />
                  <span className="ml-2 text-xs font-mono">Always ON (fail-closed)</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Permission Validation
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    disabled
                    className="w-4 h-4 text-orange-500 bg-zinc-900/50 border-zinc-800 rounded"
                  />
                  <span className="ml-2 text-xs font-mono">Always ON (fail-closed)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">
              Security Settings
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Audit Log Retention
                </label>
                <select
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-zinc text-zinc-400"
                >
                  <option value="30d">30 Days</option>
                  <option value="90d" selected>90 Days</option>
                  <option value="365d">365 Days</option>
                  <option value="indefinite">Indefinite</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Alert Notification
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-orange-500 bg-zinc-900/50 border-zinc-800 rounded"
                  />
                  <span className="ml-2 text-xs font-mono">Email alerts for blocked events</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Auto-block Threats
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-orange-500 bg-zinc-900/50 border-zinc-800 rounded"
                  />
                  <span className="ml-2 text-xs font-mono">Automatically block detected threats</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}