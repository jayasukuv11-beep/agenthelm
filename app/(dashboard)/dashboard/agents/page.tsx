"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AgentCard, type AgentCardProps } from "@/components/dashboard/AgentCard";
import { Inbox } from "lucide-react";

export default function AgentsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentCardProps[]>([]);
  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

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
            <div key={i} className="h-48 rounded-lg bg-[#111111] border border-[#1f2937]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Agents</h1>
          <p className="text-gray-400 mt-1">All agents connected to your workspace.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">
          ← Back to overview
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#111111] border border-[#1f2937] border-dashed rounded-lg text-center">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No agents connected</h3>
          <p className="text-gray-400 max-w-sm">
            Go to the overview page to get your connect key and connect your first agent.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

