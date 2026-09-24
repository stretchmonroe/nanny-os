#!/usr/bin/env node
// Read-only comparison of backup COPY headers with the isolated local catalog.
// Reads no row values except to count them; outputs only managed-schema names.
import { createReadStream, lstatSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { execFileSync } from 'node:child_process';

const backupArg = process.argv[2];
if (process.argv.length !== 3 || !backupArg) {
  console.error('Usage: node scripts/audit-managed-column-drift.mjs /path/to/ankur-staging.XXXXXX');
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
  console.error('Expected the original private SQL backup in Downloads.');
  process.exit(1);
}
const container = 'supabase_db_ankur-production-copy';
const tables = new Map();
let columns;
try {
  if (execFileSync('docker', ['inspect', '-f', '{{.State.Running}}', container],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() !== 'true') throw Error();
  const catalog = execFileSync('docker', ['exec', container, 'psql', '-X', '-A', '-t',
    '-U', 'supabase_admin', '-d', 'postgres', '-c',
    "select n.nspname || chr(9) || c.relname || chr(9) || a.attname from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where c.relkind in ('r','p') and a.attnum>0 and not a.attisdropped"],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  columns = new Map();
  for (const line of catalog.trim().split('\n')) {
    const [schema, table, column] = line.split('\t');
    const name = `${schema}.${table}`;
    if (!columns.has(name)) columns.set(name, new Set());
    columns.get(name).add(column);
  }
} catch {
  console.error('The isolated local database catalog could not be read.');
  process.exit(1);
}
const reader = createInterface({ input: createReadStream(join(backup, 'data.sql')),
  crlfDelay: Infinity });
let current = null;
let count = 0;
for await (const line of reader) {
  if (current) {
    if (line === '\\.') {
      tables.set(current.name, { names: current.names, rows: count });
      current = null;
      count = 0;
    } else count++;
  } else if (line.startsWith('COPY ')) {
    const match = line.match(/^COPY\s+((?:"[a-z_][a-z_0-9]*"|[a-z_][a-z_0-9]*))\.((?:"[a-z_][a-z_0-9]*"|[a-z_][a-z_0-9]*))\s*\((.+)\)\s+FROM stdin;$/i);
    if (!match) {
      console.error('Unrecognized COPY header; no records were printed.');
      process.exit(1);
    }
    const names = match[3].split(',').map((name) => name.trim().replaceAll('"', ''));
    if (names.some((name) => !/^[a-z_][a-z_0-9]{0,62}$/i.test(name))) {
      console.error('Unrecognized column name; no records were printed.');
      process.exit(1);
    }
    current = { name: `${match[1].replaceAll('"', '')}.${match[2].replaceAll('"', '')}`, names };
  }
}
if (current) {
  console.error('Backup COPY block incomplete.');
  process.exit(1);
}
const drift = [];
for (const [name, data] of tables) {
  if (!/^(auth|storage)\.[a-z_][a-z_0-9]{0,62}$/.test(name)) continue;
  const local = columns.get(name);
  if (!local) continue; // Table-level absence was audited separately.
  const missing = data.names.filter((column) => !local.has(column));
  if (missing.length) drift.push({ name, missing, rows: data.rows });
}
console.log(`MANAGED_COLUMN_DRIFT tables=${drift.length} nonempty_tables=${drift.filter((entry) => entry.rows > 0).length}`);
for (const entry of drift) {
  console.log(`MISSING_LOCAL_COLUMNS relation=${entry.name} columns=${entry.missing.join(',')} rows_in_backup=${entry.rows}`);
}
console.log('Share only MANAGED_COLUMN_DRIFT and MISSING_LOCAL_COLUMNS lines. No values were printed or changed.');
