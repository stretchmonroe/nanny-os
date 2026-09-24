#!/usr/bin/env bash
# Summarize the restored public Auth trigger function without printing its body.
# Reads ONLY the isolated local database; no remote connection or credentials.
set -euo pipefail
umask 077
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
runtime="$repo_dir/tests/production-staging/runtime"
container='supabase_db_ankur-production-copy'
if [ ! -f "$runtime/supabase/config.toml" ] ||
   ! grep -qx 'project_id = "ankur-production-copy"' "$runtime/supabase/config.toml" ||
   [ -e "$runtime/supabase/.temp/project-ref" ] ||
   [ ! -s "$runtime/rehearsal-checks.txt" ]; then
  echo "Expected the completed isolated local rehearsal. No database was queried."
  exit 1
fi
command -v docker >/dev/null || { echo "Docker Desktop is required."; exit 1; }
if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != true ]; then
  echo "The isolated local database is not running. No database was queried."
  exit 1
fi

if ! docker exec -i "$container" psql -X -A -t -v ON_ERROR_STOP=1 \
  -U supabase_admin -d postgres > "$runtime/signup-hook-check.txt" \
  2> "$runtime/signup-hook-check.log" <<'SQL'
begin transaction read only;
with hook as (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='handle_new_user' and p.pronargs=0
)
select 'local_signup_function_present=' || exists (select 1 from hook);
with hook as (
  select lower(pg_get_functiondef(p.oid)) as definition, p.prosecdef,
    exists (select 1 from unnest(p.proconfig) option
      where option like 'search_path=%') as search_path_set
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='handle_new_user' and p.pronargs=0
)
select 'local_signup_security_definer=' || coalesce((select prosecdef from hook),false)
union all select 'local_signup_search_path_set=' || coalesce((select search_path_set from hook),false)
union all select 'local_signup_mentions_profiles=' ||
  coalesce((select position('profiles' in definition)>0 from hook),false)
union all select 'local_signup_mentions_household_members=' ||
  coalesce((select position('household_members' in definition)>0 from hook),false)
union all select 'local_signup_mentions_households=' ||
  coalesce((select position('households' in definition)>0 from hook),false)
union all select 'local_signup_mentions_storage=' ||
  coalesce((select position('storage.' in definition)>0 from hook),false);
commit;
SQL
then
  echo "Local signup hook inspection failed. Keep signup-hook-check.log private."
  exit 1
fi

safe_lines="$(awk '/^local_signup_[a-z_]+=(true|false|t|f)$/ { print; count++ }
  END { if (count != 7) exit 1 }' "$runtime/signup-hook-check.txt")" || {
  echo "Unexpected local hook output. Keep signup-hook-check.txt private."
  exit 1
}
echo "LOCAL SIGNUP HOOK CHECK READY"
printf '%s\n' "$safe_lines"
echo "Only the isolated local database was read. Function body and private records were not printed."
