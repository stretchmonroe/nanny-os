-- ================================================================
-- Migration: caregiver_invites
-- Paste into: Supabase Dashboard → SQL Editor → New query
--
-- Replaces the older household_invites table with a more complete
-- design that supports:
--   • Token-based invite links (no email guessing required)
--   • accepted_by / accepted_at audit trail
--   • cancelled status (in addition to pending / accepted / expired)
--   • profiles(id) FK references for invited_by / accepted_by
--   • updated_at with trigger
--
-- The existing household_invites table and its API routes are NOT
-- touched by this migration.
-- ================================================================


-- ================================================================
-- 1. Table
-- ================================================================

CREATE TABLE IF NOT EXISTS caregiver_invites (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID        NOT NULL REFERENCES households(id)  ON DELETE CASCADE,
  invited_by   UUID                 REFERENCES profiles(id)    ON DELETE SET NULL,
  email        TEXT        NOT NULL,
  role         TEXT        NOT NULL
                           CHECK (role IN ('caregiver', 'grandparent'))
                           DEFAULT 'caregiver',
  token        TEXT        NOT NULL UNIQUE
                           DEFAULT encode(gen_random_bytes(32), 'hex'),
  status       TEXT        NOT NULL
                           CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
                           DEFAULT 'pending',
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_by  UUID                 REFERENCES profiles(id)    ON DELETE SET NULL,
  accepted_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active invite per email per household at a time
  CONSTRAINT caregiver_invites_unique_pending
    EXCLUDE (household_id WITH =, email WITH =)
    WHERE (status = 'pending')
);

-- updated_at trigger — reuses the function from core_schema.sql
CREATE OR REPLACE TRIGGER trg_caregiver_invites_updated_at
  BEFORE UPDATE ON caregiver_invites
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- ================================================================
-- 2. Indexes
-- ================================================================

-- Token lookup (accept-invite link)
CREATE UNIQUE INDEX IF NOT EXISTS idx_caregiver_invites_token
  ON caregiver_invites (token);

-- Email lookup (check if a pending invite exists for an address)
CREATE INDEX IF NOT EXISTS idx_caregiver_invites_email
  ON caregiver_invites (email, status);

-- Household listing (show all invites sent by a family)
CREATE INDEX IF NOT EXISTS idx_caregiver_invites_household
  ON caregiver_invites (household_id, created_at DESC);

-- Status sweep (expire jobs, admin views)
CREATE INDEX IF NOT EXISTS idx_caregiver_invites_status
  ON caregiver_invites (status, expires_at);


-- ================================================================
-- 3. Enable RLS
-- ================================================================

ALTER TABLE caregiver_invites ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- 4. RLS policies
-- Drop-then-create so this is safe to re-run.
--
-- Token lookups (for the accept-invite flow) are performed via the
-- service-role API route (/api/invites/lookup) which bypasses RLS.
-- Client-side policies cover the authenticated household view only.
-- ================================================================

DROP POLICY IF EXISTS "caregiver_invites:select"  ON caregiver_invites;
DROP POLICY IF EXISTS "caregiver_invites:insert"  ON caregiver_invites;
DROP POLICY IF EXISTS "caregiver_invites:update"  ON caregiver_invites;
DROP POLICY IF EXISTS "caregiver_invites:delete"  ON caregiver_invites;

-- Active household members can read all invites for their household
CREATE POLICY "caregiver_invites:select" ON caregiver_invites FOR SELECT
  USING (in_my_household(household_id));

-- Only parents may send invites
CREATE POLICY "caregiver_invites:insert" ON caregiver_invites FOR INSERT
  WITH CHECK (
    in_my_household(household_id)
    AND my_role() = 'parent'
  );

-- Parents may cancel a pending invite (status → 'cancelled')
-- The service-role API route handles status → 'accepted' / 'expired'
CREATE POLICY "caregiver_invites:update" ON caregiver_invites FOR UPDATE
  USING (
    in_my_household(household_id)
    AND my_role() = 'parent'
  );

-- Parents may hard-delete an invite
CREATE POLICY "caregiver_invites:delete" ON caregiver_invites FOR DELETE
  USING (
    in_my_household(household_id)
    AND my_role() = 'parent'
  );


-- ================================================================
-- 5. Convenience function: expire stale pending invites
-- Call periodically from a cron job or on each invite creation.
-- ================================================================

CREATE OR REPLACE FUNCTION expire_caregiver_invites()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE caregiver_invites
  SET    status = 'expired'
  WHERE  status = 'pending'
    AND  expires_at < NOW();
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$;
