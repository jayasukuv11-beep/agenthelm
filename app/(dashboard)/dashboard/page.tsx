"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { AgentCard, type AgentCardProps } from "@/components/dashboard/AgentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Inbox, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const [agents, setAgents] = useState<AgentCardProps[]>([]);
  const [stats, setStats] = useState({ total: 0, running: 0, tokens: 0, cost: 0 });
  const [connectKey, setConnectKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

  useEffect(() => {
    let agentSubscription: any;

    const loadDashboardData = async () => {
      setLoading(true);
      if (testMode) {
        const now = new Date();
        const mockAgents: AgentCardProps[] = [
          {
            id: "agd_test_agent_1",
            name: "Local Python Agent",
            status: "running",
            type: "python",
            version: "0.1.0",
            lastPing: now.toISOString(),
          },
          {
            id: "agd_test_agent_2",
            name: "Node Worker",
            status: "idle",
            type: "node",
            version: "0.1.0",
            lastPing: new Date(now.getTime() - 1000 * 90).toISOString(),
          },
          {
            id: "agd_test_agent_3",
            name: "Crashed Agent",
            status: "error",
            type: "other",
            version: "0.1.0",
            lastPing: new Date(now.getTime() - 1000 * 12).toISOString(),
            errorMessage: "ConnectionError: failed to reach upstream model",
          },
        ];
        setConnectKey("agd_live_aaaaaaaaaaaaaaaa");
        setAgents(mockAgents);
        setStats({ total: mockAgents.length, running: 1, tokens: 12345, cost: 0.0123 });
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile for connect key
      const { data: profile } = await supabase
        .from('profiles')
        .select('connect_key')
        .eq('id', user.id)
        .single();
        
      if (profile?.connect_key) setConnectKey(profile.connect_key);

      // Fetch Agents
      const { data: agentsData } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (agentsData) {
        const mappedAgents = agentsData.map(a => ({
          id: a.id,
          name: a.name,
          status: a.status as any,
          type: a.agent_type,
          version: a.version,
          lastPing: a.last_ping,
          errorMessage: a.error_message
        }));
        setAgents(mappedAgents);
        
        // Compute basic stats
        const running = mappedAgents.filter(a => a.status === 'running').length;
        setStats(prev => ({ ...prev, total: mappedAgents.length, running }));
      }

      // Fetch valid token usage (today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: usageData } = await supabase
        .from('credit_usage')
        .select('tokens_used, cost_usd')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (usageData) {
        let t = 0;
        let c = 0;
        usageData.forEach(u => {
          t += u.tokens_used;
          c += Number(u.cost_usd);
        });
        setStats(prev => ({ ...prev, tokens: t, cost: c }));
      }

      setLoading(false);

      // Subscribe to real-time agent changes
      agentSubscription = supabase
        .channel('public:agents')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'agents', filter: `user_id=eq.${user.id}` },
          (payload) => {
             // Basic refresh approach for MVP (optimally we'd apply the delta locally)
             refreshAgents(user.id);
          }
        )
        .subscribe();
    };

    const refreshAgents = async (userId: string) => {
       const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
       if (data) {
         setAgents(data.map(a => ({
          id: a.id, name: a.name, status: a.status as any, type: a.agent_type,
          version: a.version, lastPing: a.last_ping, errorMessage: a.error_message
         })));
         setStats(prev => ({ 
           ...prev, 
           total: data.length, 
           running: data.filter(a => a.status === 'running').length 
         }));
       }
    };

    loadDashboardData();

    return () => {
      if (agentSubscription) supabase.removeChannel(agentSubscription);
    };
  }, [supabase, testMode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(connectKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-24 bg-[#111111] border border-[#1f2937] rounded-lg"></div>
      <div className="h-64 bg-[#111111] border border-[#1f2937] rounded-lg"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-gray-400 mt-1">Monitor the pulse of your AI fleet.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[#10b981] hover:bg-[#059669] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Connect Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111111] border-[#1f2937] text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect a new agent</DialogTitle>
              <DialogDescription className="text-gray-400">
                Install the SDK and use this key to authenticate your agent.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                 <p className="text-sm font-medium text-gray-300">1. Install SDK</p>
                 <div className="bg-black/50 p-3 rounded-md border border-[#1f2937] flex items-center justify-between">
                    <code className="text-sm font-mono text-gray-300">pip install agentdock-sdk</code>
                 </div>
              </div>
              <div className="space-y-2">
                 <p className="text-sm font-medium text-gray-300">2. Authenticate with your key</p>
                 <div className="flex space-x-2">
                    <Input 
                      value={connectKey || "Loading..."} 
                      readOnly 
                      className="bg-[#1a1a1a] border-[#2d3748] font-mono text-[#10b981]" 
                    />
                    <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0 border-[#2d3748] bg-[#1a1a1a] hover:bg-[#2d3748] hover:text-white">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                 </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <StatsRow 
        totalAgents={stats.total}
        runningAgents={stats.running}
        tokensUsed={stats.tokens}
        cost={stats.cost}
      />

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Your Agents</h2>
        
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#111111] border border-[#1f2937] border-dashed rounded-lg text-center">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No agents connected</h3>
            <p className="text-gray-400 max-w-sm mb-6">
              You haven't connected any agents yet. Install the SDK and connect your first agent to see it here.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-[#10b981] text-[#10b981] hover:bg-[#10b981]/10 bg-transparent">
                  Get Connection Key
                </Button>
              </DialogTrigger>
              {/* Inherits dialog content from above via modal portal in practice, 
                 but for simplicity we just rely on the first button. 
                 Since this is an empty state, we can duplicate the trigger content if desired. */}
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
