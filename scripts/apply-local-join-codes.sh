#!/usr/bin/env bash
# Apply only the additive join-code migration to the existing isolated local database.
set -euo pipefail
umask 077
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
runtime="$repo_dir/tests/local-supabase/runtime"
container='supabase_db_ankur-isolated-rehearsal'
if [ ! -f "$runtime/supabase/config.toml" ] ||
   ! grep -qx 'project_id = "ankur-isolated-rehearsal"' "$runtime/supabase/config.toml" ||
   [ -e "$runtime/supabase/.temp/project-ref" ]; then
  echo 'Expected an unlinked isolated local Supabase project. Nothing changed.'
  exit 1
fi
if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != true ]; then
  echo 'Isolated local database is not running. Nothing changed.'
  exit 1
fi
if [ "$(docker exec "$container" psql -X -A -t -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "select to_regclass('public.household_invitations') is not null and to_regclass('public.household_members_one_active_per_user') is not null")" != t ]; then
  echo 'Expected earlier local migrations are missing. Nothing changed.'
  exit 1
fi
if [ "$(docker exec "$container" psql -X -A -t -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "select to_regclass('public.household_join_codes') is not null")" = t ]; then
  echo 'LOCAL JOIN CODES READY (already applied)'
  exit 0
fi
if ! docker exec -i "$container" psql -X -q -v ON_ERROR_STOP=1 -U postgres \
  -d postgres -f /dev/stdin < supabase/migrations/202609250001_household_join_codes.sql \
  > "$runtime/join-code-migration.log" 2>&1; then
  echo 'Local migration failed and its transaction rolled back. Keep join-code-migration.log private.'
  exit 1
fi
echo 'LOCAL JOIN CODES READY. Existing local users and households were preserved.'
