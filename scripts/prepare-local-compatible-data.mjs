#!/usr/bin/env node
// Build a private local-only copy of data.sql, omitting only absent EMPTY
// Supabase-managed Auth tables. Every public table must be created by schema.sql.
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const backupArg = process.argv[2];
const runtime = process.argv[3];
const alignStorage = process.argv[4] === '--align-storage';
const refresh = process.argv[5] === '--refresh';
if ((process.argv.length !== 4 && process.argv.length !== 5 && process.argv.length !== 6) ||
    (process.argv.length >= 5 && !alignStorage) ||
    (process.argv.length === 6 && !refresh) || !backupArg || !runtime) {
  console.error('Usage: node scripts/prepare-local-compatible-data.mjs backup-dir private-runtime [--align-storage [--refresh]]');
  process.exit(1);
}
const expectedRuntime = realpathSync(join(import.meta.dirname, '..', 'tests',
  refresh ? 'production-staging-refresh' : 'production-staging'));
let container = 'supabase_db_ankur-production-copy';
try {
  if (realpathSync(runtime) !== join(expectedRuntime, 'runtime')) throw Error();
  if (refresh) {
    const config = readFileSync(join(runtime, 'supabase', 'config.toml'), 'utf8');
    if (!/^project_id = "ankur-production-refresh"$/m.test(config)) throw Error();
    container = 'supabase_db_ankur-production-refresh';
  }
} catch {
  console.error('Expected the dedicated isolated private runtime. Nothing was changed.');
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
  console.error('Expected the original private backup folder in Downloads.');
  process.exit(1);
}

let existing;
let managedColumns;
try {
  const output = execFileSync('docker', ['exec', container,
    'psql', '-X', '-A', '-t', '-U', 'supabase_admin', '-d', 'postgres', '-c',
    "select n.nspname || '.' || c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','p')"],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  existing = new Set(output.trim().split('\n'));
  if (alignStorage) {
    const catalog = execFileSync('docker', ['exec', container,
      'psql', '-X', '-A', '-t', '-U', 'supabase_admin', '-d', 'postgres', '-c',
      "select n.nspname || '.' || c.relname || '.' || a.attname from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','p') and a.attnum>0 and not a.attisdropped and n.nspname in ('auth','storage')"],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    managedColumns = new Set(catalog.trim().split('\n'));
  }
} catch {
  console.error('The isolated local table catalog could not be checked.');
  process.exit(1);
}
const schema = readFileSync(join(backup, 'schema.sql'), 'utf8');
const declarations = new Set();
const identifier = '(?:"[a-z_][a-z_0-9]*"|[a-z_][a-z_0-9]*)';
const create = new RegExp(`\\bCREATE\\s+(?:UNLOGGED\\s+)?TABLE\\s+` +
  `(?:IF\\s+NOT\\s+EXISTS\\s+)?(${identifier})\\.(${identifier})\\s*\\(`, 'gi');
for (const match of schema.matchAll(create)) {
  declarations.add(`${match[1].replaceAll('"', '')}.${match[2].replaceAll('"', '')}`);
}
const allowedEmpty = new Set([
  'auth.mfa_recovery_code_sets',
  'auth.mfa_recovery_codes',
  'auth.scim_tokens',
  'auth.scim_users',
]);
if (alignStorage) allowedEmpty.add('auth.one_time_tokens');
const source = readFileSync(join(backup, 'data.sql'), 'utf8').split('\n');
const output = [];
const skipped = new Set();
let current = null;
let block = [];
let targetCount = 0;
let storageBucketColumns = null;
let storageBucketRows = null;
for (const line of source) {
  if (current) {
    block.push(line);
    if (line !== '\\.') continue;
    const name = current;
    const rows = block.length - 2; // COPY header and \. terminator
    if (name === 'storage.buckets') storageBucketRows = rows;
    if (alignStorage && name === 'auth.one_time_tokens') {
      if (rows !== 0) {
        console.error('A local Auth table missing a column has records. Nothing was restored.');
        process.exit(1);
      }
      skipped.add(name);
    } else if (existing.has(name) || declarations.has(name)) {
      for (const item of block) output.push(item);
    } else if (allowedEmpty.has(name) && rows === 0) {
      skipped.add(name);
    } else {
      console.error('An undeclared table has data or is not in the explicit empty-table allowlist. Nothing was restored.');
      process.exit(1);
    }
    current = null;
    block = [];
  } else if (line.startsWith('COPY ')) {
    const match = line.match(/^COPY\s+((?:"[a-z_][a-z_0-9]*"|[a-z_][a-z_0-9]*))\.((?:"[a-z_][a-z_0-9]*"|[a-z_][a-z_0-9]*))\s*\(.+\)\s+FROM stdin;$/i);
    if (!match) {
      console.error('Unrecognized COPY header. Nothing was restored.');
      process.exit(1);
    }
    current = `${match[1].replaceAll('"', '')}.${match[2].replaceAll('"', '')}`;
    if (current === 'storage.buckets') {
      storageBucketColumns = line.match(/\((.+)\)\s+FROM stdin;$/)?.[1]
        .split(',').map((column) => column.trim().replaceAll('"', '')) ?? null;
    }
    if (alignStorage && /^(auth|storage)\./.test(current) && existing.has(current)) {
      const names = line.match(/\((.+)\)\s+FROM stdin;$/)?.[1]
        .split(',').map((column) => column.trim().replaceAll('"', '')) ?? [];
      for (const column of names) {
        if (managedColumns.has(`${current}.${column}`)) continue;
        if (current === 'auth.one_time_tokens' && column === 'expires_at') continue;
        if (current === 'storage.buckets' &&
            ['lifecycle_configuration', 'lifecycle_configuration_generation'].includes(column)) continue;
        console.error('Another managed-schema column is missing locally. Nothing was restored.');
        process.exit(1);
      }
    }
    targetCount++;
    block = [line];
  } else output.push(line);
}
if (current || skipped.size !== allowedEmpty.size ||
    [...allowedEmpty].some((name) => !skipped.has(name)) ||
    (alignStorage && (!storageBucketColumns?.includes('lifecycle_configuration') ||
      !storageBucketColumns.includes('lifecycle_configuration_generation') ||
      storageBucketRows !== 2)) ||
    !declarations.has('public.household_members') ||
    !declarations.has('public.children')) {
  console.error('Unexpected backup structure. Nothing was restored.');
  process.exit(1);
}
const destination = join(runtime, alignStorage ? 'aligned-data.sql' : 'compatible-data.sql');
try {
  writeFileSync(destination, output.join('\n'), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
} catch {
  console.error('Could not write the private local rehearsal data file. Nothing was restored.');
  process.exit(1);
}
console.log(`LOCAL_SQL_PREPARED copy_tables=${targetCount} empty_managed_skipped=${skipped.size}`);
