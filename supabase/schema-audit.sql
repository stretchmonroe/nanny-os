-- Read-only production schema inventory for the Ankur stabilization audit.
-- Run in the Supabase SQL Editor and download the single JSON result.
-- This query returns metadata only; it does not read application rows or secrets.

select jsonb_pretty(
  jsonb_build_object(
    'generated_at', now(),
    'tables', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.table_name), '[]'::jsonb)
      from (
        select
          c.table_name,
          c.table_type,
          coalesce(pc.relrowsecurity, false) as row_level_security_enabled
        from information_schema.tables c
        left join pg_catalog.pg_class pc on pc.relname = c.table_name
        left join pg_catalog.pg_namespace pn on pn.oid = pc.relnamespace
          and pn.nspname = c.table_schema
        where c.table_schema = 'public'
      ) t
    ),
    'columns', (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.table_name, c.ordinal_position), '[]'::jsonb)
      from (
        select
          table_name,
          ordinal_position,
          column_name,
          data_type,
          udt_name,
          is_nullable,
          column_default
        from information_schema.columns
        where table_schema = 'public'
      ) c
    ),
    'constraints', (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.table_name, c.constraint_name), '[]'::jsonb)
      from (
        select
          tc.table_name,
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name as foreign_table_name,
          ccu.column_name as foreign_column_name,
          cc.check_clause
        from information_schema.table_constraints tc
        left join information_schema.key_column_usage kcu
          on tc.constraint_catalog = kcu.constraint_catalog
          and tc.constraint_schema = kcu.constraint_schema
          and tc.constraint_name = kcu.constraint_name
        left join information_schema.constraint_column_usage ccu
          on tc.constraint_catalog = ccu.constraint_catalog
          and tc.constraint_schema = ccu.constraint_schema
          and tc.constraint_name = ccu.constraint_name
        left join information_schema.check_constraints cc
          on tc.constraint_catalog = cc.constraint_catalog
          and tc.constraint_schema = cc.constraint_schema
          and tc.constraint_name = cc.constraint_name
        where tc.table_schema = 'public'
      ) c
    ),
    'indexes', (
      select coalesce(jsonb_agg(to_jsonb(i) order by i.tablename, i.indexname), '[]'::jsonb)
      from (
        select tablename, indexname, indexdef
        from pg_catalog.pg_indexes
        where schemaname = 'public'
      ) i
    ),
    'policies', (
      select coalesce(jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname), '[]'::jsonb)
      from (
        select
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        from pg_catalog.pg_policies
        where schemaname in ('public', 'storage')
      ) p
    ),
    'storage_buckets', (
      select coalesce(jsonb_agg(to_jsonb(b) order by b.name), '[]'::jsonb)
      from (
        select id, name, public, file_size_limit, allowed_mime_types
        from storage.buckets
      ) b
    ),
    'enum_values', (
      select coalesce(jsonb_agg(to_jsonb(e) order by e.enum_name, e.sort_order), '[]'::jsonb)
      from (
        select
          t.typname as enum_name,
          e.enumsortorder as sort_order,
          e.enumlabel as enum_value
        from pg_catalog.pg_type t
        join pg_catalog.pg_enum e on t.oid = e.enumtypid
        join pg_catalog.pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'public'
      ) e
    )
  )
) as schema_audit;
