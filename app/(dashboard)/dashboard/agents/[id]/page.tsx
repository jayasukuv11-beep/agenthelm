"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Loader2, ShieldAlert } from "lucide-react";
import { ChatInterface } from "@/components/dashboard/ChatInterface";
import { TraceTimeline } from "@/components/dashboard/TraceTimeline";
import { CostBreakdown } from "@/components/dashboard/CostBreakdown";
import { GuardrailHealthScore } from "@/components/dashboard/guardrail-health-score";
import { SLAMetrics } from "@/components/dashboard/sla-metrics";
import { RegressionAlerts } from "@/components/dashboard/RegressionAlerts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AgentStatus = "running" | "idle" | "stopped" | "error";
type AgentType = "python" | "node" | "other";

type AgentRow = {
  id: string;
  user_id: string;
  name: string;
  status: AgentStatus;
  agent_type: AgentType;
  version: string | null;
  last_ping: string | null;
  error_message: string | null;
  created_at: string;
};

type ProfileRow = { plan: "free" | "indie" | "studio" };

type LogLevel = "info" | "warning" | "error" | "success";
type LogType = "log" | "error" | "output" | "tokens" | "chat_reply";

type AgentLogRow = {
  id: string;
  agent_id: string;
  type: LogType;
  level: LogLevel;
  message: string;
  data: Record<string, unknown> | null;
  tokens_used: number;
  model: string | null;
  created_at: string;
};

type CommandType = "start" | "stop" | "restart";

type LogFilter = "all" | "logs" | "errors" | "outputs" | "tokens";

function formatClock(ts: string) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function formatAgo(ts: string | null) {
  if (!ts) return "Never";
  const diffMs = Date.now() - new Date(ts).getTime();
  const s = Math.max(0, Math.floor(diffMs / 1000));
  if (s < 5) return "Just now";
  if (s < 60) return `${s} seconds ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  const days = Math.floor(h / 24);
  return `${days} days ago`;
}

function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function logMatchesFilter(log: AgentLogRow, filter: LogFilter) {
  switch (filter) {
    case "all":
      return true;
    case "logs":
      return log.type === "log";
    case "errors":
      return log.level === "error";
    case "outputs":
      return log.type === "output";
    case "tokens":
      return log.type === "tokens";
  }
}

function lineColorClass(log: AgentLogRow) {
  if (log.type === "output") return "text-orange-500";
  if (log.type === "tokens") return "text-blue-400";
  switch (log.level) {
    case "error":
      return "text-red-400";
    case "warning":
      return "text-yellow-400";
    case "success":
      return "text-orange-500";
    case "info":
    default:
      return "text-gray-300";
  }
}

function statusBadge(agent: AgentRow) {
  const status = agent.status;
  const base = "border-none";
  if (status === "running") {
    return (
      <Badge className={cn(base, "bg-orange-500/10 text-orange-500 font-mono border border-orange-500/20 rounded-none uppercase text-[10px]")}>
        <span className="mr-2 inline-flex items-center">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-none bg-orange-500 opacity-50"></span>
            <span className="relative inline-flex h-2 w-2 rounded-none bg-orange-500"></span>
          </span>
        </span>
        Running
      </Badge>
    );
  }
  if (status === "idle") return <Badge className={cn(base, "bg-yellow-500/10 text-yellow-400 font-mono border border-yellow-500/20 rounded-none uppercase text-[10px]")}>Idle</Badge>;
  if (status === "stopped") return <Badge className={cn(base, "bg-red-500/10 text-red-400 font-mono border border-red-500/20 rounded-none uppercase text-[10px]")}>Stopped</Badge>;
  return <Badge className={cn(base, "bg-red-500/10 text-red-400 font-mono border border-red-500/20 rounded-none uppercase text-[10px]")}>Error</Badge>;
}

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "logs";
  const supabase = useMemo(() => createClient(), []);
  const agentId = params.id;
  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

  const [loadingAgent, setLoadingAgent] = useState(true);
  const [agent, setAgent] = useState<AgentRow | null>(null);
  const [plan, setPlan] = useState<ProfileRow["plan"]>("free");
  const [lastPingLabel, setLastPingLabel] = useState("—");
  const [userId, setUserId] = useState<string | null>(null);

  const [commandLoading, setCommandLoading] = useState<CommandType | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Logs state
  const [logsLoading, setLogsLoading] = useState(true);
  const [logs, setLogs] = useState<AgentLogRow[]>([]);
  const [logsFilter, setLogsFilter] = useState<LogFilter>("all");
  const [search, setSearch] = useState("");
  const [clearAfterIso, setClearAfterIso] = useState<string | null>(null);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const [newLogsCount, setNewLogsCount] = useState(0);

  const [explainLoadingId, setExplainLoadingId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explainGateMsg, setExplainGateMsg] = useState<string | null>(null);

  // Stats
  const [statsLoading, setStatsLoading] = useState(true);
  const [tokensToday, setTokensToday] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [healthLogs, setHealthLogs] = useState<any[]>([]);
  const [healthToolExecs, setHealthToolExecs] = useState<any[]>([]);
  const [healthInterventions, setHealthInterventions] = useState<any[]>([]);
  const [errorRate, setErrorRate] = useState({ pct: 0, color: "text-orange-500" });
  const [lastActiveLabel, setLastActiveLabel] = useState("—");
  const [tokensPerHour, setTokensPerHour] = useState<{ hour: number; tokens: number }[]>(
    Array.from({ length: 24 }).map((_, i) => ({ hour: i, tokens: 0 }))
  );

  // Phase 5 State
  const [settingsName, setSettingsName] = useState("");
  const [settingsType, setSettingsType] = useState<AgentType>("python");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [blockMode, setBlockMode] = useState(true);
  const [evalResults, setEvalResults] = useState<any[]>([]);
  const [evalSets, setEvalSets] = useState<any[]>([]);

  const displayedLogs = logs
    .filter((l) => (clearAfterIso ? l.created_at > clearAfterIso : true))
    .filter((l) => logMatchesFilter(l, logsFilter))
    .filter((l) => (search.trim() ? l.message.toLowerCase().includes(search.trim().toLowerCase()) : true));

  const scrollToBottom = () => {
    const el = terminalRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const handleTerminalScroll = () => {
    const el = terminalRef.current;
    if (!el) return;
    const threshold = 24;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setAutoScrollPaused(!atBottom);
    if (atBottom) setNewLogsCount(0);
  };

  async function loadAgentAndPlan() {
    setLoadingAgent(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user && !testMode) {
      router.push("/login");
      return;
    }

    const userId = authData.user?.id ?? "test-user";
    setUserId(userId);

    if (testMode) {
      const now = new Date();
      const mockAgent: AgentRow = {
        id: agentId,
        user_id: userId,
        name: agentId === "agd_test_agent_1" ? "Local Python Agent" : "Test Agent",
        status: "running",
        agent_type: "python",
        version: "0.1.0",
        last_ping: now.toISOString(),
        error_message: null,
        created_at: now.toISOString(),
      };
      setAgent(mockAgent);
      setPlan("indie");
      setLastPingLabel(formatAgo(mockAgent.last_ping));
      setLoadingAgent(false);
      return;
    }

    const [{ data: agentData, error: agentErr }, { data: profileData, error: profileErr }] =
      await Promise.all([
        supabase.from("agents").select("*").eq("id", agentId).eq("user_id", userId).single(),
        supabase.from("profiles").select("plan").eq("id", userId).single(),
      ]);

    if (agentErr || !agentData) {
      router.push("/dashboard");
      return;
    }

    setAgent(agentData as AgentRow);
    setPlan(((profileErr ? null : profileData) as ProfileRow | null)?.plan ?? "free");
    setLastPingLabel(formatAgo((agentData as AgentRow).last_ping));

    // Phase 5: Initial fetch of permissions
    const { data: permData } = await supabase
      .from("agent_tool_permissions")
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle();
    
    if (permData) {
      setAllowedTools(permData.allowed_tools || []);
      setBlockMode(permData.block_mode ?? true);
    }

    setLoadingAgent(false);
  }

  async function loadInitialLogs() {
    setLogsLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user && !testMode) return;

    if (testMode) {
      const now = Date.now();
      const seed: AgentLogRow[] = [
        {
          id: "log_1",
          agent_id: agentId,
          type: "log",
          level: "info",
          message: "Agent boot sequence started",
          data: null,
          tokens_used: 0,
          model: null,
          created_at: new Date(now - 8000).toISOString(),
        },
        {
          id: "log_2",
          agent_id: agentId,
          type: "output",
          level: "success",
          message: "Output: hello world",
          data: { result: "ok" },
          tokens_used: 0,
          model: null,
          created_at: new Date(now - 5000).toISOString(),
        },
        {
          id: "log_3",
          agent_id: agentId,
          type: "log",
          level: "error",
          message: "ValueError: invalid config value",
          data: null,
          tokens_used: 0,
          model: null,
          created_at: new Date(now - 2000).toISOString(),
        },
      ];
      setLogs(seed);
      setLogsLoading(false);
      setTimeout(scrollToBottom, 0);
      return;
    }

    const days = plan === "free" ? 7 : plan === "indie" ? 30 : 90;
    const minDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("agent_logs")
      .select("*")
      .eq("agent_id", agentId)
      .gte("created_at", minDate)
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<AgentLogRow[]>();

    if (error) {
      setLogs([]);
      setLogsLoading(false);
      return;
    }

    setLogs((data ?? []).slice().reverse());
    setLogsLoading(false);
    setTimeout(scrollToBottom, 0);
  }

  async function loadStats() {
    setStatsLoading(true);
    const todayIso = todayStartIso();

    if (testMode) {
      setTokensToday(4321);
      setTotalLogs(123);
      setErrorRate({ pct: 12, color: "text-orange-500" });
      setLastActiveLabel("Just now");
      setTokensPerHour(
        Array.from({ length: 24 }).map((_, hour) => ({
          hour,
          tokens: hour < 8 ? 0 : hour < 12 ? 120 : hour < 15 ? 450 : hour < 20 ? 180 : 0,
        }))
      );
      setStatsLoading(false);
      return;
    }

    const [{ data: creditRows }, { count: logsCount }, { count: errorCount }, { data: lastLog }, {data: allLogs}, {data: allToolExecs}, {data: allInterventions}] =
      await Promise.all([
        supabase
          .from("credit_usage")
          .select("tokens_used,created_at")
          .eq("agent_id", agentId)
          .gte("created_at", todayIso),
        supabase
          .from("agent_logs")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", agentId),
        supabase
          .from("agent_logs")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", agentId)
          .eq("level", "error"),
        supabase
          .from("agent_logs")
          .select("created_at")
          .eq("agent_id", agentId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("agent_logs").select("type,level,message").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(500),
        supabase.from("tool_executions").select("classification,status,retry_count").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(500),
        supabase.from("agent_interventions").select("action_taken").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(500),
        supabase.from("agent_eval_results").select("*, agent_eval_sets(name, auto_generated)").eq("agent_id", agentId).order("created_at", { ascending: false }).limit(20),
      ]);

    setEvalResults(evalResults || []);

    const logsList = allLogs || [];
    const toolsList = allToolExecs || [];
    const interventionsList = allInterventions || [];
    setHealthLogs(logsList);
    setHealthToolExecs(toolsList);
    setHealthInterventions(interventionsList);

    const tokens = (creditRows ?? []).reduce((sum, r: any) => sum + Number(r.tokens_used ?? 0), 0);
    setTokensToday(tokens);

    const total = logsCount ?? 0;
    const errors = errorCount ?? 0;
    setTotalLogs(total);

    const pct = total > 0 ? Math.round((errors / total) * 100) : 0;
    const color = pct < 10 ? "text-orange-500" : pct < 30 ? "text-yellow-400" : "text-red-400";
    setErrorRate({ pct, color });

    const lastActiveTs = lastLog?.created_at ?? agent?.last_ping ?? null;
    setLastActiveLabel(formatAgo(lastActiveTs));

    // Tokens per hour
    const bins = Array.from({ length: 24 }).map((_, i) => ({ hour: i, tokens: 0 }));
    for (const row of creditRows ?? []) {
      const hour = new Date((row as any).created_at).getHours();
      bins[hour].tokens += Number((row as any).tokens_used ?? 0);
    }
    setTokensPerHour(bins);

    setStatsLoading(false);
  }

  useEffect(() => {
    loadAgentAndPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  useEffect(() => {
    if (!agent) return;
    setLastPingLabel(formatAgo(agent.last_ping));

    const interval = setInterval(() => {
      setLastPingLabel(formatAgo(agent.last_ping));
    }, 10_000);

    return () => clearInterval(interval);
  }, [agent?.last_ping]);

  useEffect(() => {
    if (!agent) return;

    if (testMode) return;
    const channel = supabase
      .channel(`agent-${agentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agents", filter: `id=eq.${agentId}` },
        (payload) => {
          const next = payload.new as AgentRow;
          setAgent(next);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, agentId, agent]);

  useEffect(() => {
    if (!agent) return;
    loadInitialLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.id]);

  useEffect(() => {
    if (!agent) return;

    if (testMode) return;
    const channel = supabase
      .channel(`logs-${agentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_logs", filter: `agent_id=eq.${agentId}` },
        (payload) => {
          const next = payload.new as AgentLogRow;
          setLogs((prev) => {
            const merged = [...prev, next];
            return merged.slice(-500);
          });

          if (autoScrollPaused) {
            setNewLogsCount((c) => c + 1);
          } else {
            setTimeout(scrollToBottom, 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, agentId, autoScrollPaused, agent]);

  useEffect(() => {
    if (!agent) return;
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.id]);

  async function sendCommand(command_type: CommandType) {
    setCommandLoading(command_type);
    try {
      await fetch("/api/sdk/command", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, command_type }),
      });
    } finally {
      setCommandLoading(null);
    }
  }

  async function confirmDelete() {
    if (!agent) return;
    setDeleteLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("agents")
        .delete()
        .eq("id", agentId)
        .eq("user_id", authData.user.id);

      if (error) return;
      router.push("/dashboard");
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  }

  async function explainLog(logId: string) {
    setExplainGateMsg(null);
    if (plan === "free") {
      setExplainGateMsg("Upgrade to Indie to use AI Analysis");
      return;
    }

    setExplainLoadingId(logId);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, log_id: logId }),
      });

      const json = (await res.json()) as any;
      if (!res.ok) {
        if (json?.error === "upgrade_required") {
          setExplainGateMsg(json?.message ?? "Upgrade required");
        }
        return;
      }

      const text = String(json?.explanation ?? "").trim();
      setExplanations((prev) => ({ ...prev, [logId]: text || "No explanation returned." }));
    } finally {
      setExplainLoadingId(null);
    }
  }

  async function saveSettings(nextName: string, nextType: AgentType) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;
    
    // Update core settings
    await supabase
      .from("agents")
      .update({ name: nextName, agent_type: nextType })
      .eq("id", agentId)
      .eq("user_id", authData.user.id);

    // Update Phase 5 Permissions
    await supabase
      .from("agent_tool_permissions")
      .upsert({
        agent_id: agentId,
        allowed_tools: allowedTools,
        block_mode: blockMode,
        updated_at: new Date().toISOString()
      }, { onConflict: 'agent_id' });
  }



  useEffect(() => {
    if (!agent) return;
    setSettingsName(agent.name);
    setSettingsType(agent.agent_type);
  }, [agent]);

  if (loadingAgent) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-lg border border-[#1f2937] bg-[#111111] p-6">
          <div className="h-6 w-40 rounded bg-[#1a1a1a]" />
          <div className="mt-4 h-10 w-72 rounded bg-[#1a1a1a]" />
        </div>
        <div className="animate-pulse rounded-lg border border-[#1f2937] bg-[#0a0a0a] p-6">
          <div className="h-40 rounded bg-black/50" />
        </div>
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#111] border-zinc-800 rounded-none relative overflow-hidden">
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Left */}
            <div className="space-y-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-[12px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
              >
                ← Back
              </button>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-black font-mono uppercase tracking-tight text-white">{agent.name}</h1>
                  {statusBadge(agent)}
                </div>

                {agent.status === "error" && agent.error_message ? (
                  <div className="text-sm text-red-400">{agent.error_message}</div>
                ) : null}

                <div className="text-sm text-gray-400">Last ping: {lastPingLabel}</div>
              </div>
            </div>

            {/* Right buttons */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:flex md:flex-wrap md:justify-end">
              <Button
                variant="outline"
                className="bg-transparent border-orange-500/30 text-orange-500 hover:bg-orange-500/10 font-mono text-[12px] uppercase rounded-none"
                onClick={() => sendCommand("start")}
                disabled={commandLoading !== null}
              >
                {commandLoading === "start" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "▶ "}
                Run Now
              </Button>

              <Button
                variant="outline"
                className="bg-transparent border-red-500/30 text-red-500 hover:bg-red-500/10 font-mono text-[12px] uppercase rounded-none"
                onClick={() => sendCommand("stop")}
                disabled={commandLoading !== null}
              >
                {commandLoading === "stop" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "⏹ "}
                Stop
              </Button>

              <Button
                variant="outline"
                className="bg-transparent border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-[12px] uppercase rounded-none"
                onClick={() => sendCommand("restart")}
                disabled={commandLoading !== null}
              >
                {commandLoading === "restart" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "🔄 "}
                Restart
              </Button>

              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 font-mono text-[12px] uppercase rounded-none"
                onClick={() => setDeleteOpen(true)}
              >
                🗑 Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => router.push(`/dashboard/agents/${agentId}?tab=${val}`, { scroll: false })}
        className="w-full"
      >
        <div className="overflow-x-auto border-b border-zinc-800 pb-px mb-6">
          <TabsList className="bg-transparent h-auto p-0 flex gap-6 w-full justify-start rounded-none">
            <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 font-mono text-[13px] uppercase tracking-wider rounded-none px-0 py-3 text-zinc-500 hover:text-white border-b-2 border-transparent">
              Logs
            </TabsTrigger>
            <TabsTrigger value="traces" className="data-[state=active]:bg-transparent data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 font-mono text-[13px] uppercase tracking-wider rounded-none px-0 py-3 text-zinc-500 hover:text-white border-b-2 border-transparent">
              Traces
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 font-mono text-[13px] uppercase tracking-wider rounded-none px-0 py-3 text-zinc-500 hover:text-white border-b-2 border-transparent">
              Chat
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-transparent data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 font-mono text-[13px] uppercase tracking-wider rounded-none px-0 py-3 text-zinc-500 hover:text-white border-b-2 border-transparent">
              Stats
            </TabsTrigger>
            <TabsTrigger value="evals" className="data-[state=active]:bg-transparent data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 font-mono text-[13px] uppercase tracking-wider rounded-none px-0 py-3 text-zinc-500 hover:text-white border-b-2 border-transparent">
              Evals
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 font-mono text-[13px] uppercase tracking-wider rounded-none px-0 py-3 text-zinc-500 hover:text-white border-b-2 border-transparent">
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Logs tab */}
        <TabsContent value="logs">
          <div className="rounded-lg border border-[#1f2937] bg-[#0a0a0a] p-4 space-y-4">
            {/* Filter + search + actions */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["all", "All"],
                    ["logs", "Logs"],
                    ["errors", "Errors"],
                    ["outputs", "Outputs"],
                    ["tokens", "Tokens"],
                  ] as const
                ).map(([key, label]) => {
                  const active = logsFilter === key;
                  return (
                    <Button
                      key={key}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      className={
                        active
                          ? "bg-orange-500 hover:bg-orange-600 text-white font-mono text-[12px] uppercase tracking-wider rounded-none"
                          : "bg-transparent border-zinc-800 text-zinc-500 hover:bg-[#111] hover:text-white font-mono text-[12px] uppercase tracking-wider rounded-none"
                      }
                      onClick={() => setLogsFilter(key)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Input
                  placeholder="Filter logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[#111] border-zinc-800 text-white placeholder:text-zinc-500 sm:w-64 font-mono text-[13px] rounded-none focus-visible:ring-orange-500/50"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-zinc-800 text-zinc-500 hover:bg-[#111] hover:text-white font-mono text-[12px] uppercase tracking-wider rounded-none"
                    onClick={() => setClearAfterIso(new Date().toISOString())}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-zinc-800 text-zinc-500 hover:bg-[#111] hover:text-white font-mono text-[12px] uppercase tracking-wider rounded-none"
                    onClick={() => {
                      const lines = displayedLogs.map((l) => {
                        const lvl = String(l.level ?? "info").toUpperCase();
                        return `[${formatClock(l.created_at)}] [${lvl}]  ${l.message}`;
                      });
                      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${agent.name.replaceAll(" ", "-")}-logs.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>

            {explainGateMsg ? (
              <div className="rounded border border-[#374151] bg-[#111827] p-3 text-sm text-gray-300">
                {explainGateMsg}
              </div>
            ) : null}

            {/* Terminal */}
            <div className="relative">
              <div
                ref={terminalRef}
                onScroll={handleTerminalScroll}
                className="bg-black font-mono text-[13px] p-4 h-[calc(100vh-280px)] overflow-y-auto rounded-md border border-[#1f2937]"
                style={{ fontFamily: "JetBrains Mono, 'Courier New', monospace" }}
              >
                {logsLoading ? (
                  <div className="text-gray-400">Loading logs...</div>
                ) : displayedLogs.length === 0 ? (
                  <div className="text-gray-500">No logs to display.</div>
                ) : (
                  <div className="space-y-1">
                    {displayedLogs.map((l) => {
                      const lvl = String(l.level ?? "info").toUpperCase();
                      const showExplain = l.level === "error";
                      const explanation = explanations[l.id];

                      return (
                        <div key={l.id}>
                          <div className={cn("flex items-start justify-between gap-3", lineColorClass(l))}>
                            <div className="min-w-0">
                              <span className="text-gray-500">[{formatClock(l.created_at)}]</span>{" "}
                              <span className="text-gray-400">[{lvl}]</span>{" "}
                              <span className="break-words">{l.message}</span>
                            </div>

                            {showExplain ? (
                              <button
                                title={
                                  plan === "free"
                                    ? "Upgrade to Indie to use AI Analysis"
                                    : "Explain this error"
                                }
                                onClick={() => explainLog(l.id)}
                                className="shrink-0 text-xs text-gray-400 hover:text-white border border-[#1f2937] rounded px-2 py-1 bg-[#111111]/40"
                                disabled={explainLoadingId === l.id}
                              >
                                {explainLoadingId === l.id ? "…" : "🤖 Explain"}
                              </button>
                            ) : null}
                          </div>

                          {explanation ? (
                            <div className="mt-2 rounded border border-[#374151] bg-[#111827] p-4 text-[#d1d5db]">
                              <div className="font-medium mb-2">🤖 AI Analysis</div>
                              <div className="text-sm leading-relaxed">{explanation}</div>
                              <div className="mt-3">
                                <button
                                  onClick={() =>
                                    setExplanations((prev) => {
                                      const next = { ...prev };
                                      delete next[l.id];
                                      return next;
                                    })
                                  }
                                  className="text-sm text-gray-300 hover:text-white"
                                >
                                  ✕ Close
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {autoScrollPaused && newLogsCount > 0 ? (
                <button
                  onClick={() => {
                    scrollToBottom();
                    setAutoScrollPaused(false);
                    setNewLogsCount(0);
                  }}
                  className="absolute bottom-4 right-4 rounded-full bg-[#10b981] hover:bg-[#059669] text-white text-sm px-4 py-2 shadow-lg"
                >
                  ↓ New logs ({newLogsCount})
                </button>
              ) : null}
            </div>
          </div>
        </TabsContent>

        {/* Chat tab */}
        <TabsContent value="chat">
          {userId ? (
            <ChatInterface
              agentId={agentId}
              userId={userId}
              agentName={agent.name}
              agentStatus={agent.status}
            />
          ) : (
            <div className="rounded-lg border border-[#1f2937] bg-[#0a0a0a] p-6">
              <div className="flex items-center justify-center h-64 text-gray-500">
                Loading chat...
              </div>
            </div>
          )}
        </TabsContent>

        {/* Traces tab */}
        <TabsContent value="traces">
          <TraceTimeline agentId={agentId} plan={plan} />
        </TabsContent>

        {/* Stats tab */}
        <TabsContent value="stats">
          <div className="rounded-none border border-zinc-800 bg-[#0a0a0a] p-6 space-y-6">
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-none border border-zinc-800 bg-[#111]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <GuardrailHealthScore 
                  plan={plan}
                  totalLogs={healthLogs}
                  totalToolExecutions={healthToolExecs}
                  injectionEvents={healthInterventions}
                />
                
                <div className="rounded-none border border-zinc-800 bg-[#111] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Tokens Today</div>
                  <div className="mt-2 text-2xl font-black font-mono text-white">{tokensToday.toLocaleString()}</div>
                </div>
                <div className="rounded-none border border-zinc-800 bg-[#111] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Total Logs</div>
                  <div className="mt-2 text-2xl font-black font-mono text-white">{totalLogs.toLocaleString()}</div>
                </div>
                <div className="bg-[#111] p-4 border border-zinc-800 rounded-none hover:border-zinc-700 transition-colors group">
                  <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex justify-between items-center">
                    Error Rate
                    <ShieldAlert className="w-4 h-4 text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                  </div>
                  <div className={cn("mt-2 text-2xl font-black font-mono", errorRate.color)}>
                    {errorRate.pct}%
                  </div>
                </div>
                <div className="rounded-none border border-zinc-800 bg-[#111] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">Last Active</div>
                  <div className="mt-2 text-2xl font-black font-mono text-white">{lastActiveLabel}</div>
                </div>
              </div>
            )}

            <div className="rounded-none border border-zinc-800 bg-[#111] p-4">
              <div className="text-[13px] font-mono uppercase tracking-wider font-bold text-white mb-4">Tokens per hour today</div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tokensPerHour}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      stroke="#71717a"
                      tickFormatter={(h) => String(h).padStart(2, "0")}
                      style={{ fontSize: 12, fontFamily: 'monospace' }}
                    />
                    <YAxis stroke="#71717a" style={{ fontSize: 12, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", color: "#fff", fontFamily: 'monospace', fontSize: 12 }}
                      labelStyle={{ color: "#71717a" }}
                      cursor={{fill: '#27272a'}}
                    />
                    <Bar dataKey="tokens" fill="#f97316" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <CostBreakdown agentId={agentId} plan={plan} currency="USD" />
            
            {/* Phase 4: SLA / Latency Metrics */}
            {(plan === "indie" || plan === "studio") && (
              <div className="rounded-none border border-zinc-800 bg-[#111] p-4 space-y-3">
                <div className="text-[13px] font-mono uppercase tracking-wider font-bold text-white flex items-center gap-2">
                  ⏱️ SLA / Latency Contracts
                  {plan !== "studio" && (
                    <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-widest border-zinc-700 text-zinc-500 ml-2 rounded-none">Basic</Badge>
                  )}
                </div>
                <SLAMetrics agentId={agentId} plan={plan} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* Evals tab */}
        <TabsContent value="evals">
          <div className="rounded-none border border-zinc-800 bg-[#0a0a0a] p-6 space-y-8">
            {/* Feature 9: Regression Intel */}
            <div className="pb-6 border-b border-zinc-800">
              <RegressionAlerts agentId={agentId} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-mono tracking-wider font-bold text-white uppercase">Evaluation Runner</h3>
                <p className="text-sm font-mono text-zinc-500 mt-1">Golden test results and semantic scoring.</p>
              </div>
              <Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/30 font-mono rounded-none uppercase text-[10px] tracking-widest">Studio Required</Badge>
            </div>

            <div className="space-y-4">
              {evalResults.length === 0 ? (
                <div className="text-center py-12 rounded-none border border-dashed border-zinc-800 bg-[#111]">
                  <div className="text-zinc-500 font-mono text-[13px] uppercase tracking-wider mb-2">No evaluation runs yet.</div>
                  <div className="text-xs text-zinc-600 font-mono">Use <code className="text-orange-500">dock.run_evals()</code> in your SDK to trigger tests.</div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-none border border-zinc-800">
                  <table className="w-full text-[13px] font-mono text-left">
                    <thead className="bg-[#111] text-zinc-500 uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-3">Scenario</th>
                        <th className="px-4 py-3">Result</th>
                        <th className="px-4 py-3">Matched</th>
                        <th className="px-4 py-3">Latency</th>
                        <th className="px-4 py-3">Scores</th>
                        <th className="px-4 py-3 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                      {evalResults.map((res: any) => (
                        <tr key={res.id} className="hover:bg-[#111] transition-colors">
                          <td className="px-4 py-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              {res.agent_eval_sets?.name}
                              {res.agent_eval_sets?.auto_generated && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-none text-[8px] uppercase tracking-tighter">Trace</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {res.passed ? (
                              <Badge className="bg-orange-500/10 text-orange-500 border border-orange-500/30 rounded-none text-[10px]">PASS</Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-none text-[10px]">FAIL</Badge>
                            )}
                          </td>
                          <td className="px-4 py-4">{res.tool_matches ? "✅ Tools" : "❌ Tools"}</td>
                          <td className="px-4 py-4">{res.latency_ms}ms</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {res.semantic_scores && Object.entries(res.semantic_scores).map(([k, v]: any) => (
                                <span key={k} className="text-[10px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded-none border border-orange-500/20">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right text-xs text-zinc-500">{formatAgo(res.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Settings tab */}
        <TabsContent value="settings">
          <div className="rounded-none border border-zinc-800 bg-[#0a0a0a] p-6 space-y-6">
            <div className="rounded-none border border-zinc-800 bg-[#111] p-4 space-y-4">
              <div>
                <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-2 font-bold">Agent name</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="bg-[#0a0a0a] border-zinc-800 text-white font-mono rounded-none focus-visible:ring-orange-500/50"
                  />
                  <Button
                    onClick={async () => {
                      setSettingsSaving(true);
                      try {
                        await saveSettings(settingsName.trim() || agent.name, settingsType);
                      } finally {
                        setSettingsSaving(false);
                      }
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold rounded-none uppercase"
                    disabled={settingsSaving}
                  >
                    {settingsSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-2 font-bold">Agent type</div>
                <select
                  value={settingsType}
                  onChange={(e) => setSettingsType(e.target.value as AgentType)}
                  className="h-10 w-full rounded-none border border-zinc-800 bg-[#0a0a0a] px-3 font-mono text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 uppercase"
                >
                  <option value="python">python</option>
                  <option value="node">node</option>
                  <option value="other">other</option>
                </select>
              </div>
            </div>

            <div className="rounded-none border border-zinc-800 bg-[#111] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-mono font-bold tracking-wider text-white uppercase">Scoped Tool Permissions</h3>
                  <p className="text-sm text-zinc-500 mt-1 font-mono">Prevent unauthorized tool execution in production.</p>
                </div>
                {plan !== 'studio' && <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10 font-mono text-[10px] uppercase rounded-none tracking-widest px-2 py-0.5">Studio Pro Only</Badge>}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-none bg-[#0a0a0a] border border-zinc-800 group hover:border-zinc-700 transition-colors">
                  <div className="space-y-1">
                    <div className="text-sm font-bold font-mono text-white uppercase tracking-wider">Strict Block Mode</div>
                    <div className="text-xs text-zinc-500 font-mono">Blocked tools will throw a RuntimeError immediately.</div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={blockMode} 
                    onChange={(e) => setBlockMode(e.target.checked)}
                    className="h-4 w-4 rounded-none border-zinc-700 bg-[#111] text-orange-500 focus:ring-offset-[#111] focus:ring-orange-500"
                  />
                </div>

                <div>
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-2 font-bold">Allowed Tools (comma separated)</div>
                  <Input
                    placeholder="e.g. search_web, send_email, write_file"
                    value={allowedTools.join(", ")}
                    onChange={(e) => setAllowedTools(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    className="bg-[#0a0a0a] border-zinc-800 text-white font-mono rounded-none focus-visible:ring-orange-500/50"
                  />
                  <p className="mt-2 text-[11px] font-mono text-zinc-500 uppercase">
                    If empty, all tools are allowed for backward compatibility.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-none border border-red-500/30 bg-[#111] p-6 relative overflow-hidden group hover:border-red-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl pointer-events-none group-hover:bg-red-500/10 transition-colors" />
              <div className="text-[13px] text-red-500 font-bold font-mono tracking-wider uppercase mb-1">Danger Zone</div>
              <div className="text-sm font-mono text-zinc-500 mb-6">
                Deleting an agent removes it and all its logs permanently.
              </div>
              <Button
                className="bg-transparent border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white font-mono font-bold rounded-none uppercase transition-all"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Agent
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-[#111] border-zinc-800 text-white rounded-none">
          <DialogHeader>
            <DialogTitle className="font-mono tracking-widest uppercase">Delete {agent.name}?</DialogTitle>
            <DialogDescription className="text-zinc-500 font-mono">
              This will permanently delete the agent and all its logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              className="bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-none font-mono uppercase text-[12px]"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white rounded-none font-mono font-bold uppercase text-[12px]"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

