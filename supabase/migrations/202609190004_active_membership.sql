-- Based on the live security-preflight export. No application rows are changed.
begin;
do $$
begin
  if exists (select 1 from public.household_members where status='active'
    group by user_id having count(*) > 1) then
    raise exception 'Multiple active households require review before helper replacement';
  end if;
end $$;
create or replace function public.my_household_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select hm.household_id from public.household_members hm
  where hm.user_id = auth.uid() and hm.status = 'active'
    and (select count(*) from public.household_members m
      where m.user_id = auth.uid() and m.status = 'active') = 1
$$;
create or replace function public.my_role()
returns text language sql stable security definer set search_path = '' as $$
  select hm.role from public.household_members hm
  where hm.user_id = auth.uid() and hm.status = 'active'
    and hm.household_id = public.my_household_id()
$$;
create or replace function public.in_my_household(p_child_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.children c
    where c.id = p_child_id and c.household_id = public.my_household_id())
$$;
-- Keep anonymous execution compatible with existing PUBLIC policies; auth.uid()
-- is NULL for anonymous callers, so these return no household/access.

drop policy "household members can read activity_logs" on public.activity_logs;
drop policy "household members can insert activity_logs" on public.activity_logs;
drop policy "household members can delete activity_logs" on public.activity_logs;
create policy "activity_logs:active_read" on public.activity_logs for select to authenticated
  using (public.in_my_household(child_id));
create policy "activity_logs:active_insert" on public.activity_logs for insert to authenticated
  with check (public.in_my_household(child_id));
create policy "activity_logs:active_delete" on public.activity_logs for delete to authenticated
  using (public.in_my_household(child_id));

drop policy "users manage own subscriptions" on public.push_subscriptions;
create policy "push:own_read" on public.push_subscriptions for select to authenticated
  using (user_id=auth.uid());
create policy "push:own_delete" on public.push_subscriptions for delete to authenticated
  using (user_id=auth.uid());
create policy "push:active_insert" on public.push_subscriptions for insert to authenticated
  with check (user_id=auth.uid() and household_id=public.my_household_id() and role=public.my_role());
create policy "push:active_update" on public.push_subscriptions for update to authenticated
  using (user_id=auth.uid())
  with check (user_id=auth.uid() and household_id=public.my_household_id() and role=public.my_role());

-- RLS does not protect TRUNCATE. Client roles do not need DDL-related privileges.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
commit;
