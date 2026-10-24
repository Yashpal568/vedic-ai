-- Security and persistence hardening for the Vedic AI beta.
-- Apply after 202610240001_initial_schema.sql and 202610240002_user_memory.sql.

-- Allow a user to remove their own profile row during saved-data deletion.
drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile" on public.profiles
  for delete using (auth.uid() = id);

-- Keep recent-conversation ordering accurate whenever a message is added.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
    set updated_at = now()
    where id = new.conversation_id
      and user_id = auth.uid();
  return new;
end;
$$;

drop trigger if exists chat_messages_touch_conversation on public.chat_messages;
create trigger chat_messages_touch_conversation
after insert on public.chat_messages
for each row execute function public.touch_conversation_on_message();

-- Extra indexes support per-user export, deletion, and report retrieval.
create index if not exists chat_messages_user_created_idx
  on public.chat_messages(user_id, created_at);
create index if not exists birth_profiles_user_created_idx
  on public.birth_profiles(user_id, created_at desc);
