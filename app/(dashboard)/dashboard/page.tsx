"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { AgentCard, type AgentCardProps } from "@/components/dashboard/AgentCard";
import ProjectBrainPanel from "@/components/dashboard/ProjectBrainPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Check, Zap, Loader2, Brain, GitBranch, FileText, Shield, Clock, Activity, Inbox } from "lucide-react";
import { loadDemoData } from "@/app/actions/demo";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
}

function DashboardContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [agents, setAgents] = useState<AgentCardProps[]>([]);
  const [stats, setStats] = useState({
    brainVersion: "—",
    knowledgeEntries: 0,
    pendingProposals: 0,
    contextCoverage: 0,
    pipelineSuccessRate: 0,
    securityScore: 0,
    latestPublish: "Never"
  });

  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: 'pipeline' | 'proposal' | 'publish' | 'security';
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'running' | 'pending' | 'failed';
  }>>([]);

  const [currency, setCurrency] = useState<string>("USD");
  const [connectKey, setConnectKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

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

  // Load projects list
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        const projectsList = data.projects || [];
        setProjects(projectsList);

        const queryProjId = searchParams.get("project");
        if (queryProjId && projectsList.some((p: Project) => p.id === queryProjId)) {
          setSelectedProjectId(queryProjId);
        } else if (projectsList.length > 0) {
          setSelectedProjectId(projectsList[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  // Load project-specific metrics
  const fetchProjectMetrics = async (projectId: string) => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/health`);
      if (res.ok) {
        const data = await res.json();
        setStats({
          brainVersion: `v${data.health.latest_version}`,
          knowledgeEntries: data.stats.total_entries,
          pendingProposals: data.stats.proposals.pending + data.stats.proposals.reviewing,
          contextCoverage: data.health.quality_score,
          pipelineSuccessRate: data.health.trust_score,
          securityScore: data.health.average_confidence,
          latestPublish: data.health.last_updated
            ? new Date(data.health.last_updated).toLocaleDateString()
            : "Never"
        });
      }
    } catch (err) {
      console.error("Failed to fetch project health metrics:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [searchParams]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectMetrics(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    let agentSubscription: any;

    const loadDashboardData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch Profile for connect key and currency
      const { data: profile } = await supabase
        .from('profiles')
        .select('connect_key, preferred_currency')
        .eq('id', user.id)
        .single();

      if (profile?.connect_key) setConnectKey(profile.connect_key);
      if (profile?.preferred_currency) setCurrency(profile.preferred_currency);

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
      }

      // Fetch recent knowledge proposals for activity feed
      const { data: proposals } = await supabase
        .from('knowledge_proposals')
        .select('id, summary, author, build_status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (proposals) {
        setRecentActivity(proposals.map(p => ({
          id: p.id,
          type: 'proposal',
          title: `Proposal: ${p.summary}`,
          description: `Submitted by ${p.author}`,
          timestamp: new Date(p.created_at).toLocaleTimeString(),
          status: p.build_status === 'merged' ? 'success' : p.build_status === 'rejected' ? 'failed' : 'pending'
        })));
      }

      setLoading(false);

      // Subscribe to real-time agent changes
      agentSubscription = supabase
        .channel('public:agents')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'agents', filter: `user_id=eq.${user.id}` },
          () => {
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
       }
    };

    loadDashboardData();

    return () => {
      if (agentSubscription) supabase.removeChannel(agentSubscription);
    };
  }, [supabase]);

  const handleCopy = () => {
    navigator.clipboard.writeText(connectKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    router.push(`/dashboard?project=${projId}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8 max-w-6xl mx-auto">
        <div className="h-24 bg-[#111] border border-zinc-800"></div>
        <div className="h-64 bg-[#111] border border-zinc-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight font-mono uppercase">
            Overview
          </h1>
          <p className="text-zinc-500 mt-1 font-mono text-sm">
            Project Brain health and system overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="px-3 py-2 bg-[#111] border border-zinc-800 text-white font-mono text-sm focus:ring-1 focus:ring-orange-500 outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {!loading && projects.length === 0 && (
            <Button
              variant="outline"
              onClick={handleLoadDemo}
              disabled={demoLoading}
              className="hidden sm:flex border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-[12px] uppercase rounded-none gap-2"
            >
              {demoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              LOAD DEMO
            </Button>
          )}

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold rounded-none shadow-[0_0_20px_-5px_rgba(255,87,34,0.4)]">
                <Plus className="w-4 h-4 mr-2" />
                CONNECT AGENT
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111] border-zinc-800 text-white sm:max-w-md rounded-none">
              <DialogHeader>
                <DialogTitle className="font-mono uppercase tracking-widest text-lg">Connect a new agent</DialogTitle>
                <DialogDescription className="text-zinc-500 font-mono text-sm">
                  Install the SDK and use this key to authenticate your agent.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                   <p className="text-[11px] uppercase tracking-widest font-mono text-zinc-400 font-bold">1. Install SDK</p>
                   <div className="bg-black/50 p-3 border border-zinc-800 flex items-center justify-between">
                      <code className="text-[13px] font-mono text-zinc-300">pip install agenthelm-sdk</code>
                   </div>
                </div>
                <div className="space-y-2">
                   <p className="text-[11px] uppercase tracking-widest font-mono text-zinc-400 font-bold">2. Authenticate with your key</p>
                   <div className="flex space-x-2">
                      <Input
                        value={connectKey || "Loading..."}
                        readOnly
                        className="bg-[#0a0a0a] border-zinc-800 font-mono text-orange-500 rounded-none focus-visible:ring-orange-500/50 text-[13px]"
                      />
                      <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0 border-zinc-800 bg-[#0a0a0a] hover:bg-zinc-800 hover:text-white rounded-none">
                        {copied ? <Check className="h-4 w-4 text-orange-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                   </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6 border border-zinc-700">
            <Inbox className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider mb-2">
            No Projects Found
          </h3>
          <p className="text-zinc-500 font-mono text-sm mb-6 max-w-md">
            Welcome to AgentHelm! Click the button below to load the demo workspace.
          </p>
          <Button
            onClick={handleLoadDemo}
            disabled={demoLoading}
            className="bg-orange-500 hover:bg-orange-600 text-black font-mono uppercase text-xs tracking-wider gap-2"
          >
            {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Load Demo Data
          </Button>
        </div>
      ) : (
        <>
          {/* Project Brain Health Stats */}
          <StatsRow
            brainVersion={stats.brainVersion}
            knowledgeEntries={stats.knowledgeEntries}
            pendingProposals={stats.pendingProposals}
            contextCoverage={stats.contextCoverage}
            pipelineSuccessRate={stats.pipelineSuccessRate}
            securityScore={stats.securityScore}
            latestPublish={stats.latestPublish}
          />

          {/* Project Brain Overview Panel */}
          {selectedProjectId && (
            <div className="mb-8">
              <ProjectBrainPanel projectId={selectedProjectId} />
            </div>
          )}

          {/* Active Agents Grid */}
          <div className="space-y-4">
            <h2 className="text-[11px] font-mono font-bold text-zinc-500 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-zinc-700 block"></span> ACTIVE AGENTS ({agents.length})
            </h2>

            {agents.length === 0 ? (
              <div className="text-center py-12 bg-[#111] border border-zinc-800 rounded-xl">
                <p className="text-zinc-500 font-mono">No active agents connected. Click 'Connect Agent' to start.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="space-y-4 mt-8">
            <h2 className="text-[11px] font-mono font-bold text-zinc-500 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-zinc-700 block"></span> RECENT ACTIVITY
            </h2>

            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 bg-[#111] border border-zinc-800 border-dashed text-center">
                <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-none border border-orange-500/20 flex items-center justify-center mb-8 relative">
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
                <h2 className="text-xl font-black font-mono text-white mb-3 uppercase tracking-tight">No activity yet</h2>
                <p className="text-zinc-500 font-mono text-sm max-w-md mx-auto leading-relaxed">
                  Pipeline runs, proposals, and brain publishes will appear here once agents start working.
                </p>
              </div>
            ) : (
              <div className="space-y-3 bg-[#111] border border-zinc-800 rounded-xl p-6">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center py-3 border-b border-zinc-800 last:border-0">
                    <div>
                      <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider">{activity.title}</h4>
                      <p className="text-zinc-500 font-mono text-xs">{activity.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 font-mono text-xs block">{activity.timestamp}</span>
                      <span className={`text-[10px] font-mono font-bold uppercase ${
                        activity.status === 'success' ? 'text-green-400' : activity.status === 'failed' ? 'text-red-400' : 'text-amber-400'
                      }`}>{activity.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-8 max-w-6xl mx-auto p-6">
        <div className="h-24 bg-[#111] border border-zinc-800"></div>
        <div className="h-64 bg-[#111] border border-zinc-800"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}