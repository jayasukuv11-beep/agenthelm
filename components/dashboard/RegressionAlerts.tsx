"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2, TrendingDown, Clock } from "lucide-react";

interface RegressionAlertsProps {
  agentId: string;
}

export function RegressionAlerts({ agentId }: RegressionAlertsProps) {
  const [regressions, setRegressions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadRegressions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sdk/evals/regression?agent_id=${agentId}`);
      if (res.ok) {
        const json = await res.json();
        setRegressions(json.regressions || []);
      }
    } catch (err) {
      console.error("Failed to load regressions", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegressions();
  }, [agentId]);

  async function acknowledge(id: string) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/sdk/evals/regression", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regression_id: id, acknowledged: true })
      });
      if (res.ok) {
        setRegressions(prev => prev.map(r => r.id === id ? { ...r, acknowledged: true } : r));
      }
    } catch (err) {
      console.error("Failed to acknowledge regression", err);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px] uppercase tracking-widest"><Loader2 className="w-4 h-4 animate-spin" /> Loading Regression Intel...</div>;
  }

  const activeRegressions = regressions.filter(r => !r.acknowledged);

  if (regressions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-mono tracking-wider font-bold text-white uppercase flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-500" /> Performance Regression Alerts
          {activeRegressions.length > 0 && (
            <Badge className="bg-red-500 text-white rounded-none text-[10px] ml-2 animate-pulse">{activeRegressions.length} NEW</Badge>
          )}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {regressions.map((reg) => (
          <div 
            key={reg.id} 
            className={`border rounded-none p-4 transition-all ${reg.acknowledged ? 'bg-zinc-900/20 border-zinc-800 opacity-60' : 'bg-red-500/5 border-red-500/30'}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest rounded-none border-zinc-700 bg-black text-zinc-400 font-mono">
                    Eval Set: {reg.agent_eval_sets?.name || "Unknown"}
                  </Badge>
                  {!reg.acknowledged && (
                    <Badge className="bg-red-500/10 text-red-500 border border-red-500/30 font-mono rounded-none uppercase text-[9px] tracking-widest">Urgent</Badge>
                  )}
                </div>
                <div className="text-sm font-mono text-white">
                  Regression detected in <span className="text-orange-500 font-bold">{reg.current_version}</span> against baseline <span className="text-zinc-500">{reg.baseline_version}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500 font-mono mb-1">Pass Rate Drop</div>
                    <div className="text-lg font-black font-mono text-red-500">
                      -{(reg.metric_delta * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="text-[10px] uppercase text-zinc-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(reg.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {!reg.acknowledged ? (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledge(reg.id)}
                  disabled={updatingId === reg.id}
                  className="rounded-none border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white font-mono text-[10px] uppercase tracking-widest h-8"
                >
                  {updatingId === reg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-2" />}
                  Acknowledge
                </Button>
              ) : (
                <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Resolved
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
