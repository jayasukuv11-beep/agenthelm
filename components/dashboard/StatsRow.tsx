"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Activity, Zap, DollarSign } from "lucide-react";

interface StatsRowProps {
  totalAgents: number;
  runningAgents: number;
  tokensUsed: number;
  cost: number;
}

export function StatsRow({ totalAgents, runningAgents, tokensUsed, cost }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-[#111111] border-[#1f2937]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-400">Total Agents</p>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalAgents}</div>
        </CardContent>
      </Card>

      <Card className="bg-[#111111] border-[#1f2937]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-400">Running Now</p>
            <Activity className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="text-2xl font-bold text-white">{runningAgents}</div>
        </CardContent>
      </Card>

      <Card className="bg-[#111111] border-[#1f2937]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-400">Tokens Today</p>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {new Intl.NumberFormat().format(tokensUsed)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#111111] border-[#1f2937]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-400">Est. Cost</p>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${cost.toFixed(4)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
