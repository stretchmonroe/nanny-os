-- ================================================================
-- Migration: add status to household_members
-- Run in Supabase Dashboard → SQL Editor
--
-- Safe to run on a live project — uses IF NOT EXISTS / backfill.
-- ================================================================

-- 1. Add the column (no-op if it already exists)
ALTER TABLE household_members
  ADD COLUMN IF NOT EXISTS status TEXT
    NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'removed'));

-- 2. Backfill all existing rows — every existing member is active
UPDATE household_members
  SET status = 'active'
  WHERE status IS NULL OR status NOT IN ('active', 'invited', 'removed');

-- 3. Index so auth queries are fast
CREATE INDEX IF NOT EXISTS idx_household_members_user_status
  ON household_members (user_id, status);
