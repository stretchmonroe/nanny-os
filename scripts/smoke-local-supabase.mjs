import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const runtime = fileURLToPath(new URL('../tests/local-supabase/runtime/', import.meta.url));
if (existsSync(`${runtime}/supabase/.temp/project-ref`)) {
  throw new Error('Refusing to test a work directory linked to a remote project');
}
let status;
try {
  status = execFileSync('npx', ['--yes', 'supabase@2.117.0', 'status',
    '--workdir', runtime, '--output', 'env'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
} catch {
  throw new Error('Local Supabase status failed; start the isolated stack first');
}
const values = Object.fromEntries(status.split('\n').flatMap(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  return match ? [[match[1], match[2].replace(/^"|"$/g, '')]] : [];
}));
const api = values.API_URL;
const anon = values.ANON_KEY;
const service = values.SERVICE_ROLE_KEY;
if (!api || !anon || !service || new URL(api).port !== '55321' ||
    !['localhost', '127.0.0.1'].includes(new URL(api).hostname)) {
  throw new Error('Expected local Supabase API on port 55321 with local keys');
}

async function request(method, path, key, body, contentType = 'application/json') {
  const response = await fetch(new URL(path, api), {
    method,
    headers: {
      apikey: key === service ? service : anon,
      authorization: `Bearer ${key}`,
      ...(body === undefined ? {} : { 'content-type': contentType }),
      ...(path.startsWith('/rest/') ? { prefer: 'return=representation' } : {}),
    },
    body: body === undefined ? undefined : contentType === 'application/json' ? JSON.stringify(body) : body,
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: response.ok, status: response.status, data };
}
function ok(response, label) {
  if (!response.ok) {
    const detail = typeof response.data === 'object' ? response.data?.message ?? response.data?.error : '';
    throw new Error(`${label}: HTTP ${response.status}${detail ? ` (${detail})` : ''}`);
  }
  return response.data;
}
function denied(response, label) {
  assert.equal(response.ok, false, `${label} unexpectedly succeeded`);
}
const json = (method, path, key, body) => request(method, path, key, body);
const storagePath = (child, filename) => `/storage/v1/object/photos/${child}/${filename}`;
const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/+1sAAAAASUVORK5CYII=', 'base64');

const stamp = randomUUID().slice(0, 12);
const password = `${randomUUID()}aA!`;
const people = {};
const homeA = randomUUID();
const homeB = randomUUID();
const childA = randomUUID();
const childB = randomUUID();
const file = `${randomUUID()}.png`;
const photo = storagePath(childA, file);
let uploaded = false;

async function createUser(label) {
  const email = `ankur-${stamp}-${label}@example.test`;
  const user = ok(await json('POST', '/auth/v1/admin/users', service,
    { email, password, email_confirm: true }), `create ${label}`);
  people[label] = { id: user.id, email };
  const session = ok(await json('POST', '/auth/v1/token?grant_type=password', anon,
    { email, password }), `sign in ${label}`);
  assert.ok(session.access_token, `missing ${label} access token`);
  people[label].token = session.access_token;
}

try {
  for (const label of ['parentA', 'parentB', 'caregiver', 'outsider']) await createUser(label);
  ok(await json('POST', '/rest/v1/households', service, [
    { id: homeA, name: `Smoke A ${stamp}` }, { id: homeB, name: `Smoke B ${stamp}` },
  ]), 'create households');
  ok(await json('POST', '/rest/v1/children', service, [
    { id: childA, household_id: homeA, name: 'Synthetic A' },
    { id: childB, household_id: homeB, name: 'Synthetic B' },
  ]), 'create children');
  ok(await json('POST', '/rest/v1/household_members', service, [
    { user_id: people.parentA.id, household_id: homeA, role: 'parent', status: 'active' },
    { user_id: people.parentB.id, household_id: homeB, role: 'parent', status: 'active' },
  ]), 'create memberships');

  const invite = ok(await json('POST', '/rest/v1/household_invitations', service, {
    household_id: homeA, invited_email: people.caregiver.email, created_by: people.parentA.id,
  }), 'create synthetic invitation');
  assert.equal(invite.length, 1);
  const code = homeA.split('-')[0].toUpperCase();
  denied(await json('POST', '/rest/v1/rpc/claim_household_invitation', service,
    { p_user_id: people.outsider.id, p_code: code }), 'wrong email invitation claim');
  assert.equal(ok(await json('POST', '/rest/v1/rpc/claim_household_invitation', service,
    { p_user_id: people.caregiver.id, p_code: code }), 'caregiver invitation claim'), homeA);
  denied(await json('POST', '/rest/v1/rpc/claim_household_invitation', service,
    { p_user_id: people.caregiver.id, p_code: code }), 'replayed invitation');
  console.log('PASS: verified invitation, wrong email and replay');

  const caregiver = people.caregiver.token;
  const parentA = people.parentA.token;
  const parentB = people.parentB.token;
  const plan = ok(await json('POST', '/rest/v1/ai_plans', parentA,
    { child_id: childA, status: 'active' }), 'parent plan insert');
  assert.equal(plan.length, 1);
  const plans = '/rest/v1/ai_plans?select=id';
  assert.equal(ok(await json('GET', plans, parentA), 'parent A plan read').length, 1);
  assert.equal(ok(await json('GET', plans, caregiver), 'caregiver plan read').length, 1);
  assert.equal(ok(await json('GET', plans, parentB), 'parent B plan read').length, 0);
  denied(await json('POST', '/rest/v1/ai_plans', caregiver,
    { child_id: childA }), 'caregiver plan insert');
  denied(await json('POST', '/rest/v1/ai_plans', parentB,
    { child_id: childA }), 'cross household plan insert');
  console.log('PASS: AI plan reads and parent-only writes stay within the household');

  ok(await request('POST', photo, caregiver, tinyPng, 'image/png'), 'caregiver upload');
  uploaded = true;
  ok(await request('GET', photo, parentA), 'household photo download');
  denied(await request('GET', photo, parentB), 'other household photo download');
  denied(await request('GET', `/storage/v1/object/public/photos/${childA}/${file}`, anon), 'anonymous public photo download');
  denied(await request('POST', `/storage/v1/object/sign/photos/${childA}/${file}`, parentB,
    { expiresIn: 300 }), 'other household signed URL');
  const signed = ok(await request('POST', `/storage/v1/object/sign/photos/${childA}/${file}`, parentA,
    { expiresIn: 300 }), 'household signed URL');
  assert.ok(signed.signedURL ?? signed.signedUrl, 'missing signed URL');
  denied(await request('POST', storagePath(childB, `${randomUUID()}.png`), caregiver,
    tinyPng, 'image/png'), 'cross household photo upload');
  console.log('PASS: private photos, household access, cross household denial');

  ok(await json('PATCH', `/rest/v1/household_members?user_id=eq.${people.caregiver.id}&household_id=eq.${homeA}`,
    service, { status: 'removed' }), 'remove caregiver');
  denied(await request('GET', photo, caregiver),
    'removed caregiver photo download');
  denied(await request('POST', `/storage/v1/object/sign/photos/${childA}/${file}`, caregiver,
    { expiresIn: 300 }), 'removed caregiver signed URL');
  console.log('PASS: removed caregiver loses new photo access');
  const removed = ok(await json('DELETE', '/storage/v1/object/photos', parentA,
    { prefixes: [`${childA}/${file}`] }), 'parent deletes caregiver photo');
  assert.equal(removed.length, 1, 'parent deletion did not remove the photo');
  uploaded = false;
  console.log('PASS: active parent can delete a caregiver photo');
  console.log('LOCAL AUTH/STORAGE SMOKE PASSED');
} finally {
  // All writes are in the isolated local stack. Cleanup is best effort so errors stay visible.
  const cleanup = [
    () => uploaded && json('DELETE', `/storage/v1/object/photos`, service, { prefixes: [`${childA}/${file}`] }),
    () => json('DELETE', `/rest/v1/ai_plans?child_id=eq.${childA}`, service),
    () => json('DELETE', `/rest/v1/household_invitations?household_id=eq.${homeA}`, service),
    () => json('DELETE', `/rest/v1/household_members?household_id=in.(${homeA},${homeB})`, service),
    () => json('DELETE', `/rest/v1/children?id=in.(${childA},${childB})`, service),
    () => json('DELETE', `/rest/v1/households?id=in.(${homeA},${homeB})`, service),
    ...Object.values(people).map(user => () => json('DELETE', `/auth/v1/admin/users/${user.id}`, service)),
  ];
  let failures = 0;
  for (const step of cleanup) {
    try { const result = await step(); if (result && !result.ok) failures++; } catch { failures++; }
  }
  if (failures) console.error(`Local cleanup had ${failures} unsuccessful steps; only synthetic rows were used.`);
}
