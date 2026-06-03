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
