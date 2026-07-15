"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, HelpCircle, Network, Shield, Folder, Brain, BookOpen, Zap, GitBranch, Activity, MoreHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DashboardErrorBoundary from "@/components/dashboard/DashboardErrorBoundary";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/projects", icon: Folder, label: "Projects" },
  { href: "/dashboard/brain", icon: Brain, label: "Project Brain" },
  { href: "/dashboard/knowledge", icon: BookOpen, label: "Knowledge" },
  { href: "/dashboard/pipeline", icon: Zap, label: "Pipeline" },
  { href: "/dashboard/versions", icon: GitBranch, label: "Versions" },
  { href: "/dashboard/agents", icon: Users, label: "Agents" },
  { href: "/dashboard/security", icon: Shield, label: "Security" },
  { href: "/dashboard/observability", icon: Activity, label: "Observability" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showMobileMore, setShowMobileMore] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-[#111]">
        <div className="p-6 border-b border-zinc-800/50">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-orange-500 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="text-white text-base font-bold font-mono tracking-tight uppercase">AgentHelm</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors font-mono text-[13px] uppercase tracking-wider
                  ${isActive 
                    ? "bg-orange-500/10 text-orange-500 border border-orange-500/30 font-bold" 
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800/50 border border-transparent"
                  }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left font-mono text-[13px] uppercase tracking-wider text-zinc-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto relative">
         {/* Industrial Grid Background */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10">
          <DashboardErrorBoundary>
            {children}
          </DashboardErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-[#111] z-50">
        <div className="flex items-center justify-around p-2">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2
                  ${isActive ? "text-orange-500" : "text-zinc-500"}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase tracking-widest">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMobileMore(!showMobileMore)}
            className={`flex flex-col items-center gap-1 p-2
              ${showMobileMore ? "text-orange-500" : "text-zinc-500"}`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[9px] font-mono uppercase tracking-widest">More</span>
          </button>
        </div>

        {/* Mobile More Panel */}
        {showMobileMore && (
          <div className="absolute bottom-16 left-0 right-0 bg-[#111] border-t border-zinc-800 p-4 grid grid-cols-2 gap-2 shadow-2xl z-40">
            {navItems.slice(4).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileMore(false)}
                  className={`flex items-center gap-3 px-3 py-3 border font-mono text-[11px] uppercase tracking-wider transition-all
                    ${isActive 
                      ? "bg-orange-500/10 text-orange-500 border-orange-500/30" 
                      : "text-zinc-400 bg-black/30 border-transparent hover:text-white"
                    }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );
}
