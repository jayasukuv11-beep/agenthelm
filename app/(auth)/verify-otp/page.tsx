"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function VerifyOTPContent() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const supabase = createClient();

  useEffect(() => {
    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    // Resend cooldown timer
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const verifyOtp = async (otpStr: string) => {
    if (!email) {
      setError("Missing email address. Please login again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpStr,
        type: 'email',
      });

      if (error) throw error;
      if (!data.user) throw new Error("No user found");

      // Check onboarding_complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .single();

      if (profile && !profile.onboarding_complete) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Invalid OTP. Try again.");
      setDigits(Array(6).fill(""));
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        if (error.message.includes("rate limit") || (error as any).status === 429) {
          throw new Error("Too many requests. Please wait a minute.");
        }
        throw error;
      }
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return; // numbers only
    
    const maxVal = val.slice(-1); // only take the last char if multiple
    
    const newDigits = [...digits];
    newDigits[index] = maxVal;
    setDigits(newDigits);

    // Auto submit?
    if (newDigits.every(d => d !== "")) {
      verifyOtp(newDigits.join(""));
      return; // prevent focus move as it triggers submit logic
    }

    // Move to next input
    if (maxVal !== "" && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits[index] === "" && index > 0 && inputRefs.current[index - 1]) {
      // Move to prev input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pasted)) return;
    
    const chars = pasted.slice(0, 6).split("");
    const newDigits = Array(6).fill("");
    chars.forEach((c, i) => {
      newDigits[i] = c;
    });
    setDigits(newDigits);
    
    // Focus next empty or last
    const nextIndex = chars.length < 6 ? chars.length : 5;
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex]?.focus();
    }

    if (newDigits.every(d => d !== "")) {
      verifyOtp(newDigits.join(""));
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
            Verify your email
          </CardTitle>
          <CardDescription className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            We sent a 6-digit code or magic link to {email || "your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-center gap-2">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  className="w-12 h-14 text-center text-[20px] font-bold bg-[#0a0a0a] border border-zinc-800 rounded-none text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-mono disabled:opacity-50 transition-all"
                />
              ))}
            </div>
            <div className="text-center text-[10px] uppercase tracking-widest text-zinc-600 mt-4 leading-relaxed font-bold">
              Got a magic link? Just click the link in your email to sign in directly!
            </div>
            
            {error && <p className="text-[11px] uppercase tracking-widest text-red-500 text-center font-bold bg-red-500/10 p-2 border border-red-500/30">{error}</p>}
            
            <div className="flex justify-center h-6">
              {loading && <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-zinc-800 pt-6 pb-6 gap-2">
          <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Didn't get the code?</span>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className="text-[11px] uppercase tracking-widest text-orange-500 hover:text-orange-400 disabled:text-zinc-600 disabled:cursor-not-allowed font-bold"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono">
        <div className="text-zinc-500 text-[11px] uppercase tracking-widest font-bold">Loading...</div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  )
}
