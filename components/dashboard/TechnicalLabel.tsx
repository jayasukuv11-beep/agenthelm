"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface TechnicalLabelProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "muted" | "accent"
}

export function TechnicalLabel({
  children,
  className,
  variant = "default"
}: TechnicalLabelProps) {
  const variants = {
    default: "text-white",
    muted: "text-zinc-500",
    accent: "text-orange-500",
  }

  return (
    <span className={cn(
      "font-mono text-[11px] uppercase tracking-widest font-bold",
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
