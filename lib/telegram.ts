import { createClient } from '@supabase/supabase-js'

type ProfileRow = {
  telegram_chat_id: string | null
}

/**
 * Send a Telegram message to a user by their Supabase userId.
 * Looks up the telegram_chat_id from their profile.
 * Safe to call from server-only contexts (API routes, server actions).
 */
export async function sendTelegramToUser(
  userId: string,
  message: string,
  parseMode?: 'HTML' | 'Markdown'
): Promise<void> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', userId)
      .single<ProfileRow>()

    if (!profile?.telegram_chat_id) return

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: parseInt(profile.telegram_chat_id),
          text: message,
          ...(parseMode ? { parse_mode: parseMode } : {}),
        }),
      }
    )
  } catch (error) {
    console.error('sendTelegramToUser error:', error)
  }
}
