"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Bot, ArrowRight, Activity, Lock } from "lucide-react";
import { UpgradeButton } from "@/components/dashboard/UpgradeButton";

export default function SwarmsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [handoffs, setHandoffs] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      
      if (!authData.user) {
        if (process.env.NEXT_PUBLIC_TEST_MODE !== "true") {
          router.push("/login");
          return;
        }
        setProfile({ plan: "indie" });
        setLoading(false);
        return;
      }

      const { data: profileReq } = await supabase.from("profiles").select("plan").eq("id", authData.user.id).single();
      setProfile(profileReq);

      if (profileReq?.plan === "studio") {
        // Find all agents for user to fetch all handoffs
        const { data: agents } = await supabase.from("agents").select("id").eq("user_id", authData.user.id);
        if (agents && agents.length > 0) {
          const agentIds = agents.map(a => a.id);
          const { data: handoffReq } = await supabase
            .from("agent_handoffs")
            .select("*, from_agent:from_agent_id(name), to_agent:to_agent_id(name)")
            .in("from_agent_id", agentIds)
            .order("created_at", { ascending: false })
            .limit(100);
            
          setHandoffs(handoffReq || []);
        }
      }

      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-[#111] rounded-none border border-zinc-800"></div>
      <div className="h-64 bg-[#111] rounded-none border border-zinc-800"></div>
    </div>;
  }

  const isStudio = profile?.plan === "studio";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-none">
          <Network className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-[20px] font-mono font-black tracking-widest text-white uppercase">Multi-Agent Coordination</h1>
          <p className="text-[12px] font-mono text-zinc-500 uppercase tracking-wider mt-1">Monitor handoffs, swarms, and agent-to-agent communication in real time.</p>
        </div>
      </div>

      {!isStudio ? (
        <Card className="border-zinc-800 bg-[#111] relative overflow-hidden rounded-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-[14px] font-mono font-bold uppercase flex items-center gap-2 tracking-widest text-white">
              <Lock className="w-4 h-4 text-orange-400" />
              Studio Feature
            </CardTitle>
            <CardDescription className="text-[12px] font-mono uppercase text-zinc-500 max-w-2xl tracking-wider pt-2 leading-relaxed">
              Unlock the Multi-Agent Coordination view to trace exact handoff lineages, debug infinite delegation loops, and monitor peer-to-peer swarming telemetry.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <UpgradeButton plan={profile?.plan} label="Upgrade to Studio" className="w-[200px]" />
            <div className="mt-8 opacity-20 relative pointer-events-none filter blur-[2px] transition-all">
               <div className="flex items-center gap-8 justify-center py-12 border border-zinc-800 rounded-none bg-[#0a0a0a]">
                <Bot className="w-16 h-16 text-zinc-500" />
                <ArrowRight className="w-8 h-8 text-zinc-600" />
                <Bot className="w-16 h-16 text-orange-500/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main List */}
          <Card className="lg:col-span-2 border-zinc-800 bg-[#111] rounded-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-[13px] font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" /> Recent Handoffs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {handoffs.length === 0 ? (
                <div className="text-center py-12 text-[12px] font-mono text-zinc-500 uppercase tracking-wider border border-zinc-800 border-dashed rounded-none bg-[#0a0a0a]">
                  No swarms or agent handoffs recorded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {handoffs.map((handoff) => (
                    <div key={handoff.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-zinc-800 rounded-none group hover:border-zinc-700 transition">
                      <div className="flex items-center gap-4">
                        <div className="text-[12px] font-mono font-bold tracking-wider uppercase flex items-center gap-2 text-zinc-400">
                          <Bot className="w-4 h-4 text-zinc-500" />
                          {handoff.from_agent?.name || "Unknown"}
                        </div>
                        <ArrowRight className="w-4 h-4 text-zinc-600" />
                        <div className="text-[12px] font-mono font-bold tracking-wider uppercase flex items-center gap-2 text-orange-500">
                          <Bot className="w-4 h-4 text-orange-500" />
                          {handoff.to_agent?.name || handoff.to_agent_id?.slice(0,8)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-zinc-500">
                          {handoff.latency_ms ? `${handoff.latency_ms}ms` : '—'}
                        </span>
                        <Badge variant="outline" className={
                          handoff.status === "completed" ? "border-green-500/30 text-green-400 bg-green-500/10 rounded-none uppercase text-[10px]" :
                          handoff.status === "failed" ? "border-red-500/30 text-red-500 bg-red-500/10 rounded-none uppercase text-[10px]" : "border-yellow-500/30 text-yellow-500 bg-yellow-500/10 rounded-none uppercase text-[10px]"
                        }>
                          {handoff.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side Info */}
          <Card className="border-zinc-800 bg-[#111] rounded-none shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-[13px] font-mono font-bold tracking-widest uppercase text-white">Integration Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-mono text-[11px] text-zinc-500 uppercase tracking-wider leading-relaxed">
              <p>To enable handoff tracking, use the <code className="text-orange-500">dock.swarms.handoff()</code> method in your agent code.</p>
              <div className="bg-[#0a0a0a] border border-zinc-800 p-4 rounded-none font-mono text-[12px] overflow-x-auto text-orange-400 lowercase tracking-normal">
                dock.swarms.handoff(<br/>
                &nbsp;&nbsp;"research_agent_id",<br/>
                &nbsp;&nbsp;&#123; query: "..." &#125;<br/>
                )
              </div>
              <p>AgentHelm automatically creates a deterministic causal link between the parent and child traces.</p>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
