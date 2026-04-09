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
      <div className="h-20 bg-[#111111] rounded-md border border-[#1f2937]"></div>
      <div className="h-64 bg-[#111111] rounded-md border border-[#1f2937]"></div>
    </div>;
  }

  const isStudio = profile?.plan === "studio";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#10b981]/10 rounded-lg">
          <Network className="w-6 h-6 text-[#10b981]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Multi-Agent Coordination</h1>
          <p className="text-sm text-gray-400">Monitor handoffs, swarms, and agent-to-agent communication in real time.</p>
        </div>
      </div>

      {!isStudio ? (
        <Card className="border-[#1f2937] bg-gradient-to-b from-[#111111] to-[#0a0a0a] relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              Studio Feature
            </CardTitle>
            <CardDescription className="text-base text-gray-400 max-w-2xl">
              Unlock the Multi-Agent Coordination view to trace exact handoff lineages, debug infinite delegation loops, and monitor peer-to-peer swarming telemetry.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <UpgradeButton plan={profile?.plan} label="Upgrade to Studio" className="w-[200px]" />
            <div className="mt-8 opacity-20 relative pointer-events-none filter blur-[2px] transition-all">
               <div className="flex items-center gap-8 justify-center py-12 border border-[#1f2937] rounded bg-background/50">
                <Bot className="w-16 h-16" />
                <ArrowRight className="w-8 h-8" />
                <Bot className="w-16 h-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main List */}
          <Card className="lg:col-span-2 border-[#1f2937] bg-[#111111]">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#10b981]" /> Recent Handoffs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {handoffs.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500 border border-[#1f2937] border-dashed rounded-md">
                  No swarms or agent handoffs recorded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {handoffs.map((handoff) => (
                    <div key={handoff.id} className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#1f2937] rounded-md group hover:border-gray-700 transition">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium flex items-center gap-2 text-gray-300">
                          <Bot className="w-4 h-4 text-gray-500" />
                          {handoff.from_agent?.name || "Unknown"}
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                        <div className="text-sm font-medium flex items-center gap-2 text-[#10b981]">
                          <Bot className="w-4 h-4 text-[#10b981]" />
                          {handoff.to_agent?.name || handoff.to_agent_id?.slice(0,8)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-500 font-mono">
                          {handoff.latency_ms ? `${handoff.latency_ms}ms` : '—'}
                        </span>
                        <Badge variant="outline" className={
                          handoff.status === "completed" ? "border-green-500 text-green-400" :
                          handoff.status === "failed" ? "border-red-500 text-red-400" : "border-yellow-500 text-yellow-400"
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
          <Card className="border-[#1f2937] bg-[#111111] h-fit">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Integration Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-400">
              <p>To enable handoff tracking, use the <code>dock.swarms.handoff()</code> method in your agent code.</p>
              <div className="bg-[#0a0a0a] border border-[#1f2937] p-3 rounded font-mono text-xs overflow-x-auto text-green-400">
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
