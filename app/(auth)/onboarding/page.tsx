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
    <div className="flex items-center justify-center min-h-screen bg-paper px-4">
      <Card className="w-full max-w-md bg-paper-card border-line rounded-2xl shadow-sm">
        {step === 1 && (
          <>
            <CardHeader className="space-y-1 text-center border-b border-line pb-6 mb-4">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-vermilion rounded-xl flex items-center justify-center shadow-sm">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="font-display text-[22px] font-bold text-ink tracking-tight mb-2">
                What should we call you?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-paper border-line text-ink focus-visible:ring-2 focus-visible:ring-vermilion/40 focus-visible:border-vermilion text-[14px] py-6 rounded-xl h-14 px-4 transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleStep1();
                    }}
                  />
                </div>
                {error && <p className="text-[12px] text-red-600 bg-red-500/10 p-2 border border-red-500/30 rounded-lg">{error}</p>}
                <Button
                  variant="brand"
                  onClick={handleStep1}
                  disabled={loading}
                  className="w-full h-14 text-[14px] font-semibold mt-6"
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
             <CardHeader className="space-y-1 text-center border-b border-line pb-6 mb-4">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-vermilion-soft border border-vermilion/20 rounded-2xl flex items-center justify-center">
                  <Check className="w-8 h-8 text-vermilion" />
                </div>
              </div>
              <CardTitle className="font-display text-[20px] font-bold text-ink tracking-tight mb-2">
                Your connect key is ready!
              </CardTitle>
              <CardDescription className="text-[12px] text-muted">
                Use this key to connect any agent to AgentHelm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between p-4 bg-paper border border-line rounded-xl overflow-hidden relative">
                <span className="font-mono text-ink-soft font-semibold text-[13px]">{connectKey || "Loading..."}</span>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="text-vermilion hover:text-vermilion-dark border border-line hover:bg-paper-dim rounded-lg text-[11px] font-semibold ml-4 transition-all">
                  {copied ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-medium text-muted">Quick Start</p>
                <div className="bg-[#1a1a1a] p-4 rounded-xl border border-line">
                  <pre className="text-[12px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
  <code className="text-orange-400">pip install</code> agenthelm-sdk{"\n\n"}
  <code className="text-purple-400">import</code> agenthelm{"\n"}
  dock = agenthelm.connect(<span className="text-yellow-500">"{connectKey || "YOUR_KEY"}"</span>)
                  </pre>
                </div>
              </div>

              {error && <p className="text-[12px] text-red-600 bg-red-500/10 p-2 border border-red-500/30 rounded-lg">{error}</p>}

              <Button
                variant="brand"
                onClick={handleComplete}
                disabled={loading}
                className="w-full h-14 text-[14px] font-semibold transition-all"
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
