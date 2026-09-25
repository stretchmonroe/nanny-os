#!/usr/bin/env node
// Read the eight restored photo paths locally and fetch only a tiny byte range
// from their currently public Nanny App URLs. Never log paths or save bytes.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const runtime = join(root, 'tests', 'production-staging', 'runtime');
const container = 'supabase_db_ankur-production-copy';
const projectRef = 'mgbzsikninkwmlqtastg';
const safePath = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|heic|heif)$/i;

let paths;
try {
  const config = readFileSync(join(runtime, 'supabase', 'config.toml'), 'utf8');
  if (!/^project_id = "ankur-production-copy"$/m.test(config)) throw Error();
  try { readFileSync(join(runtime, 'supabase', '.temp', 'project-ref')); throw Error(); }
  catch (error) { if (error.code !== 'ENOENT') throw Error(); }
  if (!readFileSync(join(runtime, 'rehearsal-checks.txt'), 'utf8')
    .includes('private_photos_bucket=true')) throw Error();
  if (execFileSync('docker', ['inspect', '-f', '{{.State.Running}}', container],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() !== 'true') throw Error();
  const stdout = execFileSync('docker', ['exec', container, 'psql', '-X', '-A', '-t',
    '-v', 'ON_ERROR_STOP=1', '-U', 'supabase_admin', '-d', 'postgres', '-c',
    "select name from storage.objects where bucket_id='photos' order by name"],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  paths = stdout.trim().split('\n');
  if (paths.length !== 8 || new Set(paths).size !== 8 ||
      !paths.every((path) => safePath.test(path))) throw Error();
} catch {
  console.error('Expected the completed isolated eight-photo rehearsal on this Mac. No remote requests were made.');
  process.exit(1);
}

const outcomes = { readable: 0, missing: 0, denied: 0, other: 0 };
for (const path of paths) {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  const url = `https://${projectRef}.supabase.co/storage/v1/object/public/photos/${encoded}`;
  let outcome = 'other';
  let response;
  let reader;
  try {
    response = await fetch(url, {
      method: 'GET', redirect: 'manual', headers: { range: 'bytes=0-0' },
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 404) outcome = 'missing';
    else if (response.status === 401 || response.status === 403) outcome = 'denied';
    else if ((response.status === 200 || response.status === 206) &&
      response.headers.get('content-type')?.toLowerCase().startsWith('image/')) {
      reader = response.body?.getReader();
      const first = reader && await reader.read();
      if (first && !first.done && first.value.length > 0) outcome = 'readable';
    }
  } catch { /* A failed request is counted without printing its path or URL. */ }
  try {
    if (reader) await reader.cancel();
    else await response?.body?.cancel();
  } catch { /* Discarding a response never changes the fetch result. */ }
  outcomes[outcome]++;
}

console.log(`LIVE_PHOTO_BYTE_CHECK expected=8 readable=${outcomes.readable}` +
  ` missing=${outcomes.missing} denied=${outcomes.denied} other=${outcomes.other}`);
console.log('A byte range was requested; no photo data or paths were saved or printed. Production was read only.');
if (outcomes.readable !== 8) process.exitCode = 1;
