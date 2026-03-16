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

  // Rate Limiting Logic Let's check localStorage for attempts
  useEffect(() => {
    const checkRateLimit = () => {
      const attempts = JSON.parse(localStorage.getItem("otp_attempts") || "[]");
      const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
      const recentAttempts = attempts.filter((t: number) => t > fiveMinsAgo);
      
      if (recentAttempts.length >= 3) {
        const oldestRecent = Math.min(...recentAttempts);
        const timeUntilNext = Math.ceil((oldestRecent + 5 * 60 * 1000 - Date.now()) / 1000);
        if (timeUntilNext > 0) {
          setCooldown(timeUntilNext);
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

    // Update attempts
    const attempts = JSON.parse(localStorage.getItem("otp_attempts") || "[]");
    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
    const recentAttempts = attempts.filter((t: number) => t > fiveMinsAgo);
    
    if (recentAttempts.length >= 3) {
      setError("Too many attempts. Please try again later.");
      setLoading(false);
      return;
    }

    recentAttempts.push(Date.now());
    localStorage.setItem("otp_attempts", JSON.stringify(recentAttempts));

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setSuccess(true);
      // Optional: auto-redirect to verify-otp page with email as query param
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] px-4">
      <Card className="w-full max-w-md bg-[#111111] border-[#1f2937]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <span className="text-4xl font-bold text-[#10b981]">⚡</span>
          </div>
          <CardTitle className="text-2xl tracking-tight text-white mb-2">
            Sign in to AgentDock
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email to receive a secure login code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#2d3748] text-white focus:border-[#10b981]"
                disabled={loading || success || cooldown > 0}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-[#10b981] text-sm">Check your email for the OTP! Redirecting...</p>}
            
            <Button
              type="submit"
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold"
              disabled={loading || success || cooldown > 0}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {cooldown > 0 
                ? `Try again in ${Math.floor(cooldown / 60)}:${(cooldown % 60).toString().padStart(2, '0')}`
                : "Send OTP"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-400">
            New here? Account created automatically
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
