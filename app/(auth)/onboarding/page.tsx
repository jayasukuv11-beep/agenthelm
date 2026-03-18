"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, Copy } from "lucide-react";

const AGENT_TYPES = [
  "Python scripts",
  "Node.js bots",
  "Telegram bots",
  "Web scrapers",
  "Other"
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1
  const [fullName, setFullName] = useState("");
  
  // Step 2
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Step 3
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

  const handleStep1 = () => {
    if (!fullName.trim()) {
      setError("Please enter your name");
      return;
    }
    setError(null);
    setStep(2);
  };

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleStep2 = async () => {
    if (selectedTypes.length === 0) {
      setError("Please select at least one type");
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
      
      setStep(3);
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
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] px-4">
      <Card className="w-full max-w-md bg-[#111111] border-[#1f2937]">
        {step === 1 && (
          <>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <span className="text-4xl font-bold text-[#10b981]">⚡</span>
              </div>
              <CardTitle className="text-2xl tracking-tight text-white mb-2">
                What should we call you?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-[#1a1a1a] border-[#2d3748] text-white focus:border-[#10b981] text-lg py-6"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStep1();
                  }}
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button
                  onClick={handleStep1}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-6 text-lg mt-4"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl tracking-tight text-white mb-2 text-center">
                What kind of agents do you run?
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                Select all that apply
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {AGENT_TYPES.map(type => (
                  <div
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors flex items-center justify-between
                      ${selectedTypes.includes(type) 
                        ? 'border-[#10b981] bg-[#10b981]/10' 
                        : 'border-[#2d3748] bg-[#1a1a1a] hover:border-gray-500'
                      }`}
                  >
                    <span className="text-white font-medium">{type}</span>
                    <div className={`w-5 h-5 rounded-sm border flex items-center justify-center
                      ${selectedTypes.includes(type) 
                        ? 'border-[#10b981] bg-[#10b981]' 
                        : 'border-gray-500 bg-transparent'
                      }`}
                    >
                      {selectedTypes.includes(type) && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </div>
                ))}
                {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                <Button
                  onClick={handleStep2}
                  disabled={loading}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-6 text-lg mt-6"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
             <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[#10b981]/20 rounded-full flex items-center justify-center">
                  <span className="text-4xl text-[#10b981]">🎉</span>
                </div>
              </div>
              <CardTitle className="text-2xl tracking-tight text-white mb-2">
                Your connect key is ready!
              </CardTitle>
              <CardDescription className="text-gray-400">
                Use this key to connect any agent to AgentHelm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#2d3748] rounded-md overflow-hidden">
                <span className="font-mono text-[#10b981] font-bold text-lg">{connectKey || "Loading..."}</span>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="text-gray-400 hover:text-white border border-[#2d3748] hover:bg-[#2d3748]">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="bg-black/50 p-4 rounded-md border border-[#1f2937]">
                <pre className="text-sm font-mono text-gray-300 overflow-x-auto">
<code className="text-blue-400">pip install</code> agenthelm-sdk{"\n\n"}
<code className="text-purple-400">import</code> agenthelm{"\n"}
dock = agenthelm.connect(<span className="text-yellow-300">"{connectKey || "YOUR_KEY"}"</span>)
                </pre>
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <Button
                onClick={handleComplete}
                disabled={loading}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-6 text-lg"
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
