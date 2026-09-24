#!/usr/bin/env bash
# Read-only aggregate checks against the confirmed Nanny App project.
# Never write connection details, policy definitions or family data to the repository.
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
  echo "The completed isolated rehearsal is required. Nothing connected to production."
  exit 1
fi
command -v docker >/dev/null || { echo "Docker Desktop is required."; exit 1; }
command -v node >/dev/null || { echo "Node.js is required."; exit 1; }
if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" != true ]; then
  echo "The isolated local database is not running. Nothing connected to production."
  exit 1
fi

echo "Use Nanny App > Connect > Session pooler (port 5432)."
echo "Paste its URI with [YOUR-PASSWORD] as displayed; enter the password separately."
IFS= read -r -s -p "Session-pooler database URI: " db_url_template
echo
IFS= read -r -s -p "Nanny App database password: " db_password
echo
parsed="$(printf '%s\0%s' "$db_url_template" "$db_password" | node -e '
  const fs = require("node:fs");
  try {
    const [template, password] = fs.readFileSync(0, "utf8").split("\0");
    const uri = new URL(template);
    if (!/^postgres(ql)?:$/.test(uri.protocol) ||
        !/^[a-z0-9.-]+\.pooler\.supabase\.com$/.test(uri.hostname) ||
        uri.port !== "5432" || uri.pathname !== "/postgres" ||
        uri.username !== "postgres.mgbzsikninkwmlqtastg" ||
        !password || /[\r\n]/.test(password)) process.exit(1);
    process.stdout.write(uri.hostname + "\n" + uri.username);
  } catch { process.exit(1); }
')" || { unset db_url_template db_password; echo "Expected the Nanny App session-pooler URI and password. No connection was made."; exit 1; }
unset db_url_template
host="${parsed%%$'\n'*}"
username="${parsed#*$'\n'}"
unset parsed

# The only network operation is a read-only transaction. Password and SQL enter
# the local Docker container over stdin; no password is passed as an argument.
if ! {
  printf '%s\n' "$db_password"
  cat <<'SQL'
begin transaction read only;
select 'live_photo_bucket_public=' || public from storage.buckets where id='photos';
select 'live_photo_metadata_rows=' || count(*) from storage.objects where bucket_id='photos';
select 'live_active_memberships=' || count(*) from public.household_members where status='active';
select 'live_users_with_multiple_active_households=' || count(*) from (
  select user_id from public.household_members where status='active'
  group by user_id having count(*)>1
) duplicates;
select 'live_photo_policy_count=' || count(*) from pg_policies
  where schemaname='storage' and tablename='objects';
select 'legacy_photo_policy_names_match=' ||
  (coalesce(array_agg(policyname order by policyname), array[]::name[])
    = array['photos:delete','photos:insert','photos:select']::name[])
  from pg_policies where schemaname='storage' and tablename='objects';
select 'legacy_photo_policy_roles_match=' ||
  (count(*) filter (where policyname='photos:select' and cmd='SELECT'
    and array_to_string(roles,',')='public')=1
   and count(*) filter (where policyname='photos:insert' and cmd='INSERT'
    and array_to_string(roles,',')='authenticated')=1
   and count(*) filter (where policyname='photos:delete' and cmd='DELETE'
    and array_to_string(roles,',')='authenticated')=1)
  from pg_policies where schemaname='storage' and tablename='objects';
select 'custom_managed_trigger_count=' || count(*) from pg_trigger t
  join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace
  join pg_proc p on p.oid=t.tgfoid
  join pg_namespace pn on pn.oid=p.pronamespace
  where n.nspname in ('auth','storage') and pn.nspname='public' and not t.tgisinternal;
commit;
SQL
} | docker exec -i "$container" sh -c '
  IFS= read -r PGPASSWORD
  export PGPASSWORD PGSSLMODE=require
  exec psql -X -A -t -v ON_ERROR_STOP=1 -h "$1" -p 5432 -U "$2" -d postgres -f /dev/stdin
' sh "$host" "$username" > "$runtime/live-cutover-preflight.txt" 2> "$runtime/live-cutover-preflight.log"; then
  unset db_password
  echo "Read-only preflight failed. Keep live-cutover-preflight.log private; do not paste it."
  exit 1
fi
unset db_password

safe_counts="$(awk '/^((live_|legacy_|custom_)[a-z_]+)=(true|false|t|f|[0-9]+)$/ { print; count++ }
  END { if (count != 8) exit 1 }' "$runtime/live-cutover-preflight.txt")" || {
  echo "Unexpected preflight output. Keep live-cutover-preflight.txt private."
  exit 1
}
echo "LIVE CUTOVER PREFLIGHT READY"
printf '%s\n' "$safe_counts"
echo "Production was read only. This checks policy names and roles, not their expressions or photo bytes."
