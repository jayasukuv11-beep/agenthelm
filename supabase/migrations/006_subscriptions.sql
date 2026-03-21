create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  order_id text,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage subscriptions"
  on subscriptions for all
  using (true)
  with check (true);

create unique index if not exists
  subscriptions_user_id_idx on subscriptions(user_id);
