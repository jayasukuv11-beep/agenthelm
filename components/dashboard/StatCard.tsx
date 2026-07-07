"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  description?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  trend,
  className
}: StatCardProps) {
  return (
    <div className={cn(
      "bg-[#111 border border-zinc-800 rounded-xl p-4 space-y-2 transition-colors hover:border-zinc-700",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-zinc-500" />}
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
            {label}
          </span>
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded",
            trend.isPositive ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
          )}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white font-mono">{value}</span>
      </div>
      {description && (
        <p className="text-xs text-zinc-500 font-mono truncate">
          {description}
        </p>
      )}
    </div>
  )
}
