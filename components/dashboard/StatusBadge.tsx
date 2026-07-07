"use client"

import React from "react"
import { cn } from "@/lib/utils"

export type StatusType = "pending" | "reviewing" | "merged" | "rejected" | "running" | "idle" | "error" | "success" | "failed"

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
}

const STATUS_MAP: Record<string, { color: string; bg: string; border: string; label: string }> = {
  pending:   { color: "text-zinc-400",  bg: "bg-zinc-500/10",   border: "border-zinc-500/20",  label: "Queued" },
  reviewing: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Reviewing" },
  merged:    { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "Compiled" },
  rejected:  { color: "text-red-400",   bg: "bg-red-500/10",   border: "border-red-500/20",   label: "Rejected" },
  running:   { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "Running" },
  idle:      { color: "text-zinc-500",   bg: "bg-zinc-500/10",   border: "border-zinc-500/20",  label: "Idle" },
  error:     { color: "text-red-500",   bg: "bg-red-500/10",   border: "border-red-500/20",   label: "Error" },
  success:   { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", label: "Success" },
  failed:    { color: "text-red-400",   bg: "bg-red-500/10",   border: "border-red-500/20",   label: "Failed" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || STATUS_MAP.pending

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors",
      config.bg,
      config.color,
      config.border,
      className
    )}>
      {config.label}
    </span>
  )
}
