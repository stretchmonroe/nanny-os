#!/usr/bin/env node
// Prints only a fixed error category and the SQL line number, never log contents.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const log = join(import.meta.dirname, '..', 'tests', 'production-staging', 'runtime', 'restore.log');
let raw;
try {
  raw = readFileSync(log, 'utf8');
} catch {
  console.error('No local restore log found. Run this in the checkout used for the restore.');
  process.exit(1);
}
const lineMatch = raw.match(/psql:.+?:([0-9]+):[ ]*(?:ERROR|FATAL):/i);
const line = lineMatch?.[1] ?? 'unavailable';
const start = lineMatch ? lineMatch.index : 0;
const detail = raw.slice(start, start + 1500);
const classes = [
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
const category = classes.find(([, pattern]) => pattern.test(detail))?.[0] ?? 'UNCLASSIFIED';
console.log(`RESTORE_DIAGNOSIS category=${category} sql_line=${line}`);
if (category === 'UNCLASSIFIED') {
  // Fixed English words only. Identifiers, values, paths and other log text never print.
  const allowed = new Set(`invalid unrecognized configuration parameter cannot role roles grant
    permission denied object objects owned superuser extension revoke duplicate key syntax
    error transaction abort not allowed supported available required must be created initialized
    database relation already exists does exist missing for with member in of by dependency
    sequence owner default privileges could open connection file unexpected version authentication
    set grantor admin option drop operation command execute may only current user`.split(/\s+/));
  const errorLine = raw.split(/\r?\n/).find((entry) => /(?:ERROR|FATAL):/i.test(entry)) ?? '';
  const message = errorLine.split(/(?:ERROR|FATAL):/i).slice(1).join(':');
  const words = [...new Set((message.match(/[a-z]+/gi) ?? []).map((word) => word.toLowerCase())
    .filter((word) => allowed.has(word)))].slice(0, 16);
  console.log(`RESTORE_ERROR_TERMS ${words.join(' ') || 'none'}`);
}
console.log('Share only the RESTORE_DIAGNOSIS and RESTORE_ERROR_TERMS lines. Keep the log and SQL files private.');
