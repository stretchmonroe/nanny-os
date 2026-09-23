import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('metadata fixture accepts all four migrations in order', async () => {
  const db = new PGlite();
  try {
    // PGlite has no Supabase Auth/Storage services or uuid-ossp extension.
    await db.exec(`
      create schema auth; create schema storage; create schema extensions;
      create role anon; create role authenticated; create role service_role;
      create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
      create table storage.buckets(id text primary key, name text, public boolean,
        file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(id uuid, bucket_id text, name text, owner uuid);
      alter table storage.objects enable row level security;
      grant usage on schema auth, storage to anon, authenticated;
    `);
    const sql = (await readFile(new URL('./local-supabase/baseline.sql', import.meta.url), 'utf8'))
      .replace('create extension if not exists "uuid-ossp" with schema extensions;',
        () => 'create function extensions.uuid_generate_v4() returns uuid language sql as $$ select gen_random_uuid() $$;');
    await db.exec(sql);
    const migrations = (await readdir(new URL('../supabase/migrations/', import.meta.url)))
      .filter(name => name.endsWith('.sql')).sort();
    assert.equal(migrations.length, 4);
    for (const migration of migrations) {
      await db.exec(await readFile(new URL(`../supabase/migrations/${migration}`, import.meta.url), 'utf8'));
    }
    const { rows: [{ count }] } = await db.query("select count(*)::integer as count from pg_tables where schemaname='public'");
    assert.equal(count, 39); // 38 observed tables plus household_invitations.
    const { rows: [{ public: isPublic }] } = await db.query("select public from storage.buckets where id='photos'");
    assert.equal(isPublic, false);
  } finally {
    await db.close();
  }
});
