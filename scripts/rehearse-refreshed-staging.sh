#!/usr/bin/env bash
# Rehearse a NEW live SQL backup in a NEW isolated local database; preserve the older staging copy.
set -euo pipefail
umask 077
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
runtime="$repo_dir/tests/production-staging-refresh/runtime"
container='supabase_db_ankur-production-refresh'
backup_dir="${1:-}"
if [ "$#" -ne 1 ] || [ ! -d "$backup_dir" ]; then
  echo 'Usage: bash scripts/rehearse-refreshed-staging.sh /path/to/ankur-staging.XXXXXX'
  exit 1
fi
backup_dir="$(cd "$backup_dir" && pwd -P)"
case "$backup_dir" in
  "$HOME"/Downloads/ankur-staging.*) ;;
  *) echo 'Expected a private backup folder under Downloads. Nothing changed.'; exit 1 ;;
esac
for name in roles.sql schema.sql data.sql; do
  if [ -L "$backup_dir/$name" ] || [ ! -s "$backup_dir/$name" ]; then
    echo 'Backup is missing a required SQL file. Nothing changed.'
    exit 1
  fi
done
if [ -e "$runtime" ] || docker container inspect "$container" >/dev/null 2>&1; then
  echo 'Refreshed staging copy already exists. Nothing was overwritten.'
  exit 1
fi
command -v docker >/dev/null || { echo 'Docker Desktop is required.'; exit 1; }
command -v node >/dev/null || { echo 'Node.js is required.'; exit 1; }
command -v npx >/dev/null || { echo 'npm/npx is required.'; exit 1; }
docker info --format '{{.ServerVersion}}' >/dev/null
mkdir -m 700 -p "$runtime/supabase"
cp tests/production-staging-refresh/config.toml "$runtime/supabase/config.toml"
if [ -e "$runtime/supabase/.temp/project-ref" ] ||
   ! grep -qx 'project_id = "ankur-production-refresh"' "$runtime/supabase/config.toml"; then
  echo 'Refusing a linked or unexpected local database project.'
  exit 1
fi
echo 'Starting the separate refreshed local database. Private logs remain on your Mac.'
if ! npx --yes supabase@2.117.0 db start --workdir "$runtime" > "$runtime/start.log" 2>&1 ||
   [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != true ]; then
  echo 'Refreshed local database did not start. Keep start.log private.'
  exit 1
fi
# Stop if the local managed Auth/Storage schema no longer matches the alignment reviewed earlier.
if [ "$(docker exec "$container" psql -X -A -t -v ON_ERROR_STOP=1 -U supabase_admin -d postgres \
  -c "select to_regclass('public.household_members') is null and
    to_regclass('auth.one_time_tokens') is not null and
    not exists (select 1 from pg_attribute where attrelid='storage.buckets'::regclass
      and attname in ('lifecycle_configuration','lifecycle_configuration_generation') and not attisdropped) and
    not exists (select 1 from pg_attribute where attrelid='auth.one_time_tokens'::regclass
      and attname='expires_at' and not attisdropped)" 2> "$runtime/local-schema-check.log")" != t ]; then
  echo 'Local managed schema differs from the reviewed baseline. No SQL was restored.'
  exit 1
fi
node scripts/prepare-local-compatible-data.mjs "$backup_dir" "$runtime" --align-storage --refresh
echo 'Restoring the fresh backup transactionally into ONLY the new local database.'
if ! {
  cat "$backup_dir/roles.sql" "$backup_dir/schema.sql"
  printf '\nALTER TABLE storage.buckets ADD COLUMN lifecycle_configuration jsonb, ADD COLUMN lifecycle_configuration_generation uuid;\n'
  printf 'SET session_replication_role = replica;\n'
  cat "$runtime/aligned-data.sql"
} | docker exec -i "$container" psql -X -q --single-transaction -v ON_ERROR_STOP=1 \
    -U supabase_admin -d postgres -f /dev/stdin > "$runtime/restore.log" 2>&1; then
  echo 'Refreshed local restore failed and rolled back. Keep restore.log private.'
  exit 1
fi

# Compare pre- and post-migration row counts without printing any household records.
if ! docker exec -i "$container" psql -X -A -t -v ON_ERROR_STOP=1 -U supabase_admin \
  -d postgres > "$runtime/before.txt" 2> "$runtime/before.log" <<'SQL'
do $$ begin
  if to_regclass('public.household_members') is null
    or to_regclass('public.household_invitations') is not null
    or (select public from storage.buckets where id='photos') is distinct from true
    or (select count(*) from pg_policies where schemaname='storage' and tablename='objects') <> 0
    or (select count(*) from pg_policies where schemaname='public' and tablename='ai_plans'
      and policyname in ('allow authenticated read','allow authenticated insert')) <> 2
    or exists (select 1 from public.household_members where status='active'
      group by user_id having count(*) > 1)
    or exists (select 1 from storage.objects o where o.bucket_id='photos' and (
      o.name !~* '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|heic|heif)$'
      or split_part(o.name,'/',1) in ('shared','default')
      or not exists (select 1 from public.children c
        join public.household_members hm on hm.household_id=c.household_id
        where c.id::text=split_part(o.name,'/',1) and hm.user_id=o.owner)))
  then raise exception 'Unexpected restored baseline'; end if;
end $$;
select count(*) || ',' || (select count(*) from public.household_members where status='active') || ',' ||
  (select count(*) from storage.objects where bucket_id='photos') from auth.users;
SQL
then
  echo 'Restored baseline failed safety checks. No migration was applied. Keep before.log private.'
  exit 1
fi
before="$(tail -n 1 "$runtime/before.txt")"
if ! [[ "$before" =~ ^[0-9]+,[0-9]+,[0-9]+$ ]]; then
  echo 'Unexpected baseline-count format. No migration was applied.'
  exit 1
fi

# Recreate only the three live policy definitions already reviewed; the SQL export omits managed-schema policies.
if ! docker exec -i "$container" psql -X -q -v ON_ERROR_STOP=1 -U supabase_admin \
  -d postgres > "$runtime/photo-policy-baseline.log" 2>&1 <<'SQL'
begin;
create policy "photos:select" on storage.objects for select to public using (bucket_id='photos');
create policy "photos:insert" on storage.objects for insert to authenticated with check (bucket_id='photos');
create policy "photos:delete" on storage.objects for delete to authenticated
  using (bucket_id='photos' and auth.uid()=owner);
commit;
SQL
then
  echo 'Local photo-policy baseline failed. Keep photo-policy-baseline.log private.'
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
  echo "Applying $migration ONLY to the isolated local copy."
  if ! docker exec -i "$container" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d postgres \
    -f /dev/stdin < "supabase/migrations/$migration.sql" > "$runtime/$migration.log" 2>&1; then
    echo "LOCAL MIGRATION FAILED: $migration. Keep its private log on your Mac."
    exit 1
  fi
done

if ! docker exec -i "$container" psql -X -A -t -v ON_ERROR_STOP=1 -U supabase_admin \
  -d postgres > "$runtime/after.txt" 2> "$runtime/after.log" <<'SQL'
do $$ begin
  if (select public from storage.buckets where id='photos') is distinct from false
    or to_regclass('public.household_invitations') is null
    or to_regclass('public.household_join_codes') is null
    or to_regclass('public.ai_request_quotas') is null
    or to_regclass('public.household_members_one_active_per_user') is null
    or to_regprocedure('public.claim_household_join_code(uuid,text)') is null
    or to_regprocedure('public.consume_ai_request_quota(uuid)') is null
    or (select count(*) from pg_policies where schemaname='storage' and tablename='objects'
      and policyname in ('photos:household_read','photos:household_upload','photos:household_delete')) <> 3
    or (select count(*) from pg_policies where schemaname='storage' and tablename='objects') <> 3
    or (select count(*) from pg_policies where schemaname='public' and tablename='ai_plans'
      and policyname in ('ai_plans:household_read','ai_plans:parent_insert')) <> 2
  then raise exception 'Local migration verification failed'; end if;
end $$;
select count(*) || ',' || (select count(*) from public.household_members where status='active') || ',' ||
  (select count(*) from storage.objects where bucket_id='photos') from auth.users;
SQL
then
  echo 'Post-migration checks failed. Keep after.log private.'
  exit 1
fi
after="$(tail -n 1 "$runtime/after.txt")"
if [ "$after" != "$before" ]; then
  echo 'Row counts changed unexpectedly. Keep private count files on your Mac.'
  exit 1
fi
echo 'REFRESHED LOCAL MIGRATION REHEARSAL PASSED (001–007)'
echo "auth_users=${before%%,*}"
counts="${before#*,}"
echo "active_memberships=${counts%%,*}"
echo "photos=${counts#*,}"
echo 'private_photos_bucket=true'
echo 'join_code_and_ai_quota_functions=true'
echo 'Production was read only; existing local staging and app accounts were not changed.'
echo 'Managed photo-policy parity and the existing image bytes still need live release checks.'
