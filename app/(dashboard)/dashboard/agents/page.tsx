"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AgentDetailCard, type AgentDetailCardProps } from "@/components/dashboard/AgentDetailCard";
import { Inbox, Zap } from "lucide-react";
import { loadDemoData } from "@/app/actions/demo";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AgentsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const [agents, setAgents] = useState<AgentDetailCardProps[]>([]);
  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
  const { toast } = useToast();

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      await loadDemoData();
      toast({
        title: "SUCCESS",
        description: "Demo data loaded. Welcome to AgentHelm!",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "ERROR",
        description: "Failed to load demo data.",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    let subscription: any;

    const load = async () => {
      setLoading(true);
      if (testMode) {
        const now = new Date();
        setAgents([
          {
            id: "agd_test_agent_1",
            name: "Local Python Agent",
            status: "running",
            type: "python",
            version: "0.1.0",
            lastPing: now.toISOString(),
            currentProject: "agenthelm-core",
            lastContextInjection: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
            tokensInjected: 12450,
            brainVersion: "v3.2.1",
            currentTask: "Implementing context injection pipeline for Brain v3.2.1",
            publishedProposals: 3,
          },
          {
            id: "agd_test_agent_2",
            name: "Node Worker",
            status: "idle",
            type: "node",
            version: "0.1.0",
            lastPing: new Date(now.getTime() - 1000 * 90).toISOString(),
            currentProject: "agenthelm-core",
            lastContextInjection: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
            tokensInjected: 8200,
            brainVersion: "v3.2.0",
            currentTask: "Waiting for new task assignment",
            publishedProposals: 1,
          },
          {
            id: "agd_test_agent_3",
            name: "Crashed Agent",
            status: "error",
            type: "other",
            version: "0.1.0",
            lastPing: new Date(now.getTime() - 1000 * 12).toISOString(),
            errorMessage: "ConnectionError: failed to reach upstream model",
            currentProject: "agenthelm-core",
            lastContextInjection: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
            tokensInjected: 4100,
            brainVersion: "v3.1.5",
            currentTask: "Failed during proposal submission",
            publishedProposals: 0,
          },
        ]);
        setLoading(false);
        return;
      }
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false });

      const mapped = (data ?? []).map((a: any) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        type: a.agent_type,
        version: a.version,
        lastPing: a.last_ping,
        errorMessage: a.error_message,
        currentProject: a.current_project,
        lastContextInjection: a.last_context_injection,
        tokensInjected: a.tokens_injected,
        brainVersion: a.brain_version,
        currentTask: a.current_task,
        publishedProposals: a.published_proposals,
      }));
      setAgents(mapped);
      setLoading(false);

      subscription = supabase
        .channel("public:agents")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "agents", filter: `user_id=eq.${authData.user.id}` },
          async () => {
            const { data: refreshed } = await supabase
              .from("agents")
              .select("*")
              .eq("user_id", authData.user.id)
              .order("created_at", { ascending: false });

            setAgents(
              (refreshed ?? []).map((a: any) => ({
                id: a.id,
                name: a.name,
                status: a.status,
                type: a.agent_type,
                version: a.version,
                lastPing: a.last_ping,
                errorMessage: a.error_message,
                currentProject: a.current_project,
                lastContextInjection: a.last_context_injection,
                tokensInjected: a.tokens_injected,
                brainVersion: a.brain_version,
                currentTask: a.current_task,
                publishedProposals: a.published_proposals,
              }))
            );
          }
        )
        .subscribe();
    };

    load();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [supabase, testMode]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-52 rounded bg-[#111111] border border-[#1f2937]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-[#111111] border border-[#1f2937]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-mono uppercase">Agents</h1>
          <p className="text-zinc-400 mt-1 font-mono text-sm">Connected agents and their Project Brain status.</p>
        </div>
        <div className="flex items-center gap-2">
          {agents.length === 0 && (
            <Button
              variant="outline"
              onClick={handleLoadDemo}
              disabled={demoLoading}
              className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-[12px] uppercase rounded-none gap-2"
            >
              {demoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              LOAD DEMO
            </Button>
          )}
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#111] border border-zinc-800 border-dashed rounded-xl text-center">
          <div className="w-16 h-16 bg-zinc-900/50 rounded-xl flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2 font-mono uppercase tracking-wider">No agents connected</h3>
          <p className="text-zinc-400 max-w-sm font-mono text-sm mb-6">
            Connect your first agent to start building the Project Brain.
          </p>
          <Button
            onClick={handleLoadDemo}
            disabled={demoLoading}
            className="bg-white text-black hover:bg-zinc-200 rounded-none font-mono text-[13px] uppercase px-8 h-12 tracking-widest gap-2"
          >
            {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            LOAD SAMPLE AGENTS
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <AgentDetailCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}