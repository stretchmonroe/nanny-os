#!/usr/bin/env bash
# Read-only database export from a Supabase session-pooler connection.
# Keep the SQL files on the owner's Mac; they contain private household data.
set -euo pipefail
umask 077
if [ "$#" -gt 1 ] || { [ "$#" -eq 1 ] && [ "$1" != '--rehearse' ]; }; then
  echo 'Usage: bash scripts/backup-live-for-staging.sh [--rehearse]'
  exit 1
fi
rehearse_after_backup=false
if [ "${1:-}" = '--rehearse' ]; then rehearse_after_backup=true; fi
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
if [ "$rehearse_after_backup" = true ] &&
   { [ -e "$repo_dir/tests/production-staging-refresh/runtime" ] ||
     docker container inspect supabase_db_ankur-production-refresh >/dev/null 2>&1; }; then
  echo 'Refreshed local copy already exists. No backup or production query was started.'
  exit 1
fi

command -v node >/dev/null || { echo "Node.js is required."; exit 1; }
command -v docker >/dev/null || { echo "Docker Desktop is required."; exit 1; }
docker info --format '{{.ServerVersion}}' >/dev/null

echo "In the Nanny App project, choose Connect > Session pooler (port 5432)."
echo "Copy the connection URI as shown, including [YOUR-PASSWORD]."
echo "Paste it below, then enter the database password separately. Both prompts are hidden."
IFS= read -r -s -p "Session-pooler database URI: " db_url_template
echo
IFS= read -r -s -p "Nanny App database password: " db_password
echo

parsed="$(printf '%s\0%s' "$db_url_template" "$db_password" | node -e '
  const fs = require("node:fs");
  try {
    const [template, password] = fs.readFileSync(0, "utf8").split("\0");
    const uri = new URL(template);
    const ref = uri.username.slice("postgres.".length);
    if (!/^postgres(ql)?:$/.test(uri.protocol) ||
        !uri.hostname.endsWith(".pooler.supabase.com") ||
        uri.port !== "5432" || uri.pathname !== "/postgres" ||
        !/^[a-z0-9]{8,32}$/.test(ref) || !password ||
        /[\r\n]/.test(password)) process.exit(1);
    uri.password = password;
    process.stdout.write(ref + "\n" + uri.toString());
  } catch { process.exit(1); }
')" || { unset db_url_template db_password; echo "Expected a Supabase session-pooler URI and password. Nothing was exported."; exit 1; }
unset db_url_template db_password
project_ref="${parsed%%$'\n'*}"
db_url="${parsed#*$'\n'}"
unset parsed
if [ "$rehearse_after_backup" = true ] && [ "$project_ref" != 'mgbzsikninkwmlqtastg' ]; then
  unset db_url
  echo 'This is not the reviewed Nanny App project reference. Nothing was exported.'
  exit 1
fi

echo "Connection refers to project $project_ref. Compare this with Nanny App's dashboard URL."
IFS= read -r -p "Type its project reference to confirm: " confirmation
if [ "$confirmation" != "$project_ref" ]; then
  unset db_url
  echo "Reference did not match. Nothing was exported."
  exit 1
fi

backup_dir="$(mktemp -d "$HOME/Downloads/ankur-staging.XXXXXX")"
chmod 700 "$backup_dir"
log="$backup_dir/dump.log"
cd "$repo_dir"

echo "Exporting roles, schema and data read-only to a private Downloads folder."
if ! npx --yes supabase@2.117.0 db dump --db-url "$db_url" --role-only -f "$backup_dir/roles.sql" > "$log" 2>&1 ||
   ! npx --yes supabase@2.117.0 db dump --db-url "$db_url" -f "$backup_dir/schema.sql" >> "$log" 2>&1 ||
   ! npx --yes supabase@2.117.0 db dump --db-url "$db_url" --data-only --use-copy \
     -x storage.buckets_vectors -x storage.vector_indexes \
     -f "$backup_dir/data.sql" >> "$log" 2>&1; then
  unset db_url
  echo "Export failed. See the private log in $backup_dir. Do not post SQL, URI or full logs."
  exit 1
fi
unset db_url

for file in schema.sql data.sql; do
  if [ ! -s "$backup_dir/$file" ]; then
    echo "Export incomplete ($file is empty). Keep the private folder for diagnosis."
    exit 1
  fi
done

echo "DATABASE BACKUP READY: $backup_dir"
echo "Production was read only. Storage photo bytes are separate and not backed up by this script."
echo "Keep the SQL files private; share only the DATABASE BACKUP READY line."
if [ "$rehearse_after_backup" = true ]; then
  bash scripts/rehearse-refreshed-staging.sh "$backup_dir"
fi
