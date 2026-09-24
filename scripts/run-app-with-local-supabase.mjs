#!/usr/bin/env node
// Run the actual Next.js app against the guarded, isolated local Supabase stack.
// Credentials are read from local CLI status and are never printed or saved.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = join(root, 'tests', 'local-supabase', 'runtime');
const config = join(runtime, 'supabase', 'config.toml');
if (!existsSync(config) || !existsSync(join(root, 'node_modules', 'next', 'package.json')) ||
    existsSync(join(runtime, 'supabase', '.temp', 'project-ref'))) {
  console.error('Expected the isolated local Supabase checkout and installed app dependencies. Run npm ci if needed.');
  process.exit(1);
}
let status;
try {
  status = execFileSync('npx', ['--yes', 'supabase@2.117.0', 'status',
    '--workdir', runtime, '--output', 'env'],
  { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch {
  console.error('The isolated local Supabase stack is not running. Start it with bash scripts/start-local-supabase.sh.');
  process.exit(1);
}
const values = Object.fromEntries(status.split('\n').flatMap((line) => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  return match ? [[match[1], match[2].replace(/^"|"$/g, '')]] : [];
}));
const api = values.API_URL;
const anon = values.ANON_KEY;
const service = values.SERVICE_ROLE_KEY;
try {
  const url = new URL(api);
  if (url.protocol !== 'http:' || url.port !== '55321' || url.pathname !== '/' ||
      url.username || url.password || url.search || url.hash ||
      !['localhost', '127.0.0.1'].includes(url.hostname) ||
      !anon || !service || !/^project_id = "ankur-isolated-rehearsal"$/m.test(
        readFileSync(config, 'utf8'))) throw Error();
} catch {
  console.error('Local Supabase identity did not match the dedicated rehearsal project. The app was not started.');
  process.exit(1);
}

console.log('LOCAL APP STARTING at http://localhost:3000/onboarding');
console.log('Using only the isolated local Supabase project. Press Ctrl+C to stop the app.');
const child = spawn('npm', ['run', 'dev', '--', '--hostname', 'localhost', '--port', '3000'], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: api,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
    SUPABASE_SERVICE_ROLE_KEY: service,
    ANTHROPIC_API_KEY: '',
    LOCAL_AI_DISABLED: '1',
    NEXT_PUBLIC_LOCAL_AI_DISABLED: '1',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: '',
    VAPID_PRIVATE_KEY: '',
  },
});
child.on('error', () => { console.error('Could not start the local app.'); process.exitCode = 1; });
child.on('exit', (code, signal) => { if (code && signal !== 'SIGINT') process.exitCode = code; });
