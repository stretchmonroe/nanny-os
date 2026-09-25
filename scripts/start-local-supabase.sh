#!/usr/bin/env bash
set -euo pipefail
repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_dir"
command -v node >/dev/null || { echo "Node.js is missing. Install Node.js 24 LTS, then retry."; exit 1; }
command -v npx >/dev/null || { echo "npm/npx is missing; install Node.js 24 LTS."; exit 1; }
node -e 'if(Number(process.versions.node.split(".")[0])<22){console.error("Use Node.js 24 LTS for this rehearsal.");process.exit(1)}'
docker info --format '{{.ServerVersion}}' >/dev/null
umask 077
test_dir="$repo_dir/tests/local-supabase/runtime"
mkdir -p "$test_dir/supabase/migrations"
if [ -f "$test_dir/supabase/.temp/project-ref" ]; then
  echo "Refusing to use a work directory linked to a remote project."
  exit 1
fi
cp tests/local-supabase/config.toml "$test_dir/supabase/config.toml"
cp tests/local-supabase/baseline.sql "$test_dir/supabase/migrations/202609170000_local_fixture.sql"
cp supabase/migrations/*.sql "$test_dir/supabase/migrations/"
echo "Starting isolated Supabase. First startup downloads Docker images and may take several minutes."
echo "Local service output is saved privately in tests/local-supabase/runtime/start.log."
if ! npx --yes supabase@2.117.0 start --workdir "$test_dir" > "$test_dir/start.log" 2>&1; then
  echo "Startup failed. Open tests/local-supabase/runtime/start.log and share only the error, not keys."
  exit 1
fi
echo "LOCAL SUPABASE READY"
echo "Studio: http://127.0.0.1:55323"
echo "No remote project was linked or changed. No production records were copied."
echo "This starts the migration rehearsal; full Auth/Storage/app smoke tests are still required."
