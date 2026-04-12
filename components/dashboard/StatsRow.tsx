import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity, Zap, IndianRupee, DollarSign } from "lucide-react";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

interface StatsRowProps {
  totalAgents: number;
  runningAgents: number;
  tokensUsed: number;
  cost: number;
  currency?: CurrencyCode;
}

export function StatsRow({ 
  totalAgents, 
  runningAgents, 
  tokensUsed, 
  cost, 
  currency = 'USD' 
}: StatsRowProps) {
  const isInr = currency === 'INR';
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <Card className="bg-[#111] border-zinc-800 rounded-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Total Agents</p>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-[24px] font-mono font-black text-white">{totalAgents}</div>
        </CardContent>
      </Card>

      <Card className="bg-[#111] border-zinc-800 rounded-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Running Now</p>
            <Activity className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-[24px] font-mono font-black text-white">{runningAgents}</div>
        </CardContent>
      </Card>

      <Card className="bg-[#111] border-zinc-800 rounded-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Tokens Today</p>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-[24px] font-mono font-black text-white">
            {new Intl.NumberFormat().format(tokensUsed)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#111] border-zinc-800 rounded-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Est. Cost</p>
            {isInr ? (
              <IndianRupee className="w-4 h-4 text-blue-400" />
            ) : (
              <DollarSign className="w-4 h-4 text-blue-400" />
            )}
          </div>
          <div className="text-[24px] font-mono font-black text-white">
            {formatCurrency(cost, currency)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
