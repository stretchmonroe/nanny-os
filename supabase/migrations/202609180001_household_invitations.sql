-- Additive: existing memberships and their composite key stay intact.
begin;
create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  invited_email text not null check (invited_email = lower(trim(invited_email))),
  role text not null default 'nanny' check (role = 'nanny'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  claimed_at timestamptz,
  claimed_by uuid references auth.users(id),
  unique (household_id, invited_email)
);
alter table public.household_invitations enable row level security;
revoke all on public.household_invitations from anon, authenticated;
grant all on public.household_invitations to service_role;

-- Server-only RPC: identity comes from getUser, never a client body field.
-- Verify the confirmed email again in auth.users. Lock claim and membership.
create function public.claim_household_invitation(p_user_id uuid, p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
  v_invite public.household_invitations%rowtype;
  v_count integer;
begin
  if p_code is null or p_code !~ '^[0-9A-F]{8}$' then
    raise exception 'Invalid invitation' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select lower(trim(email)) into v_email from auth.users
    where id = p_user_id and email_confirmed_at is not null;
  if v_email is null then
    raise exception 'Verified email required' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.household_members where user_id = p_user_id and status = 'active') then
    raise exception 'Already in a household' using errcode = 'P0001';
  end if;
  select count(*) into v_count from public.household_invitations
    where invited_email = v_email and claimed_at is null and expires_at > now()
      and upper(split_part(household_id::text, '-', 1)) = p_code;
  if v_count <> 1 then
    raise exception 'Invalid invitation' using errcode = 'P0001';
  end if;
  select * into v_invite from public.household_invitations
    where invited_email = v_email and claimed_at is null and expires_at > now()
      and upper(split_part(household_id::text, '-', 1)) = p_code for update;
  if not found then
    raise exception 'Invalid invitation' using errcode = 'P0001';
  end if;
  perform 1 from public.household_members
    where user_id = v_invite.created_by and household_id = v_invite.household_id
      and role = 'parent' and status = 'active' for share;
  if not found then
    raise exception 'Invalid invitation' using errcode = 'P0001';
  end if;
  -- Do not silently reactivate removed members.
  insert into public.household_members(user_id, household_id, role, status)
    values (p_user_id, v_invite.household_id, 'nanny', 'active');
  update public.household_invitations set claimed_at = now(), claimed_by = p_user_id
    where id = v_invite.id;
  return v_invite.household_id;
end;
$$;
revoke all on function public.claim_household_invitation(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_household_invitation(uuid, text) to service_role;
commit;
