"use client";

import React from "react";
import { Zap, Shield, Search, GitMerge, Package, Brain, CheckCircle, Loader2, Clock, XCircle, Activity, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { TechnicalLabel } from "@/components/dashboard/TechnicalLabel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";

export default function PipelinePage() {
  const [currentStage, setCurrentStage] = React.useState(0);
  const [metrics, setMetrics] = React.useState<Record<string, { count: number; avgTime: string; successRate: string }>>({
    proposal: { count: 24, avgTime: "180ms", successRate: "96%" },
    sanitize: { count: 24, avgTime: "120ms", successRate: "98%" },
    permissions: { count: 24, avgTime: "80ms", successRate: "99%" },
    replay: { count: 24, avgTime: "40ms", successRate: "100%" },
    verification: { count: 22, avgTime: "450ms", successRate: "91%" },
    analysis: { count: 18, avgTime: "750ms", successRate: "88%" },
    merge: { count: 15, avgTime: "280ms", successRate: "92%" },
    publish: { count: 12, avgTime: "190ms", successRate: "95%" }
  });

  const stages = [
    { id: "proposal", name: "Proposal", icon: Zap, desc: "Agent submits knowledge proposal" },
    { id: "sanitize", name: "Sanitize", icon: Shield, desc: "Remove secrets, PII, normalize formatting" },
    { id: "permissions", name: "Permissions", icon: Shield, desc: "Validate agent permissions and scope" },
    { id: "replay", name: "Replay Protection", icon: Shield, desc: "Cryptographic nonce verification" },
    { id: "verification", name: "Verification", icon: Search, desc: "Evidence scoring and confidence calculation" },
    { id: "analysis", name: "Knowledge Analysis", icon: FileText, desc: "Pattern extraction and conflict detection" },
    { id: "merge", name: "Merge Planning", icon: GitMerge, desc: "Conflict resolution and merge planning" },
    { id: "publish", name: "Publishing", icon: Package, desc: "Create brain version and notify subscribers" }
  ];

  // Simulate pipeline processing
  React.useEffect(() => {
    const simulatePipeline = async () => {
      for (let i = 0; i < stages.length; i++) {
        setCurrentStage(i);
        const stageId = stages[i].id;

        // Update metrics to show processing
        setMetrics(prev => ({
          ...prev,
          [stageId]: {
            ...prev[stageId],
            successRate: `${Math.floor(Math.random() * 20) + 80}%`
          }
        }));

        await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
      }

      setTimeout(() => {
        setCurrentStage(0);
        simulatePipeline();
      }, 3000);
    };

    const timer = setTimeout(simulatePipeline, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight font-mono uppercase">
            Brain Pipeline
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Visualize and monitor the knowledge processing pipeline
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-mono text-zinc-500 hover:text-white hover:bg-zinc-800/50 border border-zinc-800 transition-colors"
          >
            <GitMerge className="w-4 h-4" />
            Run Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Overview Stats */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <TechnicalLabel className="block mb-4">Pipeline Overview</TechnicalLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                  <stage.icon className="w-5 h-5 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider truncate">
                    {stage.name}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">
                    {stage.desc}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-[11px] font-mono border-t border-zinc-900 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Success:</span>
                  <span className={`font-bold ${Number(metrics[stage.id]?.successRate.replace("%", "")) >= 95 ? "text-green-400" : "text-yellow-400"}`}>
                    {metrics[stage.id]?.successRate || "0%"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Latency:</span>
                  <span className="text-zinc-400">{metrics[stage.id]?.avgTime || "0ms"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Items:</span>
                  <span className="text-zinc-400">{metrics[stage.id]?.count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Flow Visualization */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <TechnicalLabel className="block mb-6">Pipeline Flow</TechnicalLabel>
        <div className="relative max-w-2xl">
          {/* Vertical connector */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500/50 via-zinc-700 to-zinc-700 -z-10" />

          <div className="space-y-8">
            {stages.map((stage, index) => {
              const isActive = index === currentStage;
              const isCompleted = index < currentStage;
              const status = isCompleted ? "success" : isActive ? "running" : "pending";

              return (
                <motion.div
                  key={stage.id}
                  className="flex items-start gap-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  {/* Status indicator */}
                  <div className="relative z-10 group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                      isActive ? "bg-orange-500/20 border-orange-500/50 text-orange-500 scale-110" :
                      isCompleted ? "bg-green-500/10 border-green-500/30 text-green-400" :
                      "bg-zinc-900 border-zinc-800 text-zinc-600"
                    }`}>
                      {isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : <stage.icon className="w-5 h-5" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={`font-mono text-sm font-bold uppercase tracking-wider ${isCompleted || isActive ? "text-white" : "text-zinc-600"}`}>
                        {stage.name}
                      </h4>
                      <StatusBadge status={status} />
                    </div>
                    <p className={`font-mono text-xs leading-relaxed ${isCompleted || isActive ? "text-zinc-400" : "text-zinc-600"}`}>
                      {stage.desc}
                    </p>
                    {isActive && (
                      <motion.div
                        className="mt-2 p-2 bg-orange-500/5 border border-orange-500/10 rounded text-[10px] font-mono text-orange-400"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Processing item #{metrics[stage.id]?.count || 0} in stream...
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Final Target: Project Brain */}
          <motion.div
            className="flex items-center gap-6 mt-8 pl-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stages.length * 0.1, duration: 0.4 }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 bg-orange-500/20 border-orange-500/30 text-orange-500 shadow-[0_0_20px_-5px_rgba(255,87,34,0.5)]">
              <Brain className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                Project Brain
              </h4>
              <p className="font-mono text-xs text-zinc-500">
                Knowledge integrated and ready for context injection
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Pipeline Controls */}
      <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
        <TechnicalLabel className="block mb-6">Pipeline Controls</TechnicalLabel>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <TechnicalLabel variant="muted" className="block mb-3">Manual Triggers</TechnicalLabel>
            <div className="space-y-3">
              {[
                { label: "Process Pending Proposals", icon: GitMerge },
                { label: "Retry Failed Items", icon: Loader2 },
                { label: "Clear Completed", icon: CheckCircle }
              ].map((btn) => (
                <button
                  key={btn.label}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border border-zinc-800 rounded-xl font-mono text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors group"
                >
                  <span>{btn.label}</span>
                  <btn.icon className="w-4 h-4 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <TechnicalLabel variant="muted" className="block mb-3">Pipeline Settings</TechnicalLabel>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-zinc-800 rounded-xl">
                <div className="space-y-1">
                  <p className="text-xs font-mono text-white">Auto-processing</p>
                  <p className="text-[10px] font-mono text-zinc-500">Process proposals automatically</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-orange-500 bg-zinc-900 border-zinc-800 rounded"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-500 mb-1">Notification Level</label>
                <select className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-800 rounded-none text-zinc-400 font-mono text-xs focus:ring-1 focus:ring-orange-500 outline-none">
                  <option value="all">All Events</option>
                  <option value="errors" selected>Errors Only</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-500 mb-1">Retry Attempts</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  defaultValue="3"
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-zinc-800 rounded-none text-zinc-400 font-mono text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
