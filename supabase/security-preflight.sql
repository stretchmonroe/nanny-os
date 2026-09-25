-- Read only: counts and authorization definitions, no family records or keys.
-- Required before deployment; run in normal browser SQL Editor and export JSON.
select jsonb_pretty(jsonb_build_object(
  'helpers', (select jsonb_agg(jsonb_build_object(
    'name', p.proname, 'definition', pg_get_functiondef(p.oid)))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('my_household_id','my_role','in_my_household')),
  'grants', (select jsonb_agg(to_jsonb(g)) from
    (select grantee, table_name, privilege_type from information_schema.role_table_grants
      where table_schema='public' and grantee in ('anon','authenticated')) g),
  'photo_counts', (select jsonb_build_object(
    'total', count(*),
    'unmapped', count(*) filter (where
      o.name !~* '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|heic|heif)$'
      or split_part(o.name,'/',1) in ('shared','default')
      or not exists (select 1 from public.children c
        join public.household_members hm on hm.household_id=c.household_id
        where c.id::text=split_part(o.name,'/',1) and hm.user_id=o.owner)),
    'missing_owner', count(*) filter (where owner is null))
    from storage.objects o where bucket_id='photos'),
  'membership_counts', (select jsonb_object_agg(status, n)
    from (select status, count(*) n from public.household_members group by status) m)
)) as security_preflight;
