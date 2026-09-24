#!/usr/bin/env node
// Prints fixed error categories and redacted grammar, never identifiers or log text.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const attempt = process.argv[2] === '--retry' ? 'retry' : 'restore';
if (process.argv.length > 2 && process.argv[2] !== '--retry') {
  console.error('Usage: node scripts/diagnose-local-restore.mjs [--retry [backup-folder]]');
  process.exit(1);
}
const log = join(import.meta.dirname, '..', 'tests', 'production-staging', 'runtime', `${attempt}.log`);
let raw;
try {
  raw = readFileSync(log, 'utf8');
} catch {
  console.error('No local log found for that attempt. Run this in the checkout used for the restore.');
  process.exit(1);
}
const lineMatch = raw.match(/psql:.+?:([0-9]+):[ ]*(?:ERROR|FATAL):/i);
const line = lineMatch?.[1] ?? 'unavailable';
const start = lineMatch ? lineMatch.index : 0;
const errorLine = raw.slice(start).split(/\r?\n/)[0] ?? '';
const message = errorLine.split(/(?:ERROR|FATAL):/i).slice(1).join(':');
const classes = [
  ['RESERVED_ROLE', /is a reserved role, only superusers can modify it/i],
  ['ROLE_GRANT', /permission denied to grant role|must have admin option on role/i],
  ['ROLE_CONFLICT', /role [^\r\n]* cannot be dropped|cannot drop role/i],
  ['ROLE_ALREADY_EXISTS', /role [^\r\n]* already exists/i],
  ['ROLE_MISSING', /role [^\r\n]* does not exist/i],
  ['EXTENSION_UNAVAILABLE', /extension [^\r\n]* (?:is not available|could not open)/i],
  ['CONFIGURATION', /unrecognized configuration parameter|invalid value for parameter/i],
  ['SUPERUSER_REQUIRED', /must be superuser|superuser privileges are required/i],
  ['DUPLICATE_OBJECT', /(?:relation|schema|type|function|extension|policy) [^\r\n]* already exists/i],
  ['MISSING_DEPENDENCY', /(?:relation|schema|type|function|extension|table|column) [^\r\n]* does not exist/i],
  ['PERMISSION', /permission denied|must be owner|insufficient privilege/i],
  ['DUPLICATE_DATA', /duplicate key value|violates unique constraint/i],
  ['DATA_CONSTRAINT', /violates (?:foreign key|check|not-null) constraint|invalid input syntax/i],
  ['PSQL_FILE', /psql:.*(?:no such file or directory|could not open file)/i],
  ['CONNECTION', /could not connect|connection refused|FATAL:/i],
];
const category = classes.find(([, pattern]) => pattern.test(message))?.[0] ?? 'UNCLASSIFIED';
let phase = 'unknown';
const backup = process.argv[3];
if (backup && lineMatch) {
  try {
    const roles = readFileSync(join(backup, 'roles.sql'), 'utf8');
    const schema = readFileSync(join(backup, 'schema.sql'), 'utf8');
    const rolesLines = roles.split('\n').length - 1;
    const schemaLines = schema.split('\n').length - 1;
    const position = Number(line);
    phase = position <= rolesLines ? 'roles' : position <= rolesLines + schemaLines ? 'schema' : 'data';
  } catch { /* Keep the backup private; classification remains unknown. */ }
}
console.log(`RESTORE_DIAGNOSIS attempt=${attempt} category=${category} sql_line=${line} phase=${phase}`);
// Each output word belongs to this fixed grammar. All identifiers, values and
// unknown English words become [redacted]; no raw diagnostic text is printed.
const grammar = new Set(`a an the is are was were be been to for from by with in on of as at
  and or not no only can cannot could must may should do does did if it this that they
  role roles admin superuser superusers reserved member members membership privileges
  grant grants granted grantor owner owned ownership permission permissions denied
  create created creating drop dropped dropping alter altered modifying modify change changed
  set setting default public database schema table relation column index function trigger
  policy extension sequence publication constraint key data record records row rows
  exists exist already missing absent duplicate invalid unsupported available unavailable
  unexpected unrecognized unknown required requires require allowed disallowed prohibited
  value type parameter configuration operation command execute executed run running
  transaction block cannot aborted failed fail error syntax near because depends dependent
  objects object used use using has have had include includes contains copy insert update
  delete select truncate reference references version versioning newer older server
  authentication connect connection file open read write could not same current user
  name names identifier privileges only superusers modify it unique conflicting conflict
  without insufficient privileges violation violates search path temporary source target
  start end of input internal catalog must be initialized`.split(/\s+/));
const tokens = message.match(/"[^"]*"|'[^']*'|[A-Za-z][A-Za-z_0-9]*|[0-9]+/g) ?? [];
const safe = tokens.map((token) => grammar.has(token.toLowerCase()) ? token.toLowerCase() : '[redacted]');
const collapsed = safe.filter((token, i) => token !== '[redacted]' || safe[i - 1] !== token);
console.log(`RESTORE_ERROR_SHAPE ${collapsed.slice(0, 45).join(' ') || 'unavailable'}`);
console.log('Share only the RESTORE_DIAGNOSIS and RESTORE_ERROR_SHAPE lines. Keep logs and SQL files private.');
