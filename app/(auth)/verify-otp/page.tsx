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
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] px-4">
      <Card className="w-full max-w-md bg-[#111111] border-[#1f2937]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <span className="text-4xl font-bold text-[#10b981]">⚡</span>
          </div>
          <CardTitle className="text-2xl tracking-tight text-white mb-2">
            Verify your email
          </CardTitle>
          <CardDescription className="text-gray-400">
            We sent a 6-digit code to {email || "your email"}
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
                  className="w-12 h-14 text-center text-xl font-bold bg-[#1a1a1a] border border-[#2d3748] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#10b981] disabled:opacity-50"
                />
              ))}
            </div>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            
            <div className="flex justify-center">
              {loading && <Loader2 className="h-6 w-6 text-[#10b981] animate-spin" />}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-[#1f2937] pt-6 gap-2">
          <span className="text-sm text-gray-400">Didn't get the code?</span>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className="text-sm text-[#10b981] hover:text-[#059669] disabled:text-gray-600 disabled:cursor-not-allowed font-medium"
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
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  )
}
