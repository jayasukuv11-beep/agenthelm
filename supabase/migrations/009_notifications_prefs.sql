-- Add notifications_prefs to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notifications_prefs JSONB DEFAULT '{
  "agent_error": true,
  "agent_silent": true,
  "high_error_rate": true,
  "token_spike": true,
  "daily_summary": false,
  "credits_warning": true
}'::jsonb;
