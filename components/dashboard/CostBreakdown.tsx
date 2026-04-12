import { useState, useEffect } from "react";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface CostBreakdownProps {
  agentId: string;
  plan: "free" | "indie" | "studio";
  currency: CurrencyCode;
}

const COLORS = ['#f97316', '#eab308', '#3b82f6', '#a855f7', '#ef4444'];

export function CostBreakdown({ agentId, plan, currency }: CostBreakdownProps) {
  const [loading, setLoading] = useState(true);
  const [modelData, setModelData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  
  useEffect(() => {
    async function loadData() {
      if (plan === "free") {
        setLoading(false);
        return; // Free tier doesn't load drill-down data
      }

      const supabase = createClient();
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const weekAgo = d.toISOString();

      try {
        const { data, error } = await supabase
          .from('credit_usage')
          .select('model, cost_usd, created_at')
          .eq('agent_id', agentId)
          .gte('created_at', weekAgo);

        if (error || !data) throw new Error("Failed to load");

        // Group by model
        const modelMap: Record<string, number> = {};
        // Group by day for trend
        const dayMap: Record<string, number> = {};

        data.forEach(row => {
          const model = row.model || "unknown";
          const cost = Number(row.cost_usd || 0);
          modelMap[model] = (modelMap[model] || 0) + cost;

          const day = new Date(row.created_at).toLocaleDateString(undefined, { weekday: 'short' });
          dayMap[day] = (dayMap[day] || 0) + cost;
        });

        setModelData(Object.entries(modelMap).map(([name, value]) => ({ name, value })));
        
        // Generate last 7 days in order
        const trend = [];
        for (let i = 6; i >= 0; i--) {
          const dt = new Date();
          dt.setDate(dt.getDate() - i);
          const label = dt.toLocaleDateString(undefined, { weekday: 'short' });
          trend.push({ name: label, cost: dayMap[label] || 0 });
        }
        setTrendData(trend);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [agentId, plan]);

  if (loading) {
    return <div className="h-48 bg-[#111] animate-pulse rounded-none border border-zinc-800"></div>;
  }

  if (plan === "free") {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#111] rounded-none border border-zinc-800 border-dashed">
        <div className="w-12 h-12 bg-[#0a0a0a] rounded-none border border-zinc-800 flex items-center justify-center mb-4">
          <span className="text-2xl pt-1">💰</span>
        </div>
        <h3 className="text-white font-mono font-bold uppercase tracking-widest text-[14px] mb-2">Detailed Cost Attribution</h3>
        <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 max-w-sm text-center mb-6 leading-relaxed">
          Upgrade to Indie or Studio to see per-model cost breakdowns and 7-day spending trends.
        </p>
        <button className="text-[12px] font-mono font-bold uppercase tracking-widest bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-none transition-all">
          Upgrade Plan
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
      <div className="bg-[#111] rounded-none border border-zinc-800 p-6 flex flex-col">
        <h3 className="text-white font-mono font-bold text-[12px] uppercase tracking-widest mb-6">Cost by Model (Last 7 Days)</h3>
        {modelData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[10px] uppercase tracking-widest font-mono text-zinc-500">No compute used</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {modelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => formatCurrency(Number(value) || 0, currency)}
                  contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #27272a", color: "#fff", borderRadius: "0px", fontFamily: "monospace", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              {modelData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  <div className="w-2.5 h-2.5 rounded-none mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  {entry.name} (${entry.value.toFixed(2)})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#111] rounded-none border border-zinc-800 p-6 flex flex-col relative">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-white font-mono font-bold text-[12px] uppercase tracking-widest">7-Day Spending Trend</h3>
          {plan !== "studio" && <Badge variant="outline" className="text-[9px] uppercase tracking-widest rounded-none bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Studio Only</Badge>}
        </div>
        
        <div className={`flex-1 h-64 ${plan !== "studio" ? "opacity-30 pointer-events-none blur-[2px]" : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} style={{ fontFamily: "monospace", textTransform: "uppercase" }} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} style={{ fontFamily: "monospace" }} />
              <Tooltip 
                formatter={(value: any) => formatCurrency(Number(value) || 0, currency)}
                contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #27272a", color: "#fff", borderRadius: "0px", fontFamily: "monospace", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}
              />
              <Line type="monotone" dataKey="cost" stroke="#f97316" strokeWidth={2} dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {plan !== "studio" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button className="text-[12px] font-mono font-bold uppercase tracking-widest bg-yellow-500 text-black hover:bg-yellow-400 px-6 py-3 rounded-none transition-all">
              Upgrade to Studio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
