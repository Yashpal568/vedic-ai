-- Vedic AI initial relational schema
-- Apply with Supabase CLI after reviewing access policies for your deployment.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.birth_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  birth_date date not null,
  local_birth_time time not null,
  birthplace_label text not null,
  latitude double precision,
  longitude double precision,
  timezone_id text,
  time_accuracy text not null default 'unknown' check (time_accuracy in ('exact', 'approximate', 'unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_latitude check (latitude is null or latitude between -90 and 90),
  constraint valid_longitude check (longitude is null or longitude between -180 and 180)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  birth_profile_id uuid references public.birth_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 20000),
  provider text,
  model text,
  created_at timestamptz not null default now()
);

create table if not exists public.kundli_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  birth_profile_id uuid not null references public.birth_profiles(id) on delete cascade,
  calculation_engine text not null,
  engine_version text,
  ayanamsha text not null default 'lahiri',
  zodiac_system text not null default 'sidereal',
  house_system text not null default 'whole_sign',
  calculation_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists birth_profiles_user_id_idx on public.birth_profiles(user_id);
create index if not exists conversations_user_updated_idx on public.conversations(user_id, updated_at desc);
create index if not exists chat_messages_conversation_created_idx on public.chat_messages(conversation_id, created_at);
create index if not exists kundli_reports_user_created_idx on public.kundli_reports(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.birth_profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.kundli_reports enable row level security;

create policy "Users can read their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage their own birth profiles" on public.birth_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own conversations" on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own messages" on public.chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their own kundli reports" on public.kundli_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Do not expose the Supabase service-role key to the browser.
-- Before production, add updated_at triggers, stricter ownership checks for message/conversation joins,
-- abuse/rate limiting, data export/deletion flows, and tests for every RLS policy.
