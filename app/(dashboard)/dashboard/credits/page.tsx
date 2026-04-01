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
import { Zap, DollarSign, Cpu, Calendar, ChevronDown, ChevronUp, Activity, IndianRupee, ArrowUpRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatCurrency, getCurrencySymbol, type CurrencyCode } from "@/lib/currency";
import { StatsRow } from "@/components/dashboard/StatsRow";

type CreditUsageRow = {
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
  preferred_currency: CurrencyCode;
};

type RangeKey = "this-month" | "last-month" | "last-7";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

function formatTokensShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

export default function CreditsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [range, setRange] = useState<RangeKey>("this-month");
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [agents, setAgents] = useState<AgentBreakdown[]>([]);
  const [models, setModels] = useState<ModelBreakdown[]>([]);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [emptyUsage, setEmptyUsage] = useState(false);

  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      if (testMode) {
        const now = new Date();
        const testMonthly: MonthlySummary = {
          total_tokens: 45230,
          total_cost: 0.04,
          total_calls: 128,
        };
        const testDaily: DailyPoint[] = Array.from({ length: 14 }).map((_, i) => {
          const d = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
          return {
            date: d.toISOString().slice(0, 10),
            tokens: 500 + i * 250,
            cost: 0.0001 * (500 + i * 250),
          };
        });
        const testPlan: PlanInfo = { plan: "free", tokens_limit_monthly: 100_000, preferred_currency: "USD" };

        setMonthly(testMonthly);
        setDaily(testDaily);
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

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }
      const userId = authData.user.id;

      const [
        { data: rangeCredits },
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
          .select("agent_id,tokens_used,cost_usd,created_at")
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
          .select("plan,tokens_limit_monthly,preferred_currency")
          .eq("id", userId)
          .single(),
      ]);

      const rangeArr = (rangeCredits ?? []) as CreditUsageRow[];
      const totalTokens = rangeArr.reduce((acc, r) => acc + (r.tokens_used ?? 0), 0);
      const totalCost = rangeArr.reduce((acc, r) => acc + Number(r.cost_usd ?? 0), 0);

      setMonthly({
        total_tokens: totalTokens,
        total_cost: totalCost,
        total_calls: rangeArr.length,
      });

      setPlan(
        profileRow
          ? {
              plan: (profileRow as any).plan ?? "free",
              tokens_limit_monthly: Number((profileRow as any).tokens_limit_monthly ?? 100_000),
              preferred_currency: (profileRow as any).preferred_currency ?? "USD",
            }
          : { plan: "free", tokens_limit_monthly: 100_000, preferred_currency: "USD" }
      );

      // Daily stats logic
      const byDate = new Map<string, { tokens: number; cost: number }>();
      for (const row of rangeArr) {
        const key = new Date(row.created_at).toISOString().slice(0, 10);
        const prev = byDate.get(key) ?? { tokens: 0, cost: 0 };
        prev.tokens += row.tokens_used ?? 0;
        prev.cost += Number(row.cost_usd ?? 0);
        byDate.set(key, prev);
      }
      setDaily(Array.from(byDate.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, v]) => ({ date, tokens: v.tokens, cost: v.cost })));

      setEmptyUsage(totalTokens === 0);
      setLoading(false);
    };

    load();
  }, [supabase, range, testMode]);

  const currency = plan?.preferred_currency ?? "USD";
  const usedThisMonth = monthly?.total_tokens ?? 0;
  const tokensLimit = plan?.tokens_limit_monthly ?? 100_000;
  const percentUsed = tokensLimit > 0 ? (usedThisMonth / tokensLimit) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Credits & Billing</h1>
          <p className="text-gray-400 text-sm">Managing consumption in {currency === 'INR' ? 'Indian Rupees (₹)' : 'US Dollars ($)'}</p>
        </div>
        
        <div className="flex bg-[#111111] border border-[#1f2937] p-1 rounded-lg">
          {(['this-month', 'last-7'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                range === r ? "bg-[#10b981] text-white" : "text-gray-400 hover:text-white"
              )}
            >
              {r === 'this-month' ? 'This Month' : 'Last 7 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-[#111111] rounded-xl border border-[#1f2937]" />)}
        </div>
      ) : (
        <StatsRow 
          totalAgents={monthly?.total_calls ?? 0}
          runningAgents={0}
          tokensUsed={monthly?.total_tokens ?? 0}
          cost={monthly?.total_cost ?? 0}
          currency={currency}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Progress */}
        <Card className="bg-[#111111] border-[#1f2937] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-lg">Monthly Limit</CardTitle>
            <CardDescription className="text-gray-400">Included tokens in your plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Used {formatTokensShort(usedThisMonth)}</span>
                <span className="text-white font-medium">{percentUsed.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#10b981] transition-all duration-500" 
                  style={{ width: `${Math.min(100, percentUsed)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 text-right">Limit: {formatTokensShort(tokensLimit)} tokens</p>
            </div>

            <div className="pt-4 border-t border-[#1f2937]">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Upgrade Subscription</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-[#1f2937]">
                  <div>
                    <p className="text-sm font-medium text-white">Studio Plan</p>
                    <p className="text-xs text-gray-500">1M Tokens + Safety Gates</p>
                  </div>
                  <Button size="sm" className="bg-[#10b981] hover:bg-[#059669] text-white">
                    {currency === 'INR' ? '₹1299' : '$14.99'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Chart */}
        <Card className="bg-[#111111] border-[#1f2937] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">Token Burn Rate</CardTitle>
              <CardDescription className="text-gray-400">Daily consumption trends</CardDescription>
            </div>
            <TrendingUp className="w-5 h-5 text-[#10b981]" />
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDateLabel} 
                    stroke="#4b5563" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#4b5563" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatTokensShort(v)}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111111', borderColor: '#1f2937', color: '#fff' }}
                    itemStyle={{ color: '#10b981' }}
                    labelFormatter={(label) => formatDateLabel(String(label))}
                  />
                  <Bar dataKey="tokens" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
