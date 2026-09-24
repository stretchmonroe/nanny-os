#!/usr/bin/env bash
# Retry one known reserved-role error inside the existing isolated local DB.
set -euo pipefail
umask 077
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
backup_dir="${1:-}"
if [ "$#" -ne 1 ] || [ ! -d "$backup_dir" ]; then
  echo "Usage: bash scripts/retry-local-restore-as-admin.sh /path/to/ankur-staging.XXXXXX"
  exit 1
fi
backup_dir="$(cd "$backup_dir" && pwd -P)"
case "$backup_dir" in
  "$HOME"/Downloads/ankur-staging.*) ;;
  *) echo "Expected the original backup folder in Downloads. Nothing was restored."; exit 1 ;;
esac
for name in roles.sql schema.sql data.sql; do
  if [ -L "$backup_dir/$name" ] || [ ! -s "$backup_dir/$name" ]; then
    echo "Missing or invalid $name. Nothing was restored."
    exit 1
  fi
done

runtime="$repo_dir/tests/production-staging/runtime"
container='supabase_db_ankur-production-copy'
if [ ! -f "$runtime/supabase/config.toml" ] ||
   ! grep -qx 'project_id = "ankur-production-copy"' "$runtime/supabase/config.toml" ||
   [ -e "$runtime/supabase/.temp/project-ref" ] ||
   [ ! -s "$runtime/restore.log" ] ||
   [ -e "$runtime/retry.log" ] ||
   [ -e "$runtime/checks.txt" ]; then
  echo "The expected failed local copy was not found or a retry already ran. Nothing was restored."
  exit 1
fi
command -v docker >/dev/null || { echo "Docker Desktop is required."; exit 1; }
if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != true ]; then
  echo "The isolated local database container is not running. Nothing was restored."
  exit 1
fi

# The earlier psql -1 attempt stopped at a reserved-role error. No raw log text
# leaves the machine; other failure types require an individually reviewed fix.
if ! node - "$runtime/restore.log" <<'NODE'
const fs = require('node:fs');
const raw = fs.readFileSync(process.argv[2], 'utf8');
const first = raw.split(/\r?\n/).find((line) => /(?:ERROR|FATAL):/i.test(line)) ?? '';
if (!/is a reserved role, only superusers can modify it/i.test(first)) process.exit(1);
NODE
then
  echo "The original error is not the reserved-role case. No retry attempted; keep the log private."
  exit 1
fi

if [ "$(docker exec "$container" psql -X -A -t -U supabase_admin -d postgres \
  -c "select rolsuper from pg_roles where rolname=current_user" 2>/dev/null)" != t ]; then
  echo "The local admin role is unavailable or lacks privileges. No retry attempted."
  exit 1
fi
if [ "$(docker exec "$container" psql -X -A -t -U supabase_admin -d postgres \
  -c "select to_regclass('public.household_members') is null" 2>/dev/null)" != t ]; then
  echo "The local copy is not empty. No retry attempted."
  exit 1
fi

echo "Retrying the rolled-back export inside the same local database with its local admin role."
if ! {
  cat "$backup_dir/roles.sql" "$backup_dir/schema.sql"
  printf '\nSET session_replication_role = replica;\n'
  cat "$backup_dir/data.sql"
} | docker exec -i "$container" psql -X -q --single-transaction \
    --variable ON_ERROR_STOP=1 -U supabase_admin -d postgres -f /dev/stdin \
    > "$runtime/retry.log" 2>&1; then
  echo "Local admin retry failed and its transaction rolled back. Keep retry.log private."
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
  echo "Local restore succeeded but aggregate checks failed. Keep checks.log private."
  exit 1
fi
echo "LOCAL DATABASE COPY READY"
cat "$runtime/checks.txt"
echo "Production was not changed. Photo bytes and managed-schema customizations still need separate review."
