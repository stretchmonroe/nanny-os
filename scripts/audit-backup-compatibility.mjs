#!/usr/bin/env node
// Compare COPY headers against the isolated local catalog; never output rows.
import { createReadStream, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { execFileSync } from 'node:child_process';

const backupArg = process.argv[2];
if (process.argv.length !== 3 || !backupArg) {
  console.error('Usage: node scripts/audit-backup-compatibility.mjs /path/to/ankur-staging.XXXXXX');
  process.exit(1);
}
let backup;
try {
  backup = realpathSync(backupArg);
  if (!backup.startsWith(join(process.env.HOME, 'Downloads', 'ankur-staging.'))) throw Error();
  for (const name of ['roles.sql', 'schema.sql', 'data.sql']) {
    if (!lstatSync(join(backup, name)).isFile()) throw Error();
  }
} catch {
  console.error('Use the original private backup folder in Downloads.');
  process.exit(1);
}
const runtime = join(import.meta.dirname, '..', 'tests', 'production-staging', 'runtime');
try {
  if (!readFileSync(join(runtime, 'supabase', 'config.toml'), 'utf8')
    .includes('project_id = "ankur-production-copy"')) throw Error();
  const name = 'supabase_db_ankur-production-copy';
  if (execFileSync('docker', ['inspect', '-f', '{{.State.Running}}', name],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() !== 'true') throw Error();
} catch {
  console.error('The isolated local database is unavailable; nothing was queried.');
  process.exit(1);
}

const tables = new Map();
const source = createInterface({ input: createReadStream(join(backup, 'data.sql')),
  crlfDelay: Infinity });
let current = null;
let rows = 0;
for await (const line of source) {
  if (current) {
    if (line === '\\.') {
      tables.set(current, (tables.get(current) ?? 0) + rows);
      current = null;
      rows = 0;
    } else rows++;
  } else if (line.startsWith('COPY ')) {
    const match = line.match(/^COPY\s+((?:"[a-z_][a-z_0-9]*"|[a-z_][a-z_0-9]*))\.((?:"[a-z_][a-z_0-9]*"|[a-z_][a-z_0-9]*))\s*\(.+\)\s+FROM stdin;$/i);
    if (!match) {
      console.error('Unrecognized COPY header. Nothing was changed or disclosed.');
      process.exit(1);
    }
    current = `${match[1].replaceAll('"', '')}.${match[2].replaceAll('"', '')}`;
  }
}
if (current) {
  console.error('Incomplete COPY block. The original backup needs review.');
  process.exit(1);
}

let existing;
try {
  const output = execFileSync('docker', ['exec', 'supabase_db_ankur-production-copy',
    'psql', '-X', '-A', '-t', '-U', 'supabase_admin', '-d', 'postgres', '-c',
    "select n.nspname || '.' || c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','p')"],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  existing = new Set(output.trim().split('\n'));
} catch {
  console.error('Could not inspect the isolated local catalog. No backup content was printed.');
  process.exit(1);
}
const missing = [...tables].filter(([name]) => !existing.has(name));
const nonempty = missing.filter(([, count]) => count > 0);
console.log(`BACKUP_COMPATIBILITY copy_tables=${tables.size} missing_tables=${missing.length} nonempty_missing=${nonempty.length}`);
const known = new Set(['public', 'auth', 'storage', 'realtime', '_realtime',
  'vault', 'net', 'cron', 'supabase_migrations', 'graphql_public', 'extensions']);
for (const [name, count] of missing) {
  const [schema, table] = name.split('.');
  const safeName = known.has(schema) && /^[a-z_][a-z_0-9]{0,62}$/.test(table)
    ? name : '[redacted]';
  console.log(`MISSING_LOCAL_TABLE relation=${safeName} rows_in_backup=${count}`);
}
console.log('Share only BACKUP_COMPATIBILITY and MISSING_LOCAL_TABLE lines. No records were queried or changed.');
