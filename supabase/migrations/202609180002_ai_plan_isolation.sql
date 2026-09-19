-- Replace the two unrestricted policies observed in the 2026-09-18 export.
-- No rows are rewritten or deleted. NULL/unmatched child IDs fail closed.
begin;
drop policy "allow authenticated read" on public.ai_plans;
drop policy "allow authenticated insert" on public.ai_plans;
create policy "ai_plans:household_read" on public.ai_plans
  for select to authenticated using (
    exists (select 1 from public.children c
      join public.household_members hm on hm.household_id = c.household_id
      where c.id::text = ai_plans.child_id::text
        and hm.user_id = auth.uid() and hm.status = 'active')
  );
create policy "ai_plans:parent_insert" on public.ai_plans
  for insert to authenticated with check (
    exists (select 1 from public.children c
      join public.household_members hm on hm.household_id = c.household_id
      where c.id::text = ai_plans.child_id::text
        and hm.user_id = auth.uid() and hm.status = 'active' and hm.role = 'parent')
  );
commit;
