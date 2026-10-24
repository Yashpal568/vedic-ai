-- Run in Supabase SQL Editor after migrations 001-004.
-- This is a schema/policy audit, not a substitute for live two-account API tests.
do $$
declare
  missing_tables text;
  missing_policies text;
begin
  select string_agg(required.table_name, ', ')
    into missing_tables
  from (values
    ('profiles'), ('birth_profiles'), ('conversations'),
    ('chat_messages'), ('kundli_reports'), ('user_memories'),
    ('rate_limit_buckets')
  ) as required(table_name)
  left join pg_class c on c.relname = required.table_name
  left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
  where c.oid is null or n.oid is null or not c.relrowsecurity;

  if missing_tables is not null then
    raise exception 'RLS audit failed: missing tables or RLS disabled: %', missing_tables;
  end if;

  select string_agg(required.table_name || ':' || required.policy_name, ', ')
    into missing_policies
  from (values
    ('profiles', 'Users can read their own profile'),
    ('profiles', 'Users can insert their own profile'),
    ('profiles', 'Users can update their own profile'),
    ('profiles', 'Users can delete their own profile'),
    ('birth_profiles', 'Users manage their own birth profiles'),
    ('conversations', 'Users manage their own conversations'),
    ('chat_messages', 'Users read their own messages'),
    ('chat_messages', 'Users insert their own messages'),
    ('chat_messages', 'Users update their own messages'),
    ('chat_messages', 'Users delete their own messages'),
    ('kundli_reports', 'Users read their own kundli reports'),
    ('kundli_reports', 'Users insert their own kundli reports'),
    ('kundli_reports', 'Users update their own kundli reports'),
    ('kundli_reports', 'Users delete their own kundli reports'),
    ('user_memories', 'Users manage their own memory')
  ) as required(table_name, policy_name)
  left join pg_policies p on p.schemaname = 'public'
    and p.tablename = required.table_name
    and p.policyname = required.policy_name
  where p.policyname is null;

  if missing_policies is not null then
    raise exception 'RLS audit failed: missing expected policies: %', missing_policies;
  end if;

  if has_function_privilege('anon', 'public.consume_rate_limit(text,integer,integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.consume_rate_limit(text,integer,integer)', 'EXECUTE') then
    raise exception 'RLS audit failed: rate-limit RPC must not be executable by anon/authenticated roles';
  end if;
end;
$$;

select 'Vedic AI RLS schema audit passed. Still run the documented two-account negative-access tests against the deployed app.' as audit_result;
