"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert, ArrowDown, ArrowUp, Zap, Lock, Siren, RefreshCcw, Hand } from "lucide-react";
import { UpgradeButton } from "@/components/dashboard/UpgradeButton";

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

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Guardrail Health
          </CardTitle>
          <span className="text-2xl font-bold">{metrics.score}%</span>
        </div>
        <CardDescription>Live health score based on recent guardrail activations</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 relative overflow-hidden">
        <Progress 
          value={metrics.score} 
          className="h-2" 
          indicatorColor={metrics.score > 80 ? "bg-emerald-500" : metrics.score > 50 ? "bg-amber-500" : "bg-red-500"}
        />

        {!isPremium && (
          <div className="absolute inset-0 top-12 z-10 backdrop-blur-[2px] bg-background/50 flex flex-col items-center justify-center pt-4">
            <Lock className="w-5 h-5 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Detailed Breakdown Available on Indie+</p>
            <UpgradeButton plan={plan as any} label="Upgrade" className="mt-2 text-xs h-8" />
          </div>
        )}

        <div className={!isPremium ? "opacity-20 select-none pointer-events-none" : ""}>
          <div className="grid grid-cols-2 gap-4 text-xs mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground"><RefreshCcw className="w-3 h-3"/> Side-effect retries</span>
                <span className="font-mono">{metrics.sideEffectRetries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Hand className="w-3 h-3"/> Irreversible rejects</span>
                <span className="font-mono">{metrics.irreversibleRejects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Siren className="w-3 h-3"/> Loop detections</span>
                <span className="font-mono">{metrics.loops}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldAlert className="w-3 h-3"/> Injection blocks
                </span>
                <span className="font-mono flex items-center gap-1">
                  {metrics.injectionBlocks} 
                  {metrics.injectionBlocks > 0 && <ArrowUp className="w-3 h-3 text-red-500" />}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="w-3 h-3"/> Hard limit kills
                </span>
                <span className="font-mono flex items-center gap-1">
                  {metrics.hardLimits}
                  {metrics.hardLimits === 0 && <span className="text-emerald-500">✅</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
