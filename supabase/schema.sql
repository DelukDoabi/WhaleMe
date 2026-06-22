-- Run this in the Supabase SQL editor to create the crafts table

create table if not exists public.crafts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  craft_id text not null,
  game_id text not null,
  data jsonb not null,
  updated_at timestamptz default now() not null,
  created_at timestamptz default now() not null,
  unique(user_id, craft_id)
);

-- Enable Row Level Security
alter table public.crafts enable row level security;

-- Users can only access their own crafts
create policy "Users can read own crafts" on public.crafts
  for select using (auth.uid() = user_id);

create policy "Users can insert own crafts" on public.crafts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own crafts" on public.crafts
  for update using (auth.uid() = user_id);

create policy "Users can delete own crafts" on public.crafts
  for delete using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists crafts_user_game_idx on public.crafts(user_id, game_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Material price history — one row per (user, material_key)
-- data: { displayName: string, entries: [{ date: YYYY-MM-DD, unitCost: number }] }
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.material_prices (
  user_id      uuid references auth.users(id) on delete cascade not null,
  material_key text not null,
  data         jsonb not null,
  updated_at   timestamptz default now() not null,
  primary key (user_id, material_key)
);

alter table public.material_prices enable row level security;

create policy "Users can read own material prices" on public.material_prices
  for select using (auth.uid() = user_id);

create policy "Users can insert own material prices" on public.material_prices
  for insert with check (auth.uid() = user_id);

create policy "Users can update own material prices" on public.material_prices
  for update using (auth.uid() = user_id);

create policy "Users can delete own material prices" on public.material_prices
  for delete using (auth.uid() = user_id);

create index if not exists material_prices_user_idx on public.material_prices(user_id);
