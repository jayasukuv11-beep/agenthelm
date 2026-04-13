"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert, ArrowDown, ArrowUp, Zap, Lock, Siren, RefreshCcw, Hand } from "lucide-react";
import { UpgradeButton } from "@/components/dashboard/UpgradeButton";
import { cn } from "@/lib/utils";

interface HealthProps {
  plan: string;
  totalLogs: any[];
  totalToolExecutions: any[];
  injectionEvents: any[];
}

export function GuardrailHealthScore({ plan, totalLogs, totalToolExecutions, injectionEvents }: HealthProps) {
  const isPremium = plan === "indie" || plan === "studio";

  const metrics = useMemo(() => {
    const hardLimits = totalLogs.filter(l => l.type === "hard_limit").length;
    const loops = totalLogs.filter(l => l.type === "loop_detected").length;
    
    const sideEffectRetries = totalToolExecutions.filter(t => t.classification === "side_effect" && t.retry_count > 0).length;
    const irreversibleRejects = totalToolExecutions.filter(t => t.classification === "irreversible" && t.status.includes("reject")).length;
    
    const injectionBlocks = injectionEvents.filter(e => e.action_taken === "blocked" || e.action_taken === "warned").length;

    // Formula: starting from 100, deduct based on weighted severity
    let score = 100 - (hardLimits * 5) - (injectionBlocks * 3) - (loops * 2) - (sideEffectRetries * 1) - (irreversibleRejects * 1);
    
    // Clamp
    score = Math.max(0, Math.min(100, score));

    return { score, hardLimits, loops, sideEffectRetries, irreversibleRejects, injectionBlocks };
  }, [totalLogs, totalToolExecutions, injectionEvents]);

  const anomalies = useMemo(() => {
    const list: { type: string; msg: string; time: string; severity: 'low' | 'med' | 'high' }[] = [];

    totalLogs.forEach(l => {
      if (l.type === "hard_limit") {
        list.push({ type: "CRASH", msg: "Hard limit reached. Agent killed.", time: l.created_at, severity: 'high' });
      }
      if (l.type === "loop_detected") {
        list.push({ type: "LOOP", msg: "Infinite loop detected and broken.", time: l.created_at, severity: 'med' });
      }
    });

    totalToolExecutions.forEach(t => {
      if (t.classification === "side_effect" && t.retry_count > 0) {
        list.push({ type: "RETRY", msg: `Side-effect retry (${t.retry_count}) for ${t.tool_name}`, time: t.created_at, severity: 'low' });
      }
      if (t.classification === "irreversible" && t.status.includes("reject")) {
        list.push({ type: "REJECT", msg: `User rejected irreversible tool: ${t.tool_name}`, time: t.created_at, severity: 'low' });
      }
    });

    injectionEvents.forEach(e => {
      if (e.action_taken === "blocked" || e.action_taken === "warned") {
        list.push({ type: "GUARD", msg: `Prompt injection ${e.action_taken}: ${e.system_tag}`, time: e.created_at, severity: 'high' });
      }
    });

    return list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
  }, [totalLogs, totalToolExecutions, injectionEvents]);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-[#111] border-zinc-800 rounded-none shadow-sm">
      <CardHeader className="pb-4 border-b border-zinc-800/50 mb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[12px] font-mono uppercase tracking-widest font-bold flex items-center gap-2 text-white">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            Guardrail Health
          </CardTitle>
          <span className="text-[20px] font-mono font-black text-white">{metrics.score}%</span>
        </div>
        <CardDescription className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Live health score based on recent guardrail activations</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative overflow-hidden">
        <Progress 
          value={metrics.score} 
          className="h-2 rounded-none bg-zinc-800" 
          indicatorColor={metrics.score > 80 ? "bg-orange-500" : metrics.score > 50 ? "bg-yellow-500" : "bg-red-500"}
        />

        {!isPremium && (
          <div className="absolute inset-0 top-12 z-10 backdrop-blur-[2px] bg-[#050505]/70 flex flex-col items-center justify-center pt-4">
            <Lock className="w-5 h-5 text-zinc-500 mb-2" />
            <p className="text-[11px] font-mono uppercase tracking-widest text-white font-bold">Detailed Breakdown Available on Indie+</p>
            <UpgradeButton plan={plan as any} label="Upgrade" className="mt-3 text-[10px] h-8 rounded-none uppercase tracking-widest font-mono" />
          </div>
        )}

        <div className={!isPremium ? "opacity-20 select-none pointer-events-none" : ""}>
          <div className="grid grid-cols-2 gap-4 text-[10px] font-mono uppercase tracking-widest mt-6 pb-6 border-b border-zinc-800/50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-500"><RefreshCcw className="w-3 h-3 text-zinc-400"/> Side-effect retries</span>
                <span className="font-mono text-zinc-300 font-bold">{metrics.sideEffectRetries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-500"><Hand className="w-3 h-3 text-zinc-400"/> Irreversible rejects</span>
                <span className="font-mono text-zinc-300 font-bold">{metrics.irreversibleRejects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-500"><Siren className="w-3 h-3 text-zinc-400"/> Loop detections</span>
                <span className="font-mono text-zinc-300 font-bold">{metrics.loops}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-500">
                  <ShieldAlert className="w-3 h-3 text-zinc-400"/> Injection blocks
                </span>
                <span className="font-mono flex items-center gap-1 text-zinc-300 font-bold">
                  {metrics.injectionBlocks} 
                  {metrics.injectionBlocks > 0 && <ArrowUp className="w-3 h-3 text-red-500" />}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-zinc-500">
                  <Zap className="w-3 h-3 text-zinc-400"/> Hard limit kills
                </span>
                <span className="font-mono flex items-center gap-1 text-zinc-300 font-bold">
                  {metrics.hardLimits}
                  {metrics.hardLimits === 0 && <span className="text-orange-500">✅</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Anomalies List */}
          <div className="mt-6 space-y-3">
            <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Recent Anomalies</h4>
            {anomalies.length === 0 ? (
              <div className="text-[10px] font-mono text-zinc-600 italic">No recent anomalies detected. System stable.</div>
            ) : (
              <div className="space-y-2">
                {anomalies.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-black/30 border border-zinc-800/50 hover:border-orange-500/20 transition-colors">
                    <span className={cn(
                      "text-[9px] font-mono font-bold px-1.5 py-0.5 min-w-[50px] text-center",
                      a.severity === 'high' ? "bg-red-500/20 text-red-400" : 
                      a.severity === 'med' ? "bg-yellow-500/20 text-yellow-400" : 
                      "bg-zinc-500/20 text-zinc-400"
                    )}>
                      {a.type}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 truncate flex-1">{a.msg}</span>
                    <span className="text-[9px] font-mono text-zinc-600 whitespace-nowrap">
                      {new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
