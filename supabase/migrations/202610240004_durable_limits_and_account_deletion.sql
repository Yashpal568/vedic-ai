-- Durable shared rate limits and account-deletion support.
-- Apply after migrations 001-003. The rate-limit table is only accessible via
-- a service-role-only RPC; browser/anon/authenticated clients cannot read or mutate it.

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from anon, authenticated, public;
grant all on public.rate_limit_buckets to service_role;

create or replace function public.consume_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer, remaining integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_started timestamptz;
  v_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if auth.role() <> 'service_role' then
    raise exception 'not authorized';
  end if;
  if p_bucket_key is null or length(p_bucket_key) < 16 or length(p_bucket_key) > 128
     or p_limit < 1 or p_limit > 100000
     or p_window_seconds < 1 or p_window_seconds > 2592000 then
    raise exception 'invalid rate limit parameters';
  end if;

  insert into public.rate_limit_buckets as b (bucket_key, window_started_at, request_count, updated_at)
  values (p_bucket_key, v_now, 1, v_now)
  on conflict (bucket_key) do update
    set request_count = case
          when b.window_started_at + make_interval(secs => p_window_seconds) <= v_now then 1
          else b.request_count + 1
        end,
        window_started_at = case
          when b.window_started_at + make_interval(secs => p_window_seconds) <= v_now then v_now
          else b.window_started_at
        end,
        updated_at = v_now
  returning b.window_started_at, b.request_count into v_started, v_count;

  if mod(v_count, 100) = 0 then
    delete from public.rate_limit_buckets where updated_at < v_now - interval '2 days';
  end if;

  return query select
    (v_count <= p_limit),
    greatest(1, ceil(extract(epoch from (v_started + make_interval(secs => p_window_seconds) - v_now)))::integer),
    greatest(0, p_limit - v_count);
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

comment on table public.rate_limit_buckets is 'Private durable request counters; only the server service-role RPC may access these rows.';
