#!/usr/bin/env bash
# Rehearse seven guarded migrations against the owner's isolated local SQL copy.
# Does not link to or connect to a remote project.
set -euo pipefail
umask 077
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
runtime="$repo_dir/tests/production-staging/runtime"
container='supabase_db_ankur-production-copy'
if [ ! -f "$runtime/supabase/config.toml" ] ||
   ! grep -qx 'project_id = "ankur-production-copy"' "$runtime/supabase/config.toml" ||
   [ -e "$runtime/supabase/.temp/project-ref" ] ||
   [ ! -s "$runtime/checks.txt" ] ||
   [ -e "$runtime/rehearsal.started" ]; then
  echo "Expected restored local copy missing or rehearsal already started. Nothing changed."
  exit 1
fi
command -v docker >/dev/null || { echo "Docker Desktop is required."; exit 1; }
if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != true ]; then
  echo "The isolated local database is not running. Nothing changed."
  exit 1
fi
if [ "$(docker exec "$container" psql -X -A -t -v ON_ERROR_STOP=1 -U supabase_admin -d postgres \
  -c "select
    (select count(*) from auth.users)=6
    and (select count(*) from public.household_members where status='active')=6
    and (select count(*) from storage.objects where bucket_id='photos')=8
    and not exists (select 1 from public.household_members where status='active'
      group by user_id having count(*)>1)
    and to_regclass('public.household_invitations') is null
    and (select public from storage.buckets where id='photos') is true
    and (select count(*) from pg_policies where schemaname='storage' and tablename='objects')=0
    and (select count(*) from pg_policies where schemaname='public' and tablename='ai_plans'
      and policyname in ('allow authenticated read','allow authenticated insert'))=2
    and (select count(*) from pg_policies where schemaname='public' and tablename='ai_plans')=2
    and (select count(*) from pg_policies where schemaname='public' and tablename='activity_logs'
      and policyname in ('household members can read activity_logs',
        'household members can insert activity_logs','household members can delete activity_logs'))=3
    and (select count(*) from pg_policies where schemaname='public' and tablename='activity_logs')=3
    and (select count(*) from pg_policies where schemaname='public' and tablename='push_subscriptions'
      and policyname='users manage own subscriptions')=1
    and (select count(*) from pg_policies where schemaname='public' and tablename='push_subscriptions')=1" \
  2> "$runtime/rehearsal-preflight.log")" != t ]; then
  echo "Copied rows or policies differ from the reviewed baseline. Nothing changed; inspect rehearsal-preflight.log privately."
  exit 1
fi
: > "$runtime/rehearsal.started"

# The platform SQL dump omits user-defined managed-schema policies. Recreate
# exactly the three reviewed photo policy names, locally, to test migration 003.
if ! docker exec -i "$container" psql -X -q -v ON_ERROR_STOP=1 -U supabase_admin \
  -d postgres > "$runtime/rehearsal-photo-baseline.log" 2>&1 <<'SQL'
begin;
create policy "photos:select" on storage.objects for select to public
  using (bucket_id='photos');
create policy "photos:insert" on storage.objects for insert to authenticated
  with check (bucket_id='photos');
create policy "photos:delete" on storage.objects for delete to authenticated
  using (bucket_id='photos' and auth.uid()=owner);
commit;
SQL
then
  echo "Local photo policy fixture failed. Keep rehearsal-photo-baseline.log private."
  exit 1
fi

for migration in \
  202609180001_household_invitations \
  202609180002_ai_plan_isolation \
  202609180003_private_photos \
  202609190004_active_membership \
  202609230005_one_active_household \
  202609250001_household_join_codes \
  202609250002_ai_request_quota; do
  echo "Applying $migration only to the local copy."
  if ! docker exec -i "$container" psql -X -q -v ON_ERROR_STOP=1 -U postgres \
    -d postgres -f /dev/stdin < "supabase/migrations/$migration.sql" \
    > "$runtime/$migration.log" 2>&1; then
    echo "LOCAL MIGRATION FAILED: $migration. Keep its private log on your Mac."
    exit 1
  fi
done

if ! docker exec -i "$container" psql -X -A -t -v ON_ERROR_STOP=1 \
  -U supabase_admin -d postgres > "$runtime/rehearsal-checks.txt" \
  2> "$runtime/rehearsal-checks.log" <<'SQL'
do $$ begin
  if (select count(*) from auth.users) <> 6
    or (select count(*) from public.household_members where status='active') <> 6
    or (select count(*) from storage.objects where bucket_id='photos') <> 8
    or (select public from storage.buckets where id='photos') is distinct from false
    or to_regclass('public.household_invitations') is null
    or to_regclass('public.household_join_codes') is null
    or to_regclass('public.ai_request_quotas') is null
    or to_regclass('public.household_members_one_active_per_user') is null
    or (select count(*) from pg_policies where schemaname='storage' and tablename='objects'
      and policyname in ('photos:household_read','photos:household_upload','photos:household_delete')) <> 3
    or (select count(*) from pg_policies where schemaname='storage' and tablename='objects') <> 3
    or (select count(*) from pg_policies where schemaname='public' and tablename='ai_plans'
      and policyname in ('ai_plans:household_read','ai_plans:parent_insert')) <> 2
  then raise exception 'Local migration verification failed'; end if;
end $$;
select 'auth_users=' || count(*) from auth.users;
select 'active_memberships=' || count(*) from public.household_members where status='active';
select 'photos=' || count(*) from storage.objects where bucket_id='photos';
select 'private_photos_bucket=' || (not public) from storage.buckets where id='photos';
SQL
then
  echo "Local migration verification failed. Keep rehearsal-checks.log private."
  exit 1
fi
echo "LOCAL MIGRATION REHEARSAL PASSED"
cat "$runtime/rehearsal-checks.txt"
echo "Production was not changed. Managed-schema policy parity and existing photo bytes still require release review."
