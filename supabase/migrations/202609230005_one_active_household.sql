-- Keep a user in at most one active household, including concurrent claims/setup.
-- Removed/invited memberships may still exist in other households.
begin;
do $$
begin
  if exists (select 1 from public.household_members where status = 'active'
    group by user_id having count(*) > 1) then
    raise exception 'Multiple active households require review before uniqueness constraint';
  end if;
end $$;
create unique index household_members_one_active_per_user
  on public.household_members (user_id) where status = 'active';
commit;
