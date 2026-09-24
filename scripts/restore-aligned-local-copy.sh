#!/usr/bin/env bash
# Align two Storage columns in an isolated local transaction and restore rows.
# No remote connection is used; the original SQL backup remains intact.
set -euo pipefail
umask 077
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
runtime="$repo_dir/tests/production-staging/runtime"
container='supabase_db_ankur-production-copy'
backup_dir="${1:-}"
if [ "$#" -ne 1 ] || [ ! -d "$backup_dir" ]; then
  echo "Usage: bash scripts/restore-aligned-local-copy.sh /path/to/ankur-staging.XXXXXX"
  exit 1
fi
if [ ! -f "$runtime/supabase/config.toml" ] ||
   ! grep -qx 'project_id = "ankur-production-copy"' "$runtime/supabase/config.toml" ||
   [ -e "$runtime/supabase/.temp/project-ref" ] ||
   [ ! -s "$runtime/restore.log" ] || [ ! -s "$runtime/retry.log" ] ||
   [ ! -s "$runtime/compatible.log" ] ||
   [ -e "$runtime/aligned.log" ] || [ -e "$runtime/checks.txt" ]; then
  echo "Expected isolated failed copy not found or aligned retry already ran. Nothing changed."
  exit 1
fi
command -v docker >/dev/null || { echo "Docker Desktop is required."; exit 1; }
if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != true ]; then
  echo "The isolated local database is not running. Nothing changed."
  exit 1
fi
if [ "$(docker exec "$container" psql -X -A -t -U supabase_admin -d postgres \
  -c "select to_regclass('public.household_members') is null and
    not exists (select 1 from pg_attribute where attrelid='storage.buckets'::regclass
      and attname in ('lifecycle_configuration','lifecycle_configuration_generation') and not attisdropped)
    and not exists (select 1 from pg_attribute where attrelid='auth.one_time_tokens'::regclass
      and attname='expires_at' and not attisdropped)" 2>/dev/null)" != t ]; then
  echo "Local schema differs from the audited state. Nothing changed."
  exit 1
fi
node scripts/prepare-local-compatible-data.mjs "$backup_dir" "$runtime" --align-storage
backup_dir="$(cd "$backup_dir" && pwd -P)"

echo "Restoring all app and bucket rows to the isolated local copy."
if ! {
  cat "$backup_dir/roles.sql" "$backup_dir/schema.sql"
  printf '\nALTER TABLE storage.buckets ADD COLUMN lifecycle_configuration jsonb, ADD COLUMN lifecycle_configuration_generation uuid;\n'
  printf 'SET session_replication_role = replica;\n'
  cat "$runtime/aligned-data.sql"
} | docker exec -i "$container" psql -X -q --single-transaction \
    --variable ON_ERROR_STOP=1 -U supabase_admin -d postgres -f /dev/stdin \
    > "$runtime/aligned.log" 2>&1; then
  echo "Aligned local restore failed and rolled back. Keep aligned.log private."
  exit 1
fi

if ! docker exec -i "$container" psql -X -A -t --variable ON_ERROR_STOP=1 \
    -U supabase_admin -d postgres > "$runtime/checks.txt" 2> "$runtime/checks.log" <<'SQL'
select 'auth_users=' || count(*) from auth.users;
select 'active_memberships=' || count(*) from public.household_members where status='active';
select 'users_with_multiple_active_households=' || count(*) from
  (select user_id from public.household_members where status='active'
   group by user_id having count(*)>1) d;
select 'photos=' || count(*) from storage.objects where bucket_id='photos';
select 'unmapped_photo_paths=' || count(*) from storage.objects o
 where o.bucket_id='photos' and (
   o.name !~* '^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|heic|heif)$'
   or split_part(o.name,'/',1) in ('shared','default')
   or not exists (select 1 from public.children c
     join public.household_members hm on hm.household_id=c.household_id
     where c.id::text=split_part(o.name,'/',1) and hm.user_id=o.owner));
select 'restored_storage_object_policies=' || count(*) from pg_policies
 where schemaname='storage' and tablename='objects';
SQL
then
  echo "Local restore finished but aggregate checks failed. Keep checks.log private."
  exit 1
fi
echo "LOCAL DATABASE COPY READY"
cat "$runtime/checks.txt"
echo "Production was not changed; Storage photo bytes and managed-schema policy customizations are not copied."
