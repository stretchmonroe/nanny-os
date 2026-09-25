-- One locked row per user keeps paid AI request limits across server instances.
begin;
create table public.ai_request_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hour_start timestamptz not null,
  hour_count integer not null default 0 check (hour_count >= 0),
  day_start timestamptz not null,
  day_count integer not null default 0 check (day_count >= 0)
);
alter table public.ai_request_quotas enable row level security;
revoke all on public.ai_request_quotas from public, anon, authenticated;
grant all on public.ai_request_quotas to service_role;

create function public.consume_ai_request_quota(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_hour timestamptz := pg_catalog.date_trunc('hour', now());
  v_day timestamptz := pg_catalog.date_trunc('day', now());
  v_quota public.ai_request_quotas%rowtype;
begin
  if not exists (select 1 from public.household_members
    where user_id = p_user_id and status = 'active') then
    raise exception 'Active household required' using errcode = 'P0002';
  end if;
  insert into public.ai_request_quotas(user_id, hour_start, day_start)
    values (p_user_id, v_hour, v_day) on conflict (user_id) do nothing;
  select * into v_quota from public.ai_request_quotas
    where user_id = p_user_id for update;
  if (case when v_quota.hour_start = v_hour then v_quota.hour_count else 0 end) >= 20
    or (case when v_quota.day_start = v_day then v_quota.day_count else 0 end) >= 100 then
    raise exception 'AI request limit reached' using errcode = 'P0001';
  end if;
  update public.ai_request_quotas set
    hour_start = v_hour,
    hour_count = case when v_quota.hour_start = v_hour then v_quota.hour_count + 1 else 1 end,
    day_start = v_day,
    day_count = case when v_quota.day_start = v_day then v_quota.day_count + 1 else 1 end
    where user_id = p_user_id;
end;
$$;
revoke all on function public.consume_ai_request_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_request_quota(uuid) to service_role;
commit;
