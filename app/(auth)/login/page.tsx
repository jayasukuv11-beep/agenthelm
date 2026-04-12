"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  // Rate Limiting Logic
  useEffect(() => {
    const checkRateLimit = () => {
      const lastSent = localStorage.getItem("otp_last_sent");
      if (lastSent) {
        const timeSince = Date.now() - parseInt(lastSent);
        const remaining = Math.ceil((60 * 1000 - timeSince) / 1000);
        if (remaining > 0) {
          setCooldown(remaining);
        }
      }
    };

    checkRateLimit();
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || cooldown > 0) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        },
      });

      if (error) {
        if (error.message.includes("rate limit") || (error as any).status === 429) {
          throw new Error("Too many requests. Please wait a minute before trying again.");
        }
        throw error;
      }

      setSuccess(true);
      localStorage.setItem("otp_last_sent", Date.now().toString());
      setCooldown(60);

      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505] px-4 font-mono">
      <Card className="w-full max-w-md bg-[#111] border-zinc-800 rounded-none shadow-xl">
        <CardHeader className="space-y-1 text-center border-b border-zinc-800/50 pb-6 mb-4">
          <div className="flex justify-center mb-4">
            <span className="text-4xl font-bold text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">⚡</span>
          </div>
          <CardTitle className="text-[20px] font-black text-white uppercase tracking-widest mb-2">
            Sign in to AgentHelm
          </CardTitle>
          <CardDescription className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Enter your email to receive a secure login code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[12px] font-bold text-white uppercase tracking-widest block text-left">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#0a0a0a] border-zinc-800 text-white rounded-none h-12 px-4 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:border-orange-500 transition-all font-mono"
                disabled={loading || success || cooldown > 0}
              />
            </div>
            {error && <p className="text-[11px] uppercase tracking-widest text-red-500 text-left bg-red-500/10 p-2 border border-red-500/30">{error}</p>}
            {success && <p className="text-[11px] uppercase tracking-widest text-orange-500 font-bold text-left bg-orange-500/10 p-2 border border-orange-500/30">Check your email for the code! Redirecting...</p>}
            
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-none h-12 uppercase tracking-widest text-[13px] transition-all"
              disabled={loading || success || cooldown > 0}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {cooldown > 0 
                ? `Try again in ${Math.floor(cooldown / 60)}:${(cooldown % 60).toString().padStart(2, '0')}`
                : "Send OTP"}
            </Button>
          </form>
          
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
              <span className="bg-[#111] px-4 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full bg-[#0a0a0a] border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-none h-12 uppercase tracking-widest text-[12px] font-bold transition-all"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="mr-3 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center pt-2 pb-6">
          <p className="text-[10px] uppercase tracking-widest font-mono text-zinc-600">
            New here? Account created automatically
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
