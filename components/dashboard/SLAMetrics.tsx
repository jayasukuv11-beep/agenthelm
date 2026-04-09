"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

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

      // Fetch tasks with latency_ms recorded
      const { data: tasks } = await supabase
        .from("agent_tasks")
        .select("latency_ms")
        .eq("agent_id", agentId)
        .not("latency_ms", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);

      // Fetch SLA breach logs
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
          <div key={i} className="h-16 bg-[#0a0a0a] rounded border border-[#1f2937]" />
        ))}
      </div>
    );
  }

  if (totalTasks === 0) {
    return (
      <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-[#1f2937] rounded">
        No latency data recorded yet. Ensure your agent records <code className="text-green-400">latency_ms</code> via the SDK.
      </div>
    );
  }

  const formatMs = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0a0a0a] border border-[#1f2937] rounded p-3">
          <div className="text-xs text-gray-500">p50 Latency</div>
          <div className="text-lg font-semibold text-white mt-1">{formatMs(p50)}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-[#1f2937] rounded p-3">
          <div className="text-xs text-gray-500">p95 Latency</div>
          <div className="text-lg font-semibold text-yellow-400 mt-1">{formatMs(p95)}</div>
        </div>
        {plan === "studio" && (
          <div className="bg-[#0a0a0a] border border-[#1f2937] rounded p-3">
            <div className="text-xs text-gray-500">p99 Latency</div>
            <div className="text-lg font-semibold text-orange-400 mt-1">{formatMs(p99)}</div>
          </div>
        )}
        <div className="bg-[#0a0a0a] border border-[#1f2937] rounded p-3">
          <div className="text-xs text-gray-500">SLA Breaches</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-lg font-semibold ${breaches > 0 ? "text-red-400" : "text-green-400"}`}>
              {breaches}
            </span>
            {breaches === 0 && (
              <Badge variant="outline" className="text-[10px] border-green-500 text-green-400">✓ Healthy</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Based on {totalTasks} task{totalTasks !== 1 ? "s" : ""} with latency data.
      </div>
    </div>
  );
}
