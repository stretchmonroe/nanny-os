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
  ['ROLE_ALREADY_EXISTS', /role [^\r\n]* already exists/i],
  ['ROLE_MISSING', /role [^\r\n]* does not exist/i],
  ['EXTENSION_UNAVAILABLE', /extension [^\r\n]* (?:is not available|could not open)/i],
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
console.log('Share only the RESTORE_DIAGNOSIS line. Keep the log and SQL files private.');
