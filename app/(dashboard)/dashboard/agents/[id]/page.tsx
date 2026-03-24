"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2 } from "lucide-react";
import { ChatInterface } from "@/components/dashboard/ChatInterface";
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
  if (log.type === "output") return "text-green-400";
  if (log.type === "tokens") return "text-blue-400";
  switch (log.level) {
    case "error":
      return "text-red-400";
    case "warning":
      return "text-yellow-400";
    case "success":
      return "text-green-400";
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
      <Badge className={cn(base, "bg-green-500/20 text-green-400")}>
        <span className="mr-2 inline-flex items-center">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400"></span>
          </span>
        </span>
        Running
      </Badge>
    );
  }
  if (status === "idle") return <Badge className={cn(base, "bg-yellow-500/20 text-yellow-400")}>Idle</Badge>;
  if (status === "stopped") return <Badge className={cn(base, "bg-red-500/20 text-red-400")}>Stopped</Badge>;
  return <Badge className={cn(base, "bg-red-500/20 text-red-400")}>Error</Badge>;
}

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
  const [errorRate, setErrorRate] = useState({ pct: 0, color: "text-green-400" });
  const [lastActiveLabel, setLastActiveLabel] = useState("—");
  const [tokensPerHour, setTokensPerHour] = useState<{ hour: number; tokens: number }[]>(
    Array.from({ length: 24 }).map((_, i) => ({ hour: i, tokens: 0 }))
  );

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
      setErrorRate({ pct: 12.2, color: "text-yellow-400" });
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

    const [{ data: creditRows }, { count: logsCount }, { count: errorCount }, { data: lastLog }] =
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
      ]);

    const tokens = (creditRows ?? []).reduce((sum, r: any) => sum + Number(r.tokens_used ?? 0), 0);
    setTokensToday(tokens);

    const total = logsCount ?? 0;
    const errors = errorCount ?? 0;
    setTotalLogs(total);

    const pct = total > 0 ? (errors / total) * 100 : 0;
    const color = pct < 10 ? "text-green-400" : pct < 30 ? "text-yellow-400" : "text-red-400";
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
    await supabase
      .from("agents")
      .update({ name: nextName, agent_type: nextType })
      .eq("id", agentId)
      .eq("user_id", authData.user.id);
  }

  const [settingsName, setSettingsName] = useState("");
  const [settingsType, setSettingsType] = useState<AgentType>("python");
  const [settingsSaving, setSettingsSaving] = useState(false);

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
      <Card className="bg-[#111111] border-[#1f2937]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Left */}
            <div className="space-y-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Back to /dashboard
              </button>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold text-white tracking-tight">{agent.name}</h1>
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
                className="bg-transparent border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/10"
                onClick={() => sendCommand("start")}
                disabled={commandLoading !== null}
              >
                {commandLoading === "start" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "▶"}
                Run Now
              </Button>

              <Button
                variant="outline"
                className="bg-transparent border-red-500/40 text-red-400 hover:bg-red-500/10"
                onClick={() => sendCommand("stop")}
                disabled={commandLoading !== null}
              >
                {commandLoading === "stop" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "⏹"}
                Stop
              </Button>

              <Button
                variant="outline"
                className="bg-transparent border-[#2d3748] text-gray-200 hover:bg-[#1a1a1a]"
                onClick={() => sendCommand("restart")}
                disabled={commandLoading !== null}
              >
                {commandLoading === "restart" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "🔄"}
                Restart
              </Button>

              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => setDeleteOpen(true)}
              >
                🗑 Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="logs" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="bg-[#0a0a0a] border border-[#1f2937]">
            <TabsTrigger value="logs" className="data-[state=active]:bg-[#111111] data-[state=active]:text-white">
              Logs
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-[#111111] data-[state=active]:text-white">
              Chat
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-[#111111] data-[state=active]:text-white">
              Stats
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#111111] data-[state=active]:text-white">
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
                          ? "bg-[#10b981] hover:bg-[#059669] text-white"
                          : "bg-transparent border-[#2d3748] text-gray-200 hover:bg-[#1a1a1a]"
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
                  className="bg-[#111111] border-[#1f2937] text-white placeholder:text-gray-500 sm:w-64"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#2d3748] text-gray-200 hover:bg-[#1a1a1a]"
                    onClick={() => setClearAfterIso(new Date().toISOString())}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent border-[#2d3748] text-gray-200 hover:bg-[#1a1a1a]"
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

        {/* Stats tab */}
        <TabsContent value="stats">
          <div className="rounded-lg border border-[#1f2937] bg-[#0a0a0a] p-6 space-y-6">
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-lg border border-[#1f2937] bg-[#111111]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#1f2937] bg-[#111111] p-4">
                  <div className="text-sm text-gray-400">Tokens Today</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{tokensToday.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-[#1f2937] bg-[#111111] p-4">
                  <div className="text-sm text-gray-400">Total Logs</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{totalLogs.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-[#1f2937] bg-[#111111] p-4">
                  <div className="text-sm text-gray-400">Error Rate</div>
                  <div className={cn("mt-2 text-2xl font-semibold", errorRate.color)}>
                    {errorRate.pct.toFixed(1)}%
                  </div>
                </div>
                <div className="rounded-lg border border-[#1f2937] bg-[#111111] p-4">
                  <div className="text-sm text-gray-400">Last Active</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{lastActiveLabel}</div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-[#1f2937] bg-[#111111] p-4">
              <div className="text-sm font-medium text-white mb-4">Tokens per hour today</div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tokensPerHour}>
                    <CartesianGrid stroke="#1f2937" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      stroke="#9ca3af"
                      tickFormatter={(h) => String(h).padStart(2, "0")}
                    />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ background: "#0a0a0a", border: "1px solid #1f2937", color: "#fff" }}
                      labelStyle={{ color: "#9ca3af" }}
                    />
                    <Bar dataKey="tokens" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Settings tab */}
        <TabsContent value="settings">
          <div className="rounded-lg border border-[#1f2937] bg-[#0a0a0a] p-6 space-y-6">
            <div className="rounded-lg border border-[#1f2937] bg-[#111111] p-4 space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Agent name</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="bg-[#0a0a0a] border-[#1f2937] text-white"
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
                    className="bg-[#10b981] hover:bg-[#059669] text-white"
                    disabled={settingsSaving}
                  >
                    {settingsSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-2">Agent type</div>
                <select
                  value={settingsType}
                  onChange={(e) => setSettingsType(e.target.value as AgentType)}
                  className="h-10 w-full rounded-md border border-[#1f2937] bg-[#0a0a0a] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                >
                  <option value="python">python</option>
                  <option value="node">node</option>
                  <option value="other">other</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
              <div className="text-white font-medium">Danger Zone</div>
              <div className="text-sm text-gray-400 mt-1">
                Deleting an agent removes it and all its logs permanently.
              </div>
              <div className="mt-4">
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete Agent
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-[#111111] border-[#1f2937] text-white">
          <DialogHeader>
            <DialogTitle>Delete {agent.name}?</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will permanently delete the agent and all its logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="bg-transparent border-[#2d3748] text-gray-200 hover:bg-[#1a1a1a]"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
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

