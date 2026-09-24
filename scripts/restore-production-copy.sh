#!/usr/bin/env bash
# Restore the owner's private SQL backup to a NEW, database-only local container.
# Never accepts a remote connection string or uses a linked Supabase project.
set -euo pipefail
umask 077

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
backup_dir="${1:-}"
if [ "$#" -ne 1 ] || [ ! -d "$backup_dir" ]; then
  echo "Usage: bash scripts/restore-production-copy.sh /path/to/ankur-staging.XXXXXX"
  exit 1
fi
backup_dir="$(cd "$backup_dir" && pwd -P)"
case "$backup_dir" in
  "$HOME"/Downloads/ankur-staging.*) ;;
  *) echo "Expected the backup folder created under your Downloads by backup-live-for-staging.sh."; exit 1 ;;
esac
for name in roles.sql schema.sql data.sql; do
  if [ -L "$backup_dir/$name" ] || [ ! -s "$backup_dir/$name" ]; then
    echo "Missing or invalid $name; the backup was not restored."
    exit 1
  fi
done
command -v node >/dev/null || { echo "Node.js is required."; exit 1; }
command -v npx >/dev/null || { echo "npm/npx is required."; exit 1; }
command -v docker >/dev/null || { echo "Docker Desktop is required."; exit 1; }
node -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)' || { echo "Use Node.js 24 LTS."; exit 1; }
docker info --format '{{.ServerVersion}}' >/dev/null

project_id="ankur-production-copy"
container="supabase_db_$project_id"
runtime="$repo_dir/tests/production-staging/runtime"
if [ -e "$runtime" ] || docker container inspect "$container" >/dev/null 2>&1; then
  echo "Local production-copy work already exists. Stopped to avoid overwriting any database."
  exit 1
fi
mkdir -m 700 "$runtime"
mkdir -m 700 "$runtime/supabase"
cp tests/production-staging/config.toml "$runtime/supabase/config.toml"
if [ -e "$runtime/supabase/.temp/project-ref" ]; then
  echo "Refusing a linked work directory."
  exit 1
fi

echo "Starting a separate local PostgreSQL container; private logs stay on your Mac."
if ! npx --yes supabase@2.117.0 db start --workdir "$runtime" > "$runtime/start.log" 2>&1; then
  echo "Local database startup failed; inspect tests/production-staging/runtime/start.log privately."
  exit 1
fi
if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != true ]; then
  echo "The expected local database container is not running. Restore stopped."
  exit 1
fi

# Pass the three files through stdin to psql inside the exact local container.
# One transaction rolls back a partial restore, as in Supabase's restore guide.
echo "Restoring roles, schema and records into the separate local database."
if ! {
  cat "$backup_dir/roles.sql" "$backup_dir/schema.sql"
  printf '\nSET session_replication_role = replica;\n'
  cat "$backup_dir/data.sql"
} | docker exec -i "$container" psql -X -q --single-transaction \
    --variable ON_ERROR_STOP=1 -U postgres -d postgres -f /dev/stdin \
    > "$runtime/restore.log" 2>&1; then
  echo "Local SQL restore failed and its transaction rolled back. Inspect the private restore.log; do not paste records or full logs."
  exit 1
fi

# Only aggregate values leave the local database. Query errors stay private.
if ! docker exec -i "$container" psql -X -A -t --variable ON_ERROR_STOP=1 \
    -U postgres -d postgres > "$runtime/checks.txt" 2> "$runtime/checks.log" <<'SQL'
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
  echo "Restore finished; local aggregate checks failed. Inspect checks.log privately."
  exit 1
fi
echo "LOCAL DATABASE COPY READY"
cat "$runtime/checks.txt"
echo "The managed auth/storage policy customizations and Storage photo bytes are not part of this SQL export."
echo "Production was not changed. Do not share the SQL files, private logs or individual records."
