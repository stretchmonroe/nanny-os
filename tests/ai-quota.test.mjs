import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const first = '10000000-0000-0000-0000-000000000001';
const second = '10000000-0000-0000-0000-000000000002';

test('persistent AI allowance is per user, bounded, resettable and server-only', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create table auth.users(id uuid primary key);
      create table public.household_members(user_id uuid, status text);
      insert into auth.users values ('${first}'), ('${second}');
      insert into public.household_members values ('${first}', 'active'), ('${second}', 'active');
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/202609250002_ai_request_quota.sql', import.meta.url), 'utf8'));
    const consume = (user) => db.query('select public.consume_ai_request_quota($1)', [user]);
    for (let i = 0; i < 20; i++) await consume(first);
    await assert.rejects(consume(first));
    assert.equal((await db.query('select hour_count, day_count from ai_request_quotas where user_id=$1',[first])).rows[0].day_count,20);
    await consume(second);
    await db.query('update household_members set status=$1 where user_id=$2',['removed',second]);
    await assert.rejects(consume(second));
    await db.exec('set role authenticated');
    await assert.rejects(consume(first));
    await assert.rejects(db.query('select * from ai_request_quotas'));
    await db.exec('reset role');
    await db.query("update ai_request_quotas set hour_start=now()-interval '2 hours' where user_id=$1",[first]);
    await consume(first);
    assert.deepEqual((await db.query('select hour_count,day_count from ai_request_quotas where user_id=$1',[first])).rows[0],{hour_count:1,day_count:21});
    await db.query("update ai_request_quotas set hour_start=now()-interval '2 hours',day_start=now()-interval '2 days',day_count=100 where user_id=$1",[first]);
    await consume(first);
    assert.deepEqual((await db.query('select hour_count,day_count from ai_request_quotas where user_id=$1',[first])).rows[0],{hour_count:1,day_count:1});
  } finally { await db.close(); }
});
