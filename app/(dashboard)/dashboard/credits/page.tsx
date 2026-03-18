"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Zap, DollarSign, Cpu, Calendar, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type CreditRow = {
  tokens_used: number;
  cost_usd: number;
  created_at: string;
  model: string | null;
  agent_id: string | null;
};

type MonthlySummary = {
  total_tokens: number;
  total_cost: number;
  total_calls: number;
};

type DailyPoint = {
  date: string;
  tokens: number;
  cost: number;
};

type AgentBreakdown = {
  agent_id: string;
  name: string;
  tokens: number;
  cost: number;
  calls: number;
  last_active: string | null;
};

type ModelBreakdown = {
  model: string;
  tokens: number;
  cost: number;
};

type PlanInfo = {
  plan: "free" | "indie" | "studio";
  tokens_limit_monthly: number;
};

type RangeKey = "this-month" | "last-month" | "last-7";

type SortKey = "tokens" | "cost" | "percent";
type SortDir = "asc" | "desc";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

function formatTokensShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatTokensFull(n: number): string {
  return n.toLocaleString();
}

function formatCost(n: number): string {
  if (n < 0.01 && n > 0) return "< $0.01";
  return `$${n.toFixed(2)}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDaysUntilReset(now = new Date()): number {
  const year = now.getFullYear();
  const month = now.getMonth();
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const reset = new Date(nextYear, nextMonth, 1);
  const diff = reset.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getMonthRange(offset: number): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getLast7DaysRange(): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function daysInMonth(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  return new Date(year, month + 1, 0).getDate();
}

function formatInrEquivalent(usd: number, rate = 83): string {
  if (usd <= 0) return "≈ ₹0";
  const inr = usd * rate;
  return `≈ ₹${inr.toFixed(0)}`;
}

function humanDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CreditsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [range, setRange] = useState<RangeKey>("this-month");
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [todaySummary, setTodaySummary] = useState<MonthlySummary | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [agents, setAgents] = useState<AgentBreakdown[]>([]);
  const [models, setModels] = useState<ModelBreakdown[]>([]);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [emptyUsage, setEmptyUsage] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("tokens");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visibleAgents, setVisibleAgents] = useState(5);

  const [upgradeDismissed, setUpgradeDismissed] = useState(false);

  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

  useEffect(() => {
    const key = "agenthelm_upgrade_dismissed";
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { ts: number };
        const diffDays = (Date.now() - parsed.ts) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) setUpgradeDismissed(true);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      if (testMode) {
        const now = new Date();
        const { start } = getMonthRange(0);
        const daysElapsed = Math.max(
          1,
          Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        );
        const testMonthly: MonthlySummary = {
          total_tokens: 45230,
          total_cost: 0.04,
          total_calls: 128,
        };
        const testToday: MonthlySummary = {
          total_tokens: 2100,
          total_cost: 0.002,
          total_calls: 9,
        };
        const testDaily: DailyPoint[] = Array.from({ length: 14 }).map((_, i) => {
          const d = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
          return {
            date: d.toISOString().slice(0, 10),
            tokens: 500 + i * 250,
            cost: 0.0001 * (500 + i * 250),
          };
        });
        const testAgents: AgentBreakdown[] = [
          {
            agent_id: "agd_test_agent_1",
            name: "Local Python Agent",
            tokens: 45230,
            cost: 0.04,
            calls: 90,
            last_active: now.toISOString(),
          },
          {
            agent_id: "agd_test_agent_2",
            name: "Email Bot",
            tokens: 18100,
            cost: 0.02,
            calls: 28,
            last_active: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
          },
        ];
        const testModels: ModelBreakdown[] = [
          { model: "gemini-2.0-flash", tokens: 45230, cost: 0.04 },
          { model: "gpt-4.1", tokens: 8100, cost: 0.24 },
        ];
        const testPlan: PlanInfo = { plan: "free", tokens_limit_monthly: 100_000 };

        setMonthly(testMonthly);
        setTodaySummary(testToday);
        setDaily(testDaily);
        setAgents(testAgents);
        setModels(testModels);
        setPlan(testPlan);
        setEmptyUsage(false);
        setLoading(false);
        return;
      }

      const { start, end } =
        range === "this-month"
          ? getMonthRange(0)
          : range === "last-month"
          ? getMonthRange(-1)
          : getLast7DaysRange();

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }
      const userId = authData.user.id;

      const [
        { data: rangeCredits },
        { data: todayCredits },
        { data: agentRows },
        { data: modelRows },
        { data: profileRow },
      ] = await Promise.all([
        supabase
          .from("credit_usage")
          .select("tokens_used,cost_usd,created_at,model,agent_id")
          .eq("user_id", userId)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString()),
        supabase
          .from("credit_usage")
          .select("tokens_used,cost_usd,created_at,model,agent_id")
          .eq("user_id", userId)
          .gte("created_at", todayStart.toISOString()),
        supabase
          .from("credit_usage")
          .select("agent_id,tokens_used,cost_usd,created_at,model")
          .eq("user_id", userId)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString()),
        supabase
          .from("credit_usage")
          .select("model,tokens_used,cost_usd")
          .eq("user_id", userId)
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString()),
        supabase
          .from("profiles")
          .select("plan,tokens_limit_monthly")
          .eq("id", userId)
          .single(),
      ]);

      const rangeArr = (rangeCredits ?? []) as CreditRow[];
      const todayArr = (todayCredits ?? []) as CreditRow[];

      const totalTokens = rangeArr.reduce((acc, r) => acc + (r.tokens_used ?? 0), 0);
      const totalCost = rangeArr.reduce((acc, r) => acc + Number(r.cost_usd ?? 0), 0);

      const todayTokens = todayArr.reduce((acc, r) => acc + (r.tokens_used ?? 0), 0);
      const todayCost = todayArr.reduce((acc, r) => acc + Number(r.cost_usd ?? 0), 0);

      const monthlySummary: MonthlySummary = {
        total_tokens: totalTokens,
        total_cost: totalCost,
        total_calls: rangeArr.length,
      };
      const todaySummaryObj: MonthlySummary = {
        total_tokens: todayTokens,
        total_cost: todayCost,
        total_calls: todayArr.length,
      };

      setMonthly(monthlySummary);
      setTodaySummary(todaySummaryObj);
      setPlan(
        profileRow
          ? {
              plan: (profileRow as any).plan ?? "free",
              tokens_limit_monthly: Number((profileRow as any).tokens_limit_monthly ?? 100_000),
            }
          : { plan: "free", tokens_limit_monthly: 100_000 }
      );

      const byDate = new Map<string, { tokens: number; cost: number }>();
      for (const row of rangeArr) {
        const key = new Date(row.created_at).toISOString().slice(0, 10);
        const prev = byDate.get(key) ?? { tokens: 0, cost: 0 };
        prev.tokens += row.tokens_used ?? 0;
        prev.cost += Number(row.cost_usd ?? 0);
        byDate.set(key, prev);
      }
      const dailyPoints: DailyPoint[] = Array.from(byDate.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, v]) => ({ date, tokens: v.tokens, cost: v.cost }));
      setDaily(dailyPoints);

      const agentMap = new Map<
        string,
        { tokens: number; cost: number; calls: number; last: string | null }
      >();
      for (const row of (agentRows ?? []) as any[]) {
        const id = row.agent_id as string | null;
        if (!id) continue;
        const prev = agentMap.get(id) ?? { tokens: 0, cost: 0, calls: 0, last: null };
        prev.tokens += row.tokens_used ?? 0;
        prev.cost += Number(row.cost_usd ?? 0);
        prev.calls += 1;
        if (!prev.last || new Date(row.created_at) > new Date(prev.last)) {
          prev.last = row.created_at;
        }
        agentMap.set(id, prev);
      }
      let agentsEnriched: AgentBreakdown[] = [];
      if (agentMap.size > 0) {
        const ids = Array.from(agentMap.keys());
        const { data: agentRecords } = await supabase
          .from("agents")
          .select("id,name")
          .in("id", ids);
        const nameMap = new Map<string, string>();
        for (const a of (agentRecords ?? []) as any[]) {
          nameMap.set(a.id as string, a.name as string);
        }
        agentsEnriched = ids.map((id) => {
          const agg = agentMap.get(id)!;
          return {
            agent_id: id,
            name: nameMap.get(id) ?? "Unknown agent",
            tokens: agg.tokens,
            cost: agg.cost,
            calls: agg.calls,
            last_active: agg.last,
          };
        });
      }
      setAgents(agentsEnriched);

      const modelMap = new Map<string, { tokens: number; cost: number }>();
      for (const row of (modelRows ?? []) as any[]) {
        const model = (row.model as string | null) ?? "unknown";
        const prev = modelMap.get(model) ?? { tokens: 0, cost: 0 };
        prev.tokens += row.tokens_used ?? 0;
        prev.cost += Number(row.cost_usd ?? 0);
        modelMap.set(model, prev);
      }
      const modelList: ModelBreakdown[] = Array.from(modelMap.entries())
        .map(([model, v]) => ({ model, tokens: v.tokens, cost: v.cost }))
        .sort((a, b) => b.tokens - a.tokens);
      setModels(modelList);

      setEmptyUsage(totalTokens === 0 && todayTokens === 0);
      setLoading(false);
    };

    load();
  }, [supabase, range, testMode]);

  const planLabel =
    plan?.plan === "indie" ? "Indie Plan" : plan?.plan === "studio" ? "Studio Plan" : "Free Plan";
  const tokensLimit = plan?.tokens_limit_monthly ?? 100_000;
  const usedThisMonth = monthly?.total_tokens ?? 0;
  const percentUsed = tokensLimit > 0 ? (usedThisMonth / tokensLimit) * 100 : 0;

  const now = new Date();
  const { start: thisMonthStart } = getMonthRange(0);
  const daysElapsedThisMonth = Math.max(
    1,
    Math.ceil((now.getTime() - thisMonthStart.getTime()) / (1000 * 60 * 60 * 24))
  );
  const dailyAverage =
    daysElapsedThisMonth > 0 ? usedThisMonth / daysElapsedThisMonth : usedThisMonth;
  const projectedMonthly = dailyAverage * daysInMonth(thisMonthStart);
  const daysUntilReset = getDaysUntilReset(now);

  const mostUsedModel = models[0];
  const totalTokensAllAgents = agents.reduce((sum, a) => sum + a.tokens, 0) || 1;

  const sortedAgents = [...agents].sort((a, b) => {
    const tokA = a.tokens;
    const tokB = b.tokens;
    const costA = a.cost;
    const costB = b.cost;
    const pctA = tokA / totalTokensAllAgents;
    const pctB = tokB / totalTokensAllAgents;
    let cmp = 0;
    if (sortKey === "tokens") cmp = tokA - tokB;
    else if (sortKey === "cost") cmp = costA - costB;
    else cmp = pctA - pctB;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const visibleAgentRows = sortedAgents.slice(0, visibleAgents);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const progressColor =
    percentUsed >= 90 ? "#ef4444" : percentUsed >= 70 ? "#f59e0b" : "#10b981";

  const showUpgradeBanner = plan?.plan === "free" && !upgradeDismissed;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">Credits &amp; Usage</h1>
        <p className="text-gray-400 text-sm">Track your token usage and costs</p>
      </div>

      {emptyUsage && !loading && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#111111] border border-dashed border-[#1f2937] rounded-lg text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <Activity className="w-8 h-8 text-gray-500" />
          </div>
          <div className="text-lg font-medium text-white">No token usage yet</div>
          <p className="text-sm text-gray-400 max-w-sm">
            Connect an agent and start tracking how many tokens your AI workloads consume.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-[#10b981] px-4 py-2 text-sm font-medium text-white hover:bg-[#059669]"
          >
            Go to Dashboard →
          </Link>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-[#111111] border border-[#1f2937] p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-1/3" />
                  <div className="h-6 bg-gray-800 rounded w-1/2" />
                  <div className="h-3 bg-gray-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-[#111111] border border-[#1f2937] p-4 space-y-3">
            <div className="animate-pulse h-4 bg-gray-800 rounded w-1/4" />
            <div className="animate-pulse h-2 bg-gray-800 rounded w-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl bg-[#111111] border border-[#1f2937] p-4">
              <div className="animate-pulse h-4 bg-gray-800 rounded w-1/3 mb-4" />
              <div className="animate-pulse h-48 bg-gray-800 rounded" />
            </div>
            <div className="rounded-xl bg-[#111111] border border-[#1f2937] p-4">
              <div className="animate-pulse h-4 bg-gray-800 rounded w-1/3 mb-4" />
              <div className="animate-pulse h-48 bg-gray-800 rounded" />
            </div>
          </div>
          <div className="rounded-xl bg-[#111111] border border-[#1f2937] p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse h-4 bg-gray-800 rounded w-full" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats row */}
          {/* ... (rest identical to previous patch, omitted here for brevity) */}
        </>
      )}
    </div>
  );
}
