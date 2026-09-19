-- Deploy signed-photo client first. Rehearse this guarded migration in staging.
-- No objects or memory rows are moved/deleted. Unmapped paths stop the migration.
begin;
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'photos') then
    raise exception 'photos bucket missing';
  end if;
  if exists (
    select 1 from storage.objects o where o.bucket_id = 'photos'
      and (o.name !~* '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|heic|heif)$'
        or split_part(o.name, '/', 1) in ('shared','default')
        or not exists (select 1 from public.children c
          join public.household_members hm on hm.household_id = c.household_id
          where c.id::text = split_part(o.name, '/', 1) and hm.user_id = o.owner))
  ) then
    raise exception 'Unmapped photo paths: review inventory before private cutover';
  end if;
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects'
    and policyname not in ('photos:select','photos:insert','photos:delete')) then
    raise exception 'Unexpected storage policies: review before cutover';
  end if;
end $$;

create function public.can_access_child_photo(object_name text, parents_only boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select object_name ~* '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|heic|heif)$'
    and split_part(object_name, '/', 1) not in ('shared','default')
    and exists (select 1 from public.children c
      join public.household_members hm on hm.household_id = c.household_id
      where c.id::text = split_part(object_name, '/', 1)
        and hm.user_id = auth.uid() and hm.status = 'active'
        and (not parents_only or hm.role = 'parent'));
$$;
revoke all on function public.can_access_child_photo(text, boolean) from public, anon;
grant execute on function public.can_access_child_photo(text, boolean) to authenticated;

drop policy "photos:select" on storage.objects;
drop policy "photos:insert" on storage.objects;
drop policy "photos:delete" on storage.objects;
create policy "photos:household_read" on storage.objects for select to authenticated
  using (bucket_id='photos' and public.can_access_child_photo(name));
create policy "photos:household_upload" on storage.objects for insert to authenticated
  with check (bucket_id='photos' and public.can_access_child_photo(name));
create policy "photos:household_delete" on storage.objects for delete to authenticated
  using (bucket_id='photos' and public.can_access_child_photo(name)
    and (owner=auth.uid() or public.can_access_child_photo(name, true)));

update storage.buckets set public=false, file_size_limit=10485760,
  allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif']
  where id='photos';
commit;
