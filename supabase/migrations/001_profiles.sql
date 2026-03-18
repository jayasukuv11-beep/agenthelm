-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  connect_key TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','indie','studio')),
  telegram_chat_id TEXT,
  tokens_limit_monthly BIGINT DEFAULT 100000,
  plan_expires_at TIMESTAMPTZ,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto generate connect key on signup
CREATE OR REPLACE FUNCTION generate_connect_key()
RETURNS TRIGGER AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := 'ahe_live_';
  i INT;
BEGIN
  FOR i IN 1..16 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  NEW.connect_key := result;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_connect_key
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.connect_key IS NULL)
  EXECUTE FUNCTION generate_connect_key();

-- Auto create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
