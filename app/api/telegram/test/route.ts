import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch profile for telegram_chat_id
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("telegram_chat_id")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    if (!profile.telegram_chat_id) {
      return NextResponse.json({ error: "Telegram not connected" }, { status: 400 });
    }

    // Send test message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: profile.telegram_chat_id,
          text: "✅ <b>AgentDock Test Alert</b>\n\nYour Telegram connection is working perfectly! You'll receive real-time updates for your agents here.",
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Telegram API error:", errorData);
      return NextResponse.json({ error: "Failed to send Telegram message" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram test error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
