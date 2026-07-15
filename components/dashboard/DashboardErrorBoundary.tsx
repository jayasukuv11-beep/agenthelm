"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-[#0a0a0a] border border-red-900/50 rounded-xl relative overflow-hidden font-mono uppercase">
          {/* Industrial backdrop grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <div className="relative z-10 max-w-md space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-none border border-red-500/30 flex items-center justify-center relative">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Governance Boundary Alert
              </h2>
              <p className="text-xs text-zinc-500 tracking-wider leading-relaxed">
                An unhandled runtime error has occurred inside the dashboard partition. 
                State telemetry has been blocked to prevent UI corruption.
              </p>
            </div>

            {this.state.error && (
              <pre className="p-3 bg-red-950/10 border border-red-900/30 text-red-400 text-[10px] text-left overflow-x-auto whitespace-pre-wrap">
                {this.state.error.name}: {this.state.error.message}
              </pre>
            )}

            <Button
              onClick={this.handleReset}
              className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10 rounded-none text-xs tracking-widest font-bold h-12 w-full gap-2 transition-all"
            >
              <RefreshCcw className="w-4 h-4" /> Reset Environment
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
