-- Persistent, user-editable assistant memory.
-- Apply this migration in Supabase SQL Editor before deploying the memory UI.
create table if not exists public.user_memories (
  user_id uuid primary key references auth.users(id) on delete cascade,
  memory_text text not null default '',
  updated_at timestamptz not null default now(),
  constraint user_memories_length check (char_length(memory_text) <= 6000)
);

alter table public.user_memories enable row level security;
drop policy if exists "Users manage their own memory" on public.user_memories;
create policy "Users manage their own memory" on public.user_memories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists user_memories_set_updated_at on public.user_memories;
create trigger user_memories_set_updated_at before update on public.user_memories
  for each row execute function public.set_updated_at();

comment on table public.user_memories is 'Explicit user-editable context used to personalize assistant replies. Users can inspect, edit, or delete it.';
comment on column public.user_memories.memory_text is 'User-approved memory only; do not store sensitive data or credentials.';
