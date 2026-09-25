#!/usr/bin/env bash
set -euo pipefail
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
test_dir="$repo_dir/tests/local-supabase/runtime"
if [ ! -f "$test_dir/supabase/config.toml" ] ||
   ! grep -qx 'project_id = "ankur-isolated-rehearsal"' "$test_dir/supabase/config.toml"; then
  echo "Isolated local project missing. Run scripts/start-local-supabase.sh first."
  exit 1
fi
if [ -f "$test_dir/supabase/.temp/project-ref" ]; then
  echo "Refusing to reset a work directory linked to a remote project."
  exit 1
fi
docker info --format '{{.ServerVersion}}' >/dev/null
umask 077
if ! npx --yes supabase@2.117.0 status --workdir "$test_dir" --output env > /dev/null 2>&1; then
  echo "Start the isolated local Supabase stack first."
  exit 1
fi
cp tests/local-supabase/baseline.sql "$test_dir/supabase/migrations/202609170000_local_fixture.sql"
cp supabase/migrations/*.sql "$test_dir/supabase/migrations/"
echo "Resetting ONLY the isolated local database to apply the updated migrations."
echo "Local output is saved privately in tests/local-supabase/runtime/reset.log."
if ! npx --yes supabase@2.117.0 db reset --local --no-seed --workdir "$test_dir" > "$test_dir/reset.log" 2>&1; then
  echo "Local reset failed. Share only the error from reset.log, not keys or full logs."
  exit 1
fi
echo "LOCAL SCHEMA REHEARSAL READY"
node scripts/smoke-local-supabase.mjs
