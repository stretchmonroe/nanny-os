-- Household invite system + helper RPCs
-- Run in Supabase SQL editor after rls.sql

-- ── Invite table ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS household_invites (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID    NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  household_name  TEXT    NOT NULL DEFAULT '',
  email           TEXT    NOT NULL,
  invited_by      UUID    REFERENCES auth.users(id),
  inviter_name    TEXT,
  child_name      TEXT,
  role            TEXT    NOT NULL DEFAULT 'nanny' CHECK (role IN ('parent', 'nanny')),
  note            TEXT,
  status          TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS household_invites_email_idx ON household_invites (email, status);

-- ── RPCs ──────────────────────────────────────────────────────────────────────

-- Creates a household + adds calling user as parent in one transaction.
-- Called by parent during onboarding (SECURITY DEFINER bypasses missing INSERT policy).
CREATE OR REPLACE FUNCTION create_household_for_user(p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO households (name) VALUES (p_name) RETURNING id INTO v_id;
  INSERT INTO household_members (user_id, household_id, role) VALUES (auth.uid(), v_id, 'parent');
  RETURN v_id;
END;
$$;

-- Creates a child inside a household (caller must be a member).
CREATE OR REPLACE FUNCTION create_child_for_household(
  p_name         TEXT,
  p_age          TEXT,
  p_household_id UUID
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM household_members
    WHERE user_id = auth.uid() AND household_id = p_household_id
  ) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  v_id := gen_random_uuid()::TEXT;
  INSERT INTO children (id, name, focus, household_id)
  VALUES (v_id, p_name, p_age, p_household_id);
  RETURN v_id;
END;
$$;

-- Creates an invite record (caller must be a parent in the household).
CREATE OR REPLACE FUNCTION create_household_invite(
  p_email        TEXT,
  p_household_id UUID,
  p_inviter_name TEXT DEFAULT NULL,
  p_child_name   TEXT DEFAULT NULL,
  p_note         TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id    UUID;
  v_hname TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM household_members
    WHERE user_id = auth.uid() AND household_id = p_household_id AND role = 'parent'
  ) THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT name INTO v_hname FROM households WHERE id = p_household_id;
  -- Expire previous pending invites for this email + household
  UPDATE household_invites
  SET status = 'expired'
  WHERE email = LOWER(TRIM(p_email)) AND household_id = p_household_id AND status = 'pending';
  INSERT INTO household_invites
    (household_id, household_name, email, invited_by, inviter_name, child_name, note)
  VALUES
    (p_household_id, v_hname, LOWER(TRIM(p_email)), auth.uid(), p_inviter_name, p_child_name, p_note)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
