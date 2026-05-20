-- ================================================================
-- Nanny OS — Core Beta Schema
-- Paste into: Supabase Dashboard → SQL Editor → New query
--
-- Defines four foundational tables:
--   profiles, households, household_members, children
--
-- Two ways to run this:
--
--   FRESH PROJECT (recommended)
--     Uncomment the RESET block at the top (Section 0).
--     Runs clean — no prior data assumed.
--     After this, re-run the rest of your schema for
--     memory_events, schedule_items, grocery_items, etc.
--
--   EXISTING PROJECT (additive)
--     Leave Section 0 commented out.
--     Sections 1–5 use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
--     where possible. See per-section notes for caveats.
--
-- Role vocabulary change:
--   'nanny' in existing code  →  'caregiver' going forward
--   Update any app code that checks my_role() = 'nanny' to
--   check my_role() = 'caregiver' or IN ('caregiver','parent').
--
-- children.id type change: TEXT → UUID
--   If you have existing rows in memory_events, schedule_items,
--   grocery_items, or suggestions that reference child_id TEXT,
--   those tables must be dropped and recreated. Do that after
--   running the RESET block.
-- ================================================================


-- ================================================================
-- SECTION 0 — DESTRUCTIVE RESET
-- Uncomment this entire block only on a fresh project.
-- ================================================================
/*
DROP TABLE IF EXISTS suggestion_replies         CASCADE;
DROP TABLE IF EXISTS suggestions                CASCADE;
DROP TABLE IF EXISTS sprout_notices             CASCADE;
DROP TABLE IF EXISTS daily_summaries            CASCADE;
DROP TABLE IF EXISTS activity_completions       CASCADE;
DROP TABLE IF EXISTS voice_notes                CASCADE;
DROP TABLE IF EXISTS approval_requests          CASCADE;
DROP TABLE IF EXISTS threaded_replies           CASCADE;
DROP TABLE IF EXISTS memory_reactions           CASCADE;
DROP TABLE IF EXISTS ai_insights                CASCADE;
DROP TABLE IF EXISTS journal_entries            CASCADE;
DROP TABLE IF EXISTS household_notes            CASCADE;
DROP TABLE IF EXISTS grocery_list_items         CASCADE;
DROP TABLE IF EXISTS grocery_lists              CASCADE;
DROP TABLE IF EXISTS grocery_items              CASCADE;
DROP TABLE IF EXISTS activity_recommendations   CASCADE;
DROP TABLE IF EXISTS schedule_blocks            CASCADE;
DROP TABLE IF EXISTS schedule_templates         CASCADE;
DROP TABLE IF EXISTS activity_library           CASCADE;
DROP TABLE IF EXISTS ai_summaries               CASCADE;
DROP TABLE IF EXISTS schedule_items             CASCADE;
DROP TABLE IF EXISTS memory_events              CASCADE;
DROP TABLE IF EXISTS nanny_child_relationships  CASCADE;
DROP TABLE IF EXISTS parent_child_relationships CASCADE;
DROP TABLE IF EXISTS child_feeding_preferences  CASCADE;
DROP TABLE IF EXISTS child_language_snapshots   CASCADE;
DROP TABLE IF EXISTS child_sensory_preferences  CASCADE;
DROP TABLE IF EXISTS child_activity_preferences CASCADE;
DROP TABLE IF EXISTS child_sleep_profiles       CASCADE;
DROP TABLE IF EXISTS child_developmental_snapshots CASCADE;
DROP TABLE IF EXISTS child_profiles             CASCADE;
DROP TABLE IF EXISTS children                   CASCADE;
DROP TABLE IF EXISTS household_members          CASCADE;
DROP TABLE IF EXISTS households                 CASCADE;
DROP TABLE IF EXISTS profiles                   CASCADE;

DROP FUNCTION IF EXISTS in_my_household(UUID) CASCADE;
DROP FUNCTION IF EXISTS in_my_household(TEXT) CASCADE;
DROP FUNCTION IF EXISTS my_role()             CASCADE;
DROP FUNCTION IF EXISTS my_household_id()     CASCADE;
DROP FUNCTION IF EXISTS handle_updated_at()   CASCADE;
DROP FUNCTION IF EXISTS handle_new_user()     CASCADE;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
*/


-- ================================================================
-- SECTION 1 — Shared trigger function for updated_at
-- Safe to run on any project.
-- ================================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ================================================================
-- SECTION 2 — households
-- Created before profiles so profiles can FK to it.
--
-- EXISTING PROJECT NOTE:
--   If the table already exists, the CREATE TABLE IF NOT EXISTS
--   is a no-op; ALTER TABLE lines add the missing columns.
-- ================================================================

CREATE TABLE IF NOT EXISTS households (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  created_by UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

-- Additive columns for existing projects
ALTER TABLE households
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE TRIGGER trg_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- ================================================================
-- SECTION 3 — profiles
-- One row per auth user. Auto-created on signup via trigger.
--
-- EXISTING PROJECT NOTE:
--   Table is new — no conflicts expected.
-- ================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT,
  avatar_url           TEXT,
  default_household_id UUID        REFERENCES households(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
-- Pulls full_name and avatar_url from provider metadata if present.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ================================================================
-- SECTION 4 — household_members
-- Structural change from the earlier version:
--   • Adds dedicated UUID primary key (was composite PK)
--   • role: 'parent' | 'caregiver' | 'grandparent'  (was 'parent'|'nanny')
--   • status: 'active' | 'invited' | 'removed'       (new)
--   • invited_email: supports pre-sign-up invites     (new)
--   • user_id is now nullable (NULL until invite accepted)
--   • updated_at                                      (new)
--
-- EXISTING PROJECT NOTE:
--   The old table has PRIMARY KEY (user_id, household_id).
--   Adding a new UUID 'id' PK requires DROP + CREATE.
--   Back up any existing rows before running this on a live project.
--   Uncomment the DROP line below if replacing the old table.
-- ================================================================

-- DROP TABLE IF EXISTS household_members CASCADE;  -- ← uncomment if replacing old table

CREATE TABLE IF NOT EXISTS household_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  UUID        NOT NULL REFERENCES households(id)    ON DELETE CASCADE,
  user_id       UUID                 REFERENCES auth.users(id)    ON DELETE SET NULL,
  invited_email TEXT,
  role          TEXT        NOT NULL
                            CHECK (role IN ('parent', 'caregiver', 'grandparent'))
                            DEFAULT 'caregiver',
  status        TEXT        NOT NULL
                            CHECK (status IN ('active', 'invited', 'removed'))
                            DEFAULT 'invited',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A user may hold only one active membership per household
  UNIQUE (household_id, user_id),
  -- Prevent duplicate pending invites to the same email
  UNIQUE (household_id, invited_email)
);

CREATE OR REPLACE TRIGGER trg_household_members_updated_at
  BEFORE UPDATE ON household_members
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- ================================================================
-- SECTION 5 — children
-- id is UUID (was TEXT in the legacy schema).
-- All tables that FK to children.id (memory_events, schedule_items,
-- grocery_items, suggestions, etc.) must be recreated after this
-- if running on a fresh project.
--
-- EXISTING PROJECT NOTE:
--   If children.id is TEXT and has live data, do NOT drop — instead,
--   add the missing columns with the ALTER TABLE block below.
--   Changing an id column type requires a full table rebuild.
-- ================================================================

-- DROP TABLE IF EXISTS children CASCADE;  -- ← uncomment if replacing old table

CREATE TABLE IF NOT EXISTS children (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  birthdate    DATE,
  avatar_url   TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Additive columns only — for existing projects keeping the TEXT id
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS birthdate  DATE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS notes      TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE OR REPLACE TRIGGER trg_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- ================================================================
-- SECTION 6 — Indexes
-- ================================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_household
  ON profiles (default_household_id);

-- households
CREATE INDEX IF NOT EXISTS idx_households_created_by
  ON households (created_by);

-- household_members
CREATE INDEX IF NOT EXISTS idx_members_household
  ON household_members (household_id);

CREATE INDEX IF NOT EXISTS idx_members_user
  ON household_members (user_id);

CREATE INDEX IF NOT EXISTS idx_members_household_status
  ON household_members (household_id, status);

-- children
CREATE INDEX IF NOT EXISTS idx_children_household
  ON children (household_id);


-- ================================================================
-- SECTION 7 — RLS helper functions
-- Replaces the earlier versions that used 'nanny' or TEXT child_id.
-- ================================================================

-- The active household for the calling user.
-- Returns NULL if the user has no active membership.
CREATE OR REPLACE FUNCTION my_household_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT household_id
  FROM   household_members
  WHERE  user_id = auth.uid()
    AND  status  = 'active'
  LIMIT  1
$$;

-- The calling user's role in their household.
-- Returns NULL if not a member.
CREATE OR REPLACE FUNCTION my_role()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role
  FROM   household_members
  WHERE  user_id = auth.uid()
    AND  status  = 'active'
  LIMIT  1
$$;

-- True when a given household_id belongs to the calling user.
-- Used in RLS policies on tables that carry their own household_id.
CREATE OR REPLACE FUNCTION in_my_household(p_household_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   household_members
    WHERE  user_id      = auth.uid()
      AND  household_id = p_household_id
      AND  status       = 'active'
  )
$$;

-- True when a given child_id (UUID) belongs to the calling user's household.
-- Used in RLS policies on child-scoped tables.
CREATE OR REPLACE FUNCTION child_in_my_household(p_child_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   children c
    JOIN   household_members m
           ON  m.household_id = c.household_id
           AND m.user_id      = auth.uid()
           AND m.status       = 'active'
    WHERE  c.id = p_child_id
  )
$$;


-- ================================================================
-- SECTION 8 — Enable RLS
-- ================================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE households        ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children          ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- SECTION 9 — RLS policies
-- Drop existing policies first so this is safe to re-run.
-- ================================================================

-- ── profiles ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles:select_own"       ON profiles;
DROP POLICY IF EXISTS "profiles:select_household"  ON profiles;
DROP POLICY IF EXISTS "profiles:insert_own"        ON profiles;
DROP POLICY IF EXISTS "profiles:update_own"        ON profiles;

-- Users always see their own profile
CREATE POLICY "profiles:select_own" ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users see profiles of people in the same household (for name/avatar display)
CREATE POLICY "profiles:select_household" ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   household_members me
      JOIN   household_members them ON them.household_id = me.household_id
      WHERE  me.user_id   = auth.uid()
        AND  me.status    = 'active'
        AND  them.user_id = profiles.id
        AND  them.status  = 'active'
    )
  );

-- Profile rows are created by the server-side trigger (SECURITY DEFINER).
-- Authenticated users may also upsert their own row (e.g. onboarding flow).
CREATE POLICY "profiles:insert_own" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users update only their own profile
CREATE POLICY "profiles:update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());


-- ── households ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "households:select" ON households;
DROP POLICY IF EXISTS "households:insert" ON households;
DROP POLICY IF EXISTS "households:update" ON households;
DROP POLICY IF EXISTS "households:delete" ON households;

-- Any active member can read the household
CREATE POLICY "households:select" ON households FOR SELECT
  USING (in_my_household(id));

-- Any authenticated user can create a household (they become the owner)
CREATE POLICY "households:insert" ON households FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Only the creator (or a parent member) can update household details
CREATE POLICY "households:update" ON households FOR UPDATE
  USING (
    in_my_household(id)
    AND (created_by = auth.uid() OR my_role() = 'parent')
  );

-- Only the creator can delete the household
CREATE POLICY "households:delete" ON households FOR DELETE
  USING (created_by = auth.uid());


-- ── household_members ────────────────────────────────────────────

DROP POLICY IF EXISTS "members:select"     ON household_members;
DROP POLICY IF EXISTS "members:insert"     ON household_members;
DROP POLICY IF EXISTS "members:update"     ON household_members;
DROP POLICY IF EXISTS "members:delete"     ON household_members;

-- Active members see all memberships in their household
CREATE POLICY "members:select" ON household_members FOR SELECT
  USING (household_id = my_household_id());

-- Parents can invite new members; members can also see their own row
-- (user_id IS NULL covers pending invites, inserted server-side)
CREATE POLICY "members:insert" ON household_members FOR INSERT
  WITH CHECK (
    household_id = my_household_id()
    AND my_role() = 'parent'
  );

-- Parents can update roles and status (accept, remove, promote)
-- Members can update their own row (e.g. accept an invite)
CREATE POLICY "members:update" ON household_members FOR UPDATE
  USING (
    household_id = my_household_id()
    AND (my_role() = 'parent' OR user_id = auth.uid())
  );

-- Only parents can remove members
CREATE POLICY "members:delete" ON household_members FOR DELETE
  USING (
    household_id = my_household_id()
    AND my_role() = 'parent'
  );


-- ── children ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "children:select" ON children;
DROP POLICY IF EXISTS "children:insert" ON children;
DROP POLICY IF EXISTS "children:update" ON children;
DROP POLICY IF EXISTS "children:delete" ON children;

-- All active household members can read children
CREATE POLICY "children:select" ON children FOR SELECT
  USING (in_my_household(household_id));

-- Only parents can create child records
CREATE POLICY "children:insert" ON children FOR INSERT
  WITH CHECK (in_my_household(household_id) AND my_role() = 'parent');

-- Only parents can update child records
CREATE POLICY "children:update" ON children FOR UPDATE
  USING (in_my_household(household_id) AND my_role() = 'parent');

-- Only parents can delete child records
CREATE POLICY "children:delete" ON children FOR DELETE
  USING (in_my_household(household_id) AND my_role() = 'parent');


-- ================================================================
-- DONE.
--
-- Next steps after running this on a fresh project:
--
-- 1. Re-run your app-level table definitions for:
--      memory_events, schedule_items, grocery_items,
--      suggestions, suggestion_replies, threaded_replies,
--      memory_reactions, daily_summaries, sprout_notices, etc.
--    Update any child_id TEXT columns → child_id UUID to match
--    the new children.id type.
--
-- 2. Update in_my_household() call sites in existing RLS policies
--    for those tables to use child_in_my_household(child_id::UUID)
--    instead of the old TEXT-based version.
--
-- 3. In app code, update any role checks:
--      my_role() = 'nanny'  →  my_role() = 'caregiver'
--    or use:
--      my_role() IN ('caregiver', 'grandparent')
--    for non-parent members.
--
-- 4. Enable auth email templates in Supabase Dashboard for invite flows.
-- ================================================================
