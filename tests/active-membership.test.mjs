import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const user='10000000-0000-0000-0000-000000000001';
const home='20000000-0000-0000-0000-000000000001';
const other='20000000-0000-0000-0000-000000000002';
test('live helper replacement revokes removed access and prevents push household/role forgery',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql as
        'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
      grant usage on schema auth to anon, authenticated;
      create table household_members(user_id uuid, household_id uuid, role text, status text);
      create table children(id text, household_id uuid);
      create table activity_logs(id integer, child_id text);
      create table push_subscriptions(user_id uuid, household_id uuid, role text);
      insert into household_members values ('${user}','${home}','nanny','active');
      insert into children values ('child-1','${home}'),('child-2','${other}');
      insert into activity_logs values (1,'child-1'),(2,'child-2');
      create function my_household_id() returns uuid language sql stable security definer as
        'select household_id from household_members where user_id=auth.uid() limit 1';
      create function my_role() returns text language sql stable security definer as
        'select role from household_members where user_id=auth.uid() limit 1';
      create function in_my_household(p_child_id text) returns boolean language sql stable security definer as
        'select exists(select 1 from children where id=p_child_id and household_id=my_household_id())';
      alter table household_members enable row level security;
      create policy members on household_members for select using(household_id=my_household_id());
      alter table children enable row level security;
      create policy child_read on children for select using(household_id=my_household_id());
      alter table activity_logs enable row level security;
      create policy "household members can read activity_logs" on activity_logs for select using(true);
      create policy "household members can insert activity_logs" on activity_logs for insert with check(true);
      create policy "household members can delete activity_logs" on activity_logs for delete using(true);
      alter table push_subscriptions enable row level security;
      create policy "users manage own subscriptions" on push_subscriptions for all to authenticated using(user_id=auth.uid());
      grant all on all tables in schema public to anon,authenticated;
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/202609190004_active_membership.sql',import.meta.url),'utf8'));
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
    await db.exec('set role authenticated');
    assert.equal((await db.query('select my_household_id() h, my_role() r')).rows[0].h,home);
    assert.equal((await db.query('select * from activity_logs')).rows.length,1);
    assert.equal((await db.query('select * from children')).rows.length,1);
    await db.query('insert into push_subscriptions values($1,$2,$3)',[user,home,'nanny']);
    await assert.rejects(db.query('insert into push_subscriptions values($1,$2,$3)',[user,other,'nanny']));
    await assert.rejects(db.query("update push_subscriptions set role='parent'"));
    await assert.rejects(db.exec('truncate activity_logs'));
    await db.exec("reset role; update household_members set status='removed'; set role authenticated");
    assert.equal((await db.query('select my_household_id() h, my_role() r')).rows[0].h,null);
    assert.equal((await db.query('select my_role() r')).rows[0].r,null);
    assert.equal((await db.query('select * from children')).rows.length,0);
    assert.equal((await db.query('select * from activity_logs')).rows.length,0);
    await assert.rejects(db.exec("insert into activity_logs values(3,'child-1')"));
    assert.equal((await db.query('delete from push_subscriptions returning *')).rows.length,1);
    await db.exec(`reset role; update household_members set status='active';
      insert into household_members values ('${user}','${other}','parent','active');
      set role authenticated;`);
    assert.equal((await db.query('select my_household_id() h')).rows[0].h,null);
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub','',false)");
    await db.exec('set role anon');
    assert.equal((await db.query('select * from children')).rows.length,0);
    await assert.rejects(db.exec('truncate activity_logs'));
    await db.exec('reset role');
    await assert.rejects(
      db.exec(await readFile(new URL('../supabase/migrations/202609190004_active_membership.sql',import.meta.url),'utf8')),
      /Multiple active households require review/
    );
    await db.exec('rollback');
  } finally { await db.close(); }
});
