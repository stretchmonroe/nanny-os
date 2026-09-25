import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const parent = '10000000-0000-0000-0000-000000000001';
const nanny = '10000000-0000-0000-0000-000000000002';
const other = '10000000-0000-0000-0000-000000000003';
const home = 'abcdef12-0000-0000-0000-000000000001';
async function fixture() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create table public.households(id uuid primary key);
    create table public.household_members(
      user_id uuid references auth.users(id), household_id uuid references public.households(id),
      role text not null check(role in ('parent','nanny')),
      status text not null default 'active', primary key(user_id, household_id));
    insert into auth.users values
      ('${parent}', 'parent@example.test', now()),
      ('${nanny}', 'nanny@example.test', now()),
      ('${other}', 'other@example.test', now());
    insert into public.households values ('${home}');
    insert into public.household_members values ('${parent}','${home}','parent','active');
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/202609180001_household_invitations.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202609250001_household_join_codes.sql', import.meta.url), 'utf8'));
  await db.query('insert into public.household_invitations(household_id, invited_email, created_by) values ($1,$2,$3)', [home, 'nanny@example.test', parent]);
  return db;
}
const claim = (db, user = nanny, code = 'ABCDEF12') => db.query('select public.claim_household_invitation($1,$2) as household', [user, code]);
const shareCode = 'ABCDEFGHJKLM';
const join = (db, user = other, code = shareCode) => db.query('select public.claim_household_join_code($1,$2) as household', [user, code]);
const issue = (db) => db.query('insert into public.household_join_codes(household_id,code,created_by,expires_at) values ($1,$2,$3,now()+interval \'7 days\')', [home,shareCode,parent]);

test('shared code joins a verified caregiver without preregistering their email', async () => {
  const db = await fixture();
  try {
    await issue(db);
    assert.equal((await join(db)).rows[0].household, home);
    assert.equal((await db.query('select role from household_members where user_id=$1',[other])).rows[0].role,'nanny');
    await assert.rejects(join(db));
  } finally { await db.close(); }
});
test('shared codes reject invalid, expired, removed-parent and removed-member claims', async () => {
  const db = await fixture();
  try {
    await issue(db);
    await assert.rejects(join(db, other, 'AAAAAAAAAAAA'));
    await assert.rejects(join(db, other, 'ABCDEFGHJKLMXX'));
    await db.exec("update household_join_codes set expires_at=now()-interval '1 second'");
    await assert.rejects(join(db));
    await db.exec("update household_join_codes set expires_at=now()+interval '1 day'");
    await db.query('update household_members set status=$1 where user_id=$2',['removed',parent]);
    await assert.rejects(join(db));
    await db.query('update household_members set status=$1 where user_id=$2',['active',parent]);
    await db.query('insert into household_members values ($1,$2,$3,$4)',[other,home,'nanny','removed']);
    await assert.rejects(join(db));
    assert.equal((await db.query('select status from household_members where user_id=$1',[other])).rows[0].status,'removed');
  } finally { await db.close(); }
});
test('rotating a shared code invalidates the old code; unverified users cannot join', async () => {
  const db = await fixture();
  try {
    await issue(db);
    await db.query('update household_join_codes set code=$1',["MNPRSTUVWXYZ"]);
    await assert.rejects(join(db));
    await db.query('update auth.users set email_confirmed_at=null where id=$1',[other]);
    await assert.rejects(join(db, other, "MNPRSTUVWXYZ"));
    await db.query('update auth.users set email_confirmed_at=now() where id=$1',[other]);
    assert.equal((await join(db, other, "MNPRSTUVWXYZ")).rows[0].household,home);
  } finally { await db.close(); }
});
test('AI policies isolate households and restrict inserts to active parents', async () => {
  const db = await fixture();
  const child = '20000000-0000-0000-0000-000000000001';
  try {
    await db.exec(`
      create function auth.uid() returns uuid language sql as
        'select current_setting(''request.jwt.claim.sub'', true)::uuid';
      grant usage on schema auth to authenticated;
      create table children(id text primary key, household_id uuid);
      insert into children values ('${child}','${home}');
      create table ai_plans(id uuid default gen_random_uuid(), child_id uuid);
      alter table ai_plans enable row level security;
      create policy "allow authenticated read" on ai_plans for select to authenticated using(true);
      create policy "allow authenticated insert" on ai_plans for insert to authenticated with check(true);
      grant select on children, household_members to authenticated;
      grant select, insert on ai_plans to authenticated;
      insert into ai_plans(child_id) values ('${child}');
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/202609180002_ai_plan_isolation.sql', import.meta.url),'utf8'));
    await claim(db);
    for (const [user, visible, insertAllowed] of [[parent,1,true],[nanny,2,false],[other,0,false]]) {
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
      await db.exec('set role authenticated');
      assert.equal((await db.query('select * from ai_plans')).rows.length,visible);
      const insert = () => db.query('insert into ai_plans(child_id) values ($1)',[child]);
      if (insertAllowed) await insert(); else await assert.rejects(insert());
      await db.exec('reset role');
    }
    await db.query("update household_members set status='removed' where user_id=$1",[nanny]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[nanny]);
    await db.exec('set role authenticated');
    assert.equal((await db.query('select * from ai_plans')).rows.length,0);
  } finally { await db.close(); }
});
test('verified invite creates membership, consumes invite, and rejects replay', async () => {
  const db = await fixture();
  try {
    assert.equal((await claim(db)).rows[0].household, home);
    assert.equal((await db.query('select role from household_members where user_id=$1',[nanny])).rows[0].role,'nanny');
    assert.ok((await db.query('select claimed_at from household_invitations')).rows[0].claimed_at);
    await assert.rejects(claim(db));
    assert.equal((await db.query('select count(*)::int as n from household_members')).rows[0].n,2);
  } finally { await db.close(); }
});
for (const [name, sql, user, code] of [
  ['wrong email', '', other, 'ABCDEF12'],
  ['wrong code', '', nanny, '00000000'],
  ['suffix rejected', '', nanny, 'ABCDEF12EXTRA'],
  ['unverified email', `update auth.users set email_confirmed_at=null where id='${nanny}'`, nanny, 'ABCDEF12'],
  ['expired invite', "update household_invitations set expires_at=now()-interval '1 day'", nanny, 'ABCDEF12'],
  ['removed inviter', "update household_members set status='removed'", nanny, 'ABCDEF12'],
  ['removed member', `insert into household_members values ('${nanny}','${home}','nanny','removed')`, nanny, 'ABCDEF12'],
]) test(name + ' cannot claim', async () => {
  const db = await fixture();
  try {
    if (sql) await db.exec(sql);
    await assert.rejects(claim(db,user,code));
    assert.equal((await db.query('select claimed_at from household_invitations')).rows[0].claimed_at,null);
  } finally { await db.close(); }
});
test('client roles cannot invoke privileged claim or read invitations', async () => {
  const db = await fixture();
  try {
    for (const role of ['anon','authenticated']) {
      await db.exec('set role '+role);
      await assert.rejects(claim(db));
      await assert.rejects(join(db));
      await assert.rejects(db.query('select * from household_invitations'));
      await assert.rejects(db.query('select * from household_join_codes'));
      await db.exec('reset role');
    }
  } finally { await db.close(); }
});
