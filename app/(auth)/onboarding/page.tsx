"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, Copy, Shield } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1
  const [fullName, setFullName] = useState("");
  
  // Step 2
  const [connectKey, setConnectKey] = useState("");
  const [copied, setCopied] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Fetch user and profile to get connect key
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('connect_key, full_name, onboarding_complete')
        .eq('id', user.id)
        .single();
        
      if (profile) {
        if (profile.onboarding_complete) {
          router.push("/dashboard");
          return;
        }
        if (profile.full_name) {
          setFullName(profile.full_name);
        }
        if (profile.connect_key) {
          setConnectKey(profile.connect_key);
        }
      }
    };
    
    loadProfile();
  }, [router, supabase]);

  const handleStep1 = async () => {
    if (!fullName.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setStep(2);
    } catch (err: any) {
      setError("Something went wrong saving your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(connectKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      router.push("/dashboard");
    } catch (err: any) {
      setError("Error completing onboarding.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505] px-4 font-mono">
      <Card className="w-full max-w-md bg-[#111] border-zinc-800 rounded-none shadow-xl">
        {step === 1 && (
          <>
            <CardHeader className="space-y-1 text-center border-b border-zinc-800/50 pb-6 mb-4">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-[20px] font-black text-white uppercase tracking-widest mb-2">
                What should we call you?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="YOUR FULL NAME"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-[#0a0a0a] border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 text-[14px] font-mono font-bold uppercase tracking-widest py-6 rounded-none h-14 px-4 transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStep1();
                    }}
                  />
                </div>
                {error && <p className="text-[11px] uppercase tracking-widest text-red-500 bg-red-500/10 p-2 border border-red-500/30 font-bold">{error}</p>}
                <Button
                  onClick={handleStep1}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-14 rounded-none text-[13px] uppercase tracking-widest mt-6 transition-all"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
             <CardHeader className="space-y-1 text-center border-b border-zinc-800/50 pb-6 mb-4">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-none flex items-center justify-center">
                  <Check className="w-8 h-8 text-indigo-400 font-bold" />
                </div>
              </div>
              <CardTitle className="text-[18px] font-black text-white uppercase tracking-widest mb-2">
                Your connect key is ready!
              </CardTitle>
              <CardDescription className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Use this key to connect any agent to AgentHelm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-indigo-500/30 rounded-none overflow-hidden relative">
                <span className="font-mono text-indigo-400 font-bold text-[13px]">{connectKey || "Loading..."}</span>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="text-indigo-400 hover:text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/10 rounded-none font-mono text-[10px] uppercase tracking-widest ml-4 transition-all">
                  {copied ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Quick Start</p>
                <div className="bg-[#050505] p-4 rounded-none border border-zinc-800">
                  <pre className="text-[12px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
  <code className="text-orange-400">pip install</code> agenthelm-sdk{"\n\n"}
  <code className="text-purple-400">import</code> agenthelm{"\n"}
  dock = agenthelm.connect(<span className="text-yellow-500">"{connectKey || "YOUR_KEY"}"</span>)
                  </pre>
                </div>
              </div>

              {error && <p className="text-[11px] uppercase tracking-widest text-red-500 bg-red-500/10 p-2 border border-red-500/30 font-bold">{error}</p>}

              <Button
                onClick={handleComplete}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 rounded-none text-[13px] uppercase tracking-widest transition-all"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Open Dashboard
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
