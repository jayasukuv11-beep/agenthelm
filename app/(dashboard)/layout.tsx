"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  GitBranch,
  ShieldAlert,
  Users,
  Folder,
  Settings,
  LogOut,
  Sparkles,
  Rocket,
  MoreHorizontal
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DashboardErrorBoundary from "@/components/dashboard/DashboardErrorBoundary";

const navGroups = [
  {
    group: "Project Brain",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
      { href: "/dashboard/knowledge", icon: BookOpen, label: "Brain Memory" },
      { href: "/dashboard/proposals", icon: FileText, label: "Proposals" },
      { href: "/dashboard/versions", icon: GitBranch, label: "Version History" },
      { href: "/dashboard/policy", icon: ShieldAlert, label: "Policy Engine" },
    ]
  },
  {
    group: "Fleet & Control",
    items: [
      { href: "/dashboard/agents", icon: Users, label: "Agent Fleet" },
      { href: "/dashboard/projects", icon: Folder, label: "Projects" },
      { href: "/dashboard/onboarding", icon: Rocket, label: "Repo Onboarding" },
      { href: "/dashboard/settings", icon: Settings, label: "Settings & Billing" },
    ]
  }
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

  const allNavItems = navGroups.flatMap(g => g.items);

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#2D2A26] bg-[#161513] text-[#E8E5DF] shrink-0">
        <div className="p-5 border-b border-[#2D2A26]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-vermilion rounded-lg flex items-center justify-center shadow-md shadow-vermilion/20">
              <span className="font-display font-black text-white text-xs">AH</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold font-display tracking-wide uppercase">AgentHelm</span>
              <span className="text-[10px] text-[#A6A29A] font-mono">Control Plane</span>
            </div>
          </Link>

          {/* Sarvam AI Badge */}
          <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sarvam/20 border border-sarvam/40 text-sarvam-soft text-[10px] font-mono">
            <Sparkles className="w-3 h-3 text-[#A855F7] shrink-0 animate-pulse" />
            <span className="font-semibold text-white">Sarvam-105B</span>
            <span className="text-zinc-400 ml-auto">Active</span>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.group}>
              <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#7A766D] font-bold block mb-1.5">
                {group.group}
              </span>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 transition-all font-mono text-xs rounded-lg
                        ${isActive 
                          ? "bg-vermilion text-white font-bold shadow-sm" 
                          : "text-[#B8B4AA] hover:text-white hover:bg-[#22201D]"
                        }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[#2D2A26]">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 w-full text-left font-mono text-xs text-[#8B877C] hover:text-vermilion hover:bg-vermilion/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto bg-paper min-h-screen">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <DashboardErrorBoundary>
            {children}
          </DashboardErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#2D2A26] bg-[#161513] z-50">
        <div className="flex items-center justify-around p-2">
          {allNavItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2
                  ${isActive ? "text-vermilion" : "text-[#7A766D]"}`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-[9px] font-mono uppercase tracking-widest">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMobileMore(!showMobileMore)}
            className={`flex flex-col items-center gap-1 p-2
              ${showMobileMore ? "text-vermilion" : "text-[#7A766D]"}`}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[9px] font-mono uppercase tracking-widest">More</span>
          </button>
        </div>

        {/* Mobile More Panel */}
        {showMobileMore && (
          <div className="absolute bottom-16 left-0 right-0 bg-[#161513] border-t border-[#2D2A26] p-4 grid grid-cols-2 gap-2 shadow-2xl z-40">
            {allNavItems.slice(4).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMobileMore(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-mono text-xs transition-all
                    ${isActive 
                      ? "bg-vermilion text-white font-bold" 
                      : "text-[#B8B4AA] bg-[#22201D] hover:text-white"
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
