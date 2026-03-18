"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { 
  Copy, 
  RefreshCcw, 
  Check, 
  AlertCircle, 
  WifiOff, 
  Zap, 
  BarChart2, 
  CreditCard, 
  TrendingUp,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { nanoid } from "nanoid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  connect_key: string;
  plan: "free" | "indie" | "studio";
  telegram_chat_id: string | null;
  notifications_prefs: {
    agent_error: boolean;
    agent_silent: boolean;
    high_error_rate: boolean;
    token_spike: boolean;
    daily_summary: boolean;
    credits_warning: boolean;
  };
  plan_expires_at: string | null;
};

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [prefs, setPrefs] = useState<Profile["notifications_prefs"] | null>(null);
  const [prefsChanged, setPrefsChanged] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      
      if (testMode) {
        const mockProfile: Profile = {
          id: "test-user-id",
          email: "test@example.com",
          full_name: "Test User",
          connect_key: "ahe_live_abcdef1234567890",
          plan: "free",
          telegram_chat_id: null,
          notifications_prefs: {
            agent_error: true,
            agent_silent: true,
            high_error_rate: true,
            token_spike: true,
            daily_summary: false,
            credits_warning: true,
          },
          plan_expires_at: null,
        };
        setProfile(mockProfile);
        setFullName(mockProfile.full_name || "");
        setPrefs(mockProfile.notifications_prefs);
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name || "");
        setPrefs(data.notifications_prefs || {
          agent_error: true,
          agent_silent: true,
          high_error_rate: true,
          token_spike: true,
          daily_summary: false,
          credits_warning: true,
        });
      }
      setLoading(false);
    }

    loadProfile();
  }, [supabase, testMode]);

  const handleCopyKey = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.connect_key);
    setKeyCopied(true);
    toast({ title: "Key copied", description: "Connect key copied to clipboard" });
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleRegenerateKey = async () => {
    if (!profile) return;
    const newKey = "ahe_live_" + nanoid(16);
    
    if (testMode) {
      setProfile({ ...profile, connect_key: newKey });
      setShowRegenModal(false);
      toast({ title: "Key regenerated", description: "Connect key regenerated successfully (Test Mode)" });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ connect_key: newKey })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, connect_key: newKey });
      setShowRegenModal(false);
      toast({ title: "Key regenerated", description: "Connect key regenerated successfully" });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    if (testMode) {
      setProfile({ ...profile, full_name: fullName });
      toast({ title: "Profile updated", description: "Your profile has been updated (Test Mode)" });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, full_name: fullName });
      toast({ title: "Profile updated", description: "Your profile has been updated" });
    }
  };

  const handleTogglePref = (key: keyof Profile["notifications_prefs"]) => {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: !prefs[key] });
    setPrefsChanged(true);
  };

  const handleSavePrefs = async () => {
    if (!profile || !prefs) return;

    if (testMode) {
      setProfile({ ...profile, notifications_prefs: prefs });
      setPrefsChanged(false);
      toast({ title: "Preferences saved", description: "Notification preferences updated (Test Mode)" });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ notifications_prefs: prefs })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, notifications_prefs: prefs });
      setPrefsChanged(false);
      toast({ title: "Preferences saved", description: "Notification preferences updated" });
    }
  };

  const handleTestAlert = async () => {
    try {
      const res = await fetch("/api/telegram/test", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Test alert sent", description: "Check your Telegram app for the message" });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Test alert failed", 
          description: data.error || "Failed to send test alert" 
        });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong" });
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!profile) return;

    if (testMode) {
      setProfile({ ...profile, telegram_chat_id: null });
      setShowDisconnectModal(false);
      toast({ title: "Telegram disconnected", description: "Telegram link removed (Test Mode)" });
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ telegram_chat_id: null })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, telegram_chat_id: null });
      setShowDisconnectModal(false);
      toast({ title: "Telegram disconnected", description: "Telegram link removed" });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE" || !profile) return;

    if (testMode) {
       toast({ title: "Account deleted", description: "Account deletion simulated (Test Mode)" });
       setTimeout(() => window.location.href = "/", 2000);
       return;
    }

    // Logic for actual deletion would involve multiple tables via RLS cascade or explicit RPC
    // For MVP, we use explicit deletes
    const { error: agentsErr } = await supabase.from("agents").delete().eq("user_id", profile.id);
    const { error: profileErr } = await supabase.from("profiles").delete().eq("id", profile.id);

    if (!profileErr) {
      await supabase.auth.signOut();
      window.location.href = "/?deleted=true";
    }
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto space-y-6 animate-pulse">
        <div className="space-y-2 mb-8">
           <div className="h-8 bg-gray-800 rounded w-1/4" />
           <div className="h-4 bg-gray-800 rounded w-1/2" />
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-[#111111] border-[#1f2937]">
            <CardHeader className="border-b border-[#1f2937]">
              <div className="h-6 bg-gray-800 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-1/2" />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-20 bg-gray-800/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!profile) return <div className="text-center py-12 text-gray-400">Profile not found.</div>;

  return (
    <div className="max-w-[800px] mx-auto space-y-6 pb-24">
      <div className="space-y-1 mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-gray-400">Manage your account and integrations</p>
      </div>

      {/* Section 1: Connect Key */}
      <Card className="bg-[#111111] border-[#1f2937] rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#1f2937] pb-4">
          <CardTitle className="text-lg">Connect Key</CardTitle>
          <CardDescription>Use this key to connect your agents to AgentHelm</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="bg-black border border-[#1f2937] rounded-lg p-4 font-mono text-sm text-[#10b981] break-all tracking-wider">
            {profile.connect_key}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleCopyKey} className="border-[#1f2937] hover:bg-gray-800 text-sm">
              {keyCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {keyCopied ? "Copied!" : "Copy Key"}
            </Button>
            <Button variant="outline" onClick={() => setShowRegenModal(true)} className="border-[#1f2937] hover:bg-red-950/20 text-red-400 hover:text-red-400 text-sm hover:border-red-900">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Regenerate Key
            </Button>
          </div>

          <div className="pt-4 border-t border-[#1f2937]">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Quick Install</p>
            <div className="bg-[#050505] rounded-lg border border-[#1f2937] p-4 relative group">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  navigator.clipboard.writeText(`pip install agenthelm-sdk\n\nimport agenthelm\ndock = agenthelm.connect("${profile.connect_key}", name="My Agent")`);
                  toast({ title: "Snippet copied" });
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <pre className="text-xs text-gray-300 font-mono space-y-4 overflow-x-auto">
                <code>{`# Python\npip install agenthelm-sdk\n\nimport agenthelm\ndock = agenthelm.connect("${profile.connect_key}", name="My Agent")`}</code>
                <div className="h-px bg-gray-800 my-4" />
                <code>{`# Node.js\nnpm install agenthelm-sdk\n\nconst dock = require('agenthelm-sdk')\ndock.connect("${profile.connect_key}", { name: "My Agent" })`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Telegram Integration */}
      <Card className="bg-[#111111] border-[#1f2937] rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#1f2937] pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Telegram Alerts</CardTitle>
              <CardDescription>Get real-time alerts and control agents via Telegram</CardDescription>
            </div>
            {profile.telegram_chat_id ? (
              <Badge className="bg-[#064e3b] text-[#10b981] border-[#065f46]">🟢 Connected</Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-800 text-gray-400">⚫ Not Connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {!profile.telegram_chat_id ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-400 leading-relaxed">
                Connect your Telegram account to receive agent crash alerts instantly, daily usage summaries, 
                and control agents with commands.
              </p>
              <Button 
                onClick={() => window.open(`https://t.me/AgentHelmBot?start=${profile.connect_key}`, '_blank')}
                className="bg-[#10b981] hover:bg-[#059669] text-white w-full sm:w-auto px-8"
              >
                Connect Telegram <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
              <div className="bg-[#1a1a1a]/50 p-4 rounded-lg border border-[#1f2937] space-y-2">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">How to connect:</p>
                <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Click the green button above</li>
                  <li>Telegram opens with @AgentHelmBot</li>
                  <li>Press "Start" or send /start</li>
                </ol>
              </div>
              <p className="text-[10px] text-gray-500 italic">
                Your messages are private. We never read personal Telegram content.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-300">
                Telegram is linked to your AgentHelm account.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTestAlert} className="border-[#1f2937] hover:bg-gray-800">
                  Test Alert
                </Button>
                <Button variant="outline" onClick={() => setShowDisconnectModal(true)} className="border-[#1f2937] text-red-400 hover:bg-red-950/20 hover:border-red-900">
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Notification Preferences */}
      <Card className="bg-[#111111] border-[#1f2937] rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#1f2937] pb-4">
          <CardTitle className="text-lg">Notifications</CardTitle>
          <CardDescription>Choose when to receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-1">
          {prefs && (
            <>
              {[
                { key: 'agent_error', label: 'Agent error alerts', desc: 'Notify when an agent crashes or errors', icon: AlertCircle, color: 'text-red-500' },
                { key: 'agent_silent', label: 'Agent went silent', desc: 'Notify when an agent stops pinging (10m+)', icon: WifiOff, color: 'text-orange-500' },
                { key: 'high_error_rate', label: 'High error rate', desc: 'Notify when >20% of logs are errors', icon: TrendingUp, color: 'text-yellow-500' },
                { key: 'token_spike', label: 'Token spike warning', desc: 'Notify when token usage is 3x above normal', icon: Zap, color: 'text-yellow-500' },
                { key: 'daily_summary', label: 'Daily summary', desc: 'Receive a daily report at 8 AM', icon: BarChart2, color: 'text-blue-500' },
                { key: 'credits_warning', label: 'Credits at 80% warning', desc: 'Notify when monthly limit is 80% used', icon: CreditCard, color: 'text-orange-500' },
              ].map((item, idx) => (
                <div key={item.key} className={cn("flex items-center justify-between py-4", idx !== 0 && "border-t border-[#1f2937]")}>
                  <div className="flex gap-4">
                    <div className={cn("mt-1 shrink-0", item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor={item.key} className="text-sm font-medium text-gray-200 cursor-pointer">{item.label}</Label>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <Switch 
                    id={item.key} 
                    checked={prefs[item.key as keyof Profile["notifications_prefs"]]} 
                    onCheckedChange={() => handleTogglePref(item.key as keyof Profile["notifications_prefs"])} 
                  />
                </div>
              ))}
              
              {prefsChanged && (
                <div className="pt-4 border-t border-[#1f2937] flex justify-end">
                  <Button onClick={handleSavePrefs} className="bg-[#10b981] hover:bg-[#059669] text-white">
                    Save Preferences
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Profile */}
      <Card className="bg-[#111111] border-[#1f2937] rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#1f2937] pb-4">
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-300">Full Name</Label>
            <Input 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              className="bg-[#1a1a1a] border-[#1f2937] text-white focus:ring-[#10b981]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Email Address</Label>
            <Input 
              value={profile.email}
              disabled
              className="bg-[#0c0c0c] border-[#1f2937] text-gray-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-gray-600">Email cannot be changed.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300 block">Current Plan</Label>
            <div className="flex items-center gap-3">
              <Badge className={cn(
                "capitalize px-3 py-1",
                profile.plan === 'free' ? "bg-gray-800 text-gray-400" :
                profile.plan === 'indie' ? "bg-[#064e3b] text-[#10b981]" : "bg-[#1e1b4b] text-[#818cf8]"
              )}>
                {profile.plan}
              </Badge>
              {profile.plan === 'free' && (
                <Link href="#billing" className="text-xs text-[#10b981] hover:underline">Upgrade Plan →</Link>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
             <Button 
                onClick={handleSaveProfile} 
                disabled={fullName === profile.full_name}
                className={cn(
                  "bg-[#10b981] hover:bg-[#059669] text-white",
                  fullName === profile.full_name && "opacity-50 grayscale cursor-not-allowed"
                )}
             >
               Save Changes
             </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Plan & Billing */}
      <Card id="billing" className="bg-[#111111] border-[#1f2937] rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[#1f2937] pb-4">
          <CardTitle className="text-lg">Plan & Billing</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
           <div className="border border-[#1f2937] rounded-xl p-6 bg-black">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white capitalize">{profile.plan} Plan</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {profile.plan === 'free' ? 'Basic monitoring for small projects.' : 'Enhanced monitoring with all features.'}
                  </p>
                </div>
                {profile.plan === 'indie' && <Check className="text-[#10b981] w-6 h-6" />}
              </div>
              
              <ul className="space-y-3 mb-8">
                {[
                  { label: "3 agents", free: true, indie: true, studio: true },
                  { label: "100,000 tokens/month", free: true, indie: true, studio: true },
                  { label: "7 day log history", free: true, indie: true, studio: true },
                  { label: "Telegram alerts", free: true, indie: true, studio: true },
                  { label: "AI failure explanations", free: false, indie: true, studio: true },
                  { label: "All anomaly alerts", free: false, indie: true, studio: true },
                ].map((f, i) => (
                  <li key={i} className="flex items-center text-sm gap-3">
                    {f[profile.plan as keyof typeof f] ? (
                      <Check className="w-4 h-4 text-[#10b981] shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-gray-700 shrink-0" />
                    )}
                    <span className={f[profile.plan as keyof typeof f] ? "text-gray-300" : "text-gray-600 line-through"}>{f.label}</span>
                  </li>
                ))}
              </ul>

              {profile.plan === 'free' ? (
                <div className="space-y-4">
                  <div className="h-px bg-[#1f2937] w-full" />
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">₹399<span className="text-sm font-normal text-gray-500">/month</span></p>
                      <p className="text-xs text-[#10b981]">Indie Plan</p>
                    </div>
                    <Button className="bg-[#10b981] hover:bg-[#059669] text-white px-8">Upgrade to Indie →</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-px bg-[#1f2937] w-full" />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">Your plan is managed via Stripe.</p>
                    <Button variant="outline" className="border-[#1f2937] hover:bg-gray-800 text-xs">Manage Billing</Button>
                  </div>
                </div>
              )}
           </div>

           {profile.plan_expires_at && (
             <div className="mt-4 p-4 bg-yellow-950/20 border border-yellow-900/30 rounded-lg flex gap-4">
                <div className="mt-0.5"><Zap className="w-5 h-5 text-yellow-500" /></div>
                <div>
                  <p className="text-sm font-bold text-yellow-500">Trial Period</p>
                  <p className="text-xs text-yellow-500/80">
                    Your active trial ends on {new Date(profile.plan_expires_at).toLocaleDateString()}. 
                    Upgrade now to avoid interruption.
                  </p>
                </div>
             </div>
           )}
        </CardContent>
      </Card>

      {/* Section 6: Danger Zone */}
      <Card className="border-red-900 bg-[#0c0505] rounded-xl overflow-hidden">
        <CardHeader className="border-b border-red-900/30 pb-4">
          <CardTitle className="text-lg text-red-400">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button 
            variant="outline" 
            onClick={() => setShowDeleteModal(true)}
            className="w-full border-red-900/50 text-red-500 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900"
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Modals */}
      <Dialog open={showRegenModal} onOpenChange={setShowRegenModal}>
        <DialogContent className="bg-[#111111] border-[#1f2937] text-white">
          <DialogHeader>
            <DialogTitle>Regenerate Connect Key?</DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              This will permanently disconnect all agents currently using your key.
              <br /><br />
              You will need to update the key in every agent before they can reconnect.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setShowRegenModal(false)} className="text-gray-400 hover:bg-gray-800">Cancel</Button>
            <Button onClick={handleRegenerateKey} className="bg-red-600 hover:bg-red-700 text-white">Yes, Regenerate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisconnectModal} onOpenChange={setShowDisconnectModal}>
        <DialogContent className="bg-[#111111] border-[#1f2937] text-white">
          <DialogHeader>
            <DialogTitle>Disconnect Telegram?</DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              You will stop receiving real-time alerts and lose control of your agents via Telegram.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setShowDisconnectModal(false)} className="text-gray-400 hover:bg-gray-800">Cancel</Button>
            <Button onClick={handleDisconnectTelegram} className="bg-red-600 hover:bg-red-700 text-white">Disconnect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-[#111111] border-[#1f2937] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-5 h-5" /> Delete Account
            </DialogTitle>
            <div className="text-gray-400 pt-2 text-sm space-y-4">
              <p>This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Your account and profile</li>
                <li>All connected agents</li>
                <li>All logs and chat history</li>
                <li>All token usage data</li>
              </ul>
              <p className="font-bold text-red-500">This action CANNOT be undone.</p>
            </div>
          </DialogHeader>
          <div className="space-y-2 py-4">
             <Label htmlFor="confirm-delete" className="text-xs text-gray-300">Type DELETE to confirm</Label>
             <Input 
                id="confirm-delete"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="bg-[#1a1a1a] border-red-900/30 text-white focus:ring-red-600"
             />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:bg-gray-800">Cancel</Button>
            <Button 
              disabled={deleteConfirm !== "DELETE"}
              onClick={handleDeleteAccount} 
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Link({ children, href, className }: { children: React.ReactNode, href: string, className?: string }) {
  return <a href={href} className={className}>{children}</a>;
}

function X({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}
