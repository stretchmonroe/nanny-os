-- Parent-issued, short-lived share codes. Existing email invitations remain valid.
begin;
create table public.household_join_codes (
  household_id uuid primary key references public.households(id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{12}$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.household_join_codes enable row level security;
revoke all on public.household_join_codes from public, anon, authenticated;
grant all on public.household_join_codes to service_role;

create function public.claim_household_join_code(p_user_id uuid, p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_join public.household_join_codes%rowtype;
begin
  if p_code is null or p_code !~ '^[A-HJ-NP-Z2-9]{12}$' then
    raise exception 'Invalid invitation' using errcode = 'P0001';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
  perform 1 from auth.users where id = p_user_id and email_confirmed_at is not null;
  if not found then
    raise exception 'Verified email required' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.household_members where user_id = p_user_id and status = 'active') then
    raise exception 'Already in a household' using errcode = 'P0001';
  end if;
  select * into v_join from public.household_join_codes
    where code = p_code and expires_at > now() for share;
  if not found then
    raise exception 'Invalid invitation' using errcode = 'P0001';
  end if;
  perform 1 from public.household_members
    where user_id = v_join.created_by and household_id = v_join.household_id
      and role = 'parent' and status = 'active' for share;
  if not found then
    raise exception 'Invalid invitation' using errcode = 'P0001';
  end if;
  -- Removed members cannot silently regain access; the existing composite key blocks it.
  insert into public.household_members(user_id, household_id, role, status)
    values (p_user_id, v_join.household_id, 'nanny', 'active');
  return v_join.household_id;
end;
$$;
revoke all on function public.claim_household_join_code(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_household_join_code(uuid, text) to service_role;
commit;
