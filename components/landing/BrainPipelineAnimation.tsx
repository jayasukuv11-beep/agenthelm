"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Shield,
  Search,
  GitMerge,
  Package,
  Brain,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Filter,
} from "lucide-react";

const stages = [
  {
    id: "noise-filter",
    name: "Noise Filter",
    icon: Filter,
    desc: "Sarvam-105B classifies raw agent observations as worth compiling or routine noise, before they're considered as a formal proposal",
    status: "completed" as const,
  },
  {
    id: "proposal",
    name: "Proposal Ingestion",
    icon: FileText,
    desc: "Agent submits knowledge proposal containing decisions, files, APIs, DB changes",
    status: "completed" as const,
  },
  {
    id: "sanitize",
    name: "Sanitization",
    icon: Shield,
    desc: "Strips secrets, PII, normalizes markdown formatting, validates schema structure",
    status: "completed" as const,
  },
  {
    id: "permissions",
    name: "Permissions Validation",
    icon: Shield,
    desc: "Check tool scopes allowlist (@read, @side_effect, @irreversible)",
    status: "completed" as const,
  },
  {
    id: "auth",
    name: "Authenticity Check",
    icon: Shield,
    desc: "Validate agent registration state and active JWT token signatures",
    status: "completed" as const,
  },
  {
    id: "verification",
    name: "Confidence Scoring",
    icon: Search,
    desc: "Heuristics-based trust scoring and project configuration validation",
    status: "running" as const,
  },
  {
    id: "analysis",
    name: "Conflict Analysis",
    icon: Search,
    desc: "Inspect active brain entries for logical overrides and structural conflicts",
    status: "pending" as const,
  },
  {
    id: "merge",
    name: "Merge Execution",
    icon: GitMerge,
    desc: "Execute logical additions, mark supersessions, and commit changes",
    status: "pending" as const,
  },
  {
    id: "publish",
    name: "Brain Versioning",
    icon: Package,
    desc: "Commit update to active database state and publish version tag",
    status: "pending" as const,
  },
  {
    id: "brain",
    name: "Project Brain Ingestion",
    icon: Brain,
    desc: "Update shared brain ready for semantic context injection to active agents",
    status: "pending" as const,
  },
];

const statusConfig = {
  completed: { icon: CheckCircle, color: "text-moss", bg: "bg-moss-soft", border: "border-moss/30", label: "Done" },
  running: { icon: Loader2, color: "text-vermilion", bg: "bg-vermilion-soft", border: "border-vermilion/30", label: "Running", animate: true },
  pending: { icon: Clock, color: "text-muted", bg: "bg-paper-dim", border: "border-line", label: "Queued" },
  failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-300/40", label: "Failed" },
};

export default function BrainPipelineAnimation() {
  const [currentStage, setCurrentStage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Simulate pipeline execution
  useEffect(() => {
    const runPipeline = async () => {
      for (let i = 0; i < stages.length; i++) {
        setCurrentStage(i);
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Ingesting ${stages[i].name}...`]);
        await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Completed ${stages[i].name}`]);
      }
      setTimeout(() => {
        setCurrentStage(0);
        setLogs([]);
        runPipeline();
      }, 3000);
    };

    const timer = setTimeout(runPipeline, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Pipeline Visualization */}
      <div className="relative mb-8">
        {/* Vertical connecting line */}
        <div className="absolute left-[60px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-vermilion/50 via-line to-line -z-10" />

        {stages.map((stage, i) => {
          const isActive = i === currentStage;
          const isCompleted = i < currentStage;
          const status = isCompleted ? "completed" : isActive ? "running" : "pending";
          const config = statusConfig[status];

          return (
            <motion.div
              key={stage.id}
              className="flex items-start gap-4 mb-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              {/* Status indicator */}
              <motion.div
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all relative z-10 ${config.bg} ${config.border} ${config.color}`}
                animate={{
                  scale: isActive ? [1, 1.1, 1] : 1,
                  boxShadow: isActive ? ["0 0 0 0 rgba(220,74,42,0.4)", "0 0 20px 5px rgba(220,74,42,0.2)"] : "none",
                }}
                transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
              >
                <config.icon className={`w-5 h-5 ${"animate" in config && config.animate ? "animate-spin" : ""}`} />
              </motion.div>

              {/* Stage content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h4 className={`font-mono text-sm font-bold uppercase tracking-wider ${isCompleted || isActive ? "text-ink" : "text-muted"}`}>
                    {stage.name}
                  </h4>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded ${config.bg} ${config.color} border ${config.border} uppercase tracking-widest`}>
                    {config.label}
                  </span>
                  {isActive && (
                    <motion.span
                      className="font-mono text-xs text-vermilion uppercase tracking-widest"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      Active
                    </motion.span>
                  )}
                </div>
                <p className={`font-mono text-xs leading-relaxed ${isCompleted || isActive ? "text-ink-soft" : "text-muted"}`}>
                  {stage.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live Log Panel — dark surface for legibility of monospace log */}
      <div className="bg-[#1C1A17] border border-line rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex items-center justify-between">
          <h5 className="font-mono text-xs uppercase tracking-widest text-paper-dim">Pipeline Execution Log</h5>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 bg-vermilion rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="font-mono text-xs text-vermilion">LIVE</span>
          </div>
        </div>
        <div className="p-4 font-mono text-[11px] text-paper-dim max-h-48 overflow-y-auto" style={{ fontFamily: "JetBrains Mono, monospace" }}>
          {logs.length === 0 ? (
            <div className="text-muted">Waiting for pipeline to start...</div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l-2 border-vermilion/40 pl-3"
                >
                  {log}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
