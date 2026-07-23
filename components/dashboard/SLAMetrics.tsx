"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

interface SLAMetricsProps {
  agentId: string;
  plan: string;
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function SLAMetrics({ agentId, plan }: SLAMetricsProps) {
  const [loading, setLoading] = useState(true);
  const [p50, setP50] = useState(0);
  const [p95, setP95] = useState(0);
  const [p99, setP99] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [breaches, setBreaches] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: tasks } = await supabase
        .from("agent_tasks")
        .select("latency_ms")
        .eq("agent_id", agentId)
        .not("latency_ms", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);

      const { count: breachCount } = await supabase
        .from("agent_logs")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agentId)
        .eq("type", "sla_breach");

      const latencies = (tasks || []).map((t: any) => t.latency_ms).filter(Boolean);

      setTotalTasks(latencies.length);
      setP50(percentile(latencies, 50));
      setP95(percentile(latencies, 95));
      setP99(percentile(latencies, 99));
      setBreaches(breachCount || 0);
      setLoading(false);
    }
    load();
  }, [agentId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-[#0a0a0a] rounded-none border border-zinc-800" />
        ))}
      </div>
    );
  }

  if (totalTasks === 0) {
    return (
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 py-4 text-center border border-dashed border-zinc-800 rounded-none bg-[#0a0a0a]">
        No latency data recorded yet. Ensure your agent records <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 border border-indigo-500/30 font-bold">latency_ms</code> via the SDK.
      </div>
    );
  }

  const formatMs = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-none p-4 shadow-sm hover:border-zinc-600 transition-colors">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">p50 Latency</div>
          <div className="text-[20px] font-mono font-black text-white mt-1">{formatMs(p50)}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-none p-4 shadow-sm hover:border-zinc-600 transition-colors">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">p95 Latency</div>
          <div className="text-[20px] font-mono font-black text-yellow-500 mt-1">{formatMs(p95)}</div>
        </div>
        {plan === "studio" && (
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-none p-4 shadow-sm hover:border-zinc-600 transition-colors">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">p99 Latency</div>
            <div className="text-[20px] font-mono font-black text-indigo-400 mt-1">{formatMs(p99)}</div>
          </div>
        )}
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-none p-4 shadow-sm hover:border-zinc-600 transition-colors">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">SLA Breaches</div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[20px] font-mono font-black ${breaches > 0 ? "text-red-500" : "text-indigo-400"}`}>
              {breaches}
            </span>
            {breaches === 0 && (
              <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-emerald-500/30 text-emerald-400 rounded-none bg-emerald-500/10 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Healthy
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
        Based on {totalTasks} task{totalTasks !== 1 ? "s" : ""} with latency data.
      </div>
    </div>
  );
}
