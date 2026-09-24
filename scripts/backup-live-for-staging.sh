#!/usr/bin/env bash
# Read-only database export from a Supabase session-pooler connection.
# Keep the SQL files on the owner's Mac; they contain private household data.
set -euo pipefail
umask 077

command -v node >/dev/null || { echo "Node.js is required."; exit 1; }
command -v docker >/dev/null || { echo "Docker Desktop is required."; exit 1; }
docker info --format '{{.ServerVersion}}' >/dev/null

echo "In the Nanny App project, choose Connect > Session pooler (port 5432)."
echo "Copy its connection URI, replace the password placeholder locally, then paste below."
echo "The URI is hidden while you paste it and is never saved in this repository."
IFS= read -r -s -p "Session-pooler database URI: " db_url
echo

project_ref="$(printf '%s' "$db_url" | node -e '
  const fs = require("node:fs");
  try {
    const uri = new URL(fs.readFileSync(0, "utf8"));
    const ref = uri.username.slice("postgres.".length);
    const password = decodeURIComponent(uri.password);
    if (!/^postgres(ql)?:$/.test(uri.protocol) ||
        !uri.hostname.endsWith(".pooler.supabase.com") ||
        uri.port !== "5432" || uri.pathname !== "/postgres" ||
        !/^[a-z0-9]{8,32}$/.test(ref) || !password ||
        /[\[\]]/.test(password)) process.exit(1);
    process.stdout.write(ref);
  } catch { process.exit(1); }
')" || { unset db_url; echo "Expected a completed Supabase session-pooler URI. Nothing was exported."; exit 1; }

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
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
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
