import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const parent='10000000-0000-0000-0000-000000000001';
const nanny='10000000-0000-0000-0000-000000000002';
const stranger='10000000-0000-0000-0000-000000000003';
const home='20000000-0000-0000-0000-000000000001';
const migration=await readFile(new URL('../supabase/migrations/202609180003_private_photos.sql',import.meta.url),'utf8');
async function fixture() {
  const db=new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create function auth.uid() returns uuid language sql as
      'select current_setting(''request.jwt.claim.sub'',true)::uuid';
    grant usage on schema auth, storage to anon,authenticated;
    create table children(id text, household_id uuid);
    create table household_members(user_id uuid, household_id uuid, role text, status text);
    insert into children values ('child-1','${home}');
    insert into household_members values
      ('${parent}','${home}','parent','active'),('${nanny}','${home}','nanny','active');
    create table storage.buckets(id text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    insert into storage.buckets values ('photos',true,null,null);
    create table storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
    alter table storage.objects enable row level security;
    grant select,insert,delete on storage.objects to authenticated,anon;
    create policy "photos:select" on storage.objects for select using(bucket_id='photos');
    create policy "photos:insert" on storage.objects for insert to authenticated with check(bucket_id='photos');
    create policy "photos:delete" on storage.objects for delete to authenticated using(owner=auth.uid());
    insert into storage.objects(bucket_id,name,owner) values ('photos','child-1/existing.jpg','${parent}');
  `);
  return db;
}
async function asUser(db,id) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  await db.exec('set role authenticated');
}
test('private photo policies enforce active household read/upload/delete',async()=>{
  const db=await fixture();
  try {
    await db.exec(migration);
    assert.equal((await db.query('select public from storage.buckets')).rows[0].public,false);
    await asUser(db,nanny);
    assert.equal((await db.query('select * from storage.objects')).rows.length,1);
    await db.query("insert into storage.objects(bucket_id,name,owner) values('photos','child-1/new.png',$1)",[nanny]);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('photos','other-child/x.jpg')"));
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('photos','child-1/x.svg')"));
    assert.equal((await db.query("delete from storage.objects where name='child-1/existing.jpg' returning id")).rows.length,0);
    assert.equal((await db.query("delete from storage.objects where name='child-1/new.png' returning id")).rows.length,1);
    await asUser(db,stranger);
    assert.equal((await db.query('select * from storage.objects')).rows.length,0);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('photos','child-1/x.jpg')"));
    await db.exec('reset role');
    await db.query("update household_members set status='removed' where user_id=$1",[nanny]);
    await asUser(db,nanny);
    assert.equal((await db.query('select * from storage.objects')).rows.length,0);
    await asUser(db,parent);
    assert.equal((await db.query('delete from storage.objects returning id')).rows.length,1);
    await db.exec('reset role; set role anon');
    assert.equal((await db.query('select * from storage.objects')).rows.length,0);
  } finally { await db.close(); }
});
test('unknown legacy paths block cutover and preserve public setting on rollback',async()=>{
  const db=await fixture();
  try {
    await db.exec("insert into storage.objects(bucket_id,name) values('photos','shared/legacy.jpg')");
    await assert.rejects(db.exec(migration), /Unmapped photo paths/);
    await db.exec('rollback');
    assert.equal((await db.query('select public from storage.buckets')).rows[0].public,true);
  } finally { await db.close(); }
});
