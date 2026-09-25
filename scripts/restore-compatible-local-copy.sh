#!/usr/bin/env bash
# Resume from two rolled-back attempts in the isolated, database-only container.
set -euo pipefail
umask 077
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
runtime="$repo_dir/tests/production-staging/runtime"
container='supabase_db_ankur-production-copy'
backup_dir="${1:-}"
if [ "$#" -ne 1 ] || [ ! -d "$backup_dir" ]; then
  echo "Usage: bash scripts/restore-compatible-local-copy.sh /path/to/ankur-staging.XXXXXX"
  exit 1
fi
if [ ! -f "$runtime/supabase/config.toml" ] ||
   ! grep -qx 'project_id = "ankur-production-copy"' "$runtime/supabase/config.toml" ||
   [ -e "$runtime/supabase/.temp/project-ref" ] ||
   [ ! -s "$runtime/restore.log" ] || [ ! -s "$runtime/retry.log" ] ||
   [ -e "$runtime/compatible.log" ] || [ -e "$runtime/checks.txt" ]; then
  echo "The expected failed local copy was not found or a compatible retry already ran. Nothing changed."
  exit 1
fi
command -v docker >/dev/null || { echo "Docker Desktop is required."; exit 1; }
if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != true ]; then
  echo "The isolated local database is not running. Nothing changed."
  exit 1
fi
if [ "$(docker exec "$container" psql -X -A -t -U supabase_admin -d postgres \
  -c "select to_regclass('public.household_members') is null" 2>/dev/null)" != t ]; then
  echo "The local app schema is not empty. Nothing changed."
  exit 1
fi
node scripts/prepare-local-compatible-data.mjs "$backup_dir" "$runtime"
backup_dir="$(cd "$backup_dir" && pwd -P)"

echo "Restoring all app records into the separate local copy; private logs remain on your Mac."
if ! {
  cat "$backup_dir/roles.sql" "$backup_dir/schema.sql"
  printf '\nSET session_replication_role = replica;\n'
  cat "$runtime/compatible-data.sql"
} | docker exec -i "$container" psql -X -q --single-transaction \
    --variable ON_ERROR_STOP=1 -U supabase_admin -d postgres -f /dev/stdin \
    > "$runtime/compatible.log" 2>&1; then
  echo "Compatible local restore failed and rolled back. Keep compatible.log private."
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
  echo "Local restore finished, but checks failed. Keep checks.log private."
  exit 1
fi
echo "LOCAL DATABASE COPY READY"
cat "$runtime/checks.txt"
echo "The original export is intact. Production was not changed. No photo bytes were copied."
