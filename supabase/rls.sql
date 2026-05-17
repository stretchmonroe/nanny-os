-- Nanny OS — Row Level Security
-- Run this once in the Supabase SQL editor after creating your project.
-- Requires: seed.sql has already been run (tables exist).

-- ── New tables ────────────────────────────────────────────────────────────────

-- One row per family
CREATE TABLE IF NOT EXISTS households (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maps auth users → household + role
CREATE TABLE IF NOT EXISTS household_members (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('parent', 'nanny')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, household_id)
);

-- Link children to households
ALTER TABLE children ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id);

-- ── Helper functions ──────────────────────────────────────────────────────────

-- The calling user's household
CREATE OR REPLACE FUNCTION my_household_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT household_id FROM household_members WHERE user_id = auth.uid() LIMIT 1
$$;

-- The calling user's role ('parent' | 'nanny')
CREATE OR REPLACE FUNCTION my_role()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role FROM household_members WHERE user_id = auth.uid() LIMIT 1
$$;

-- True if child_id belongs to the caller's household
CREATE OR REPLACE FUNCTION in_my_household(p_child_id TEXT)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM children
    WHERE id::TEXT = p_child_id AND household_id = my_household_id()
  )
$$;

-- ── Enable RLS ────────────────────────────────────────────────────────────────

ALTER TABLE households        ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children          ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries      ENABLE ROW LEVEL SECURITY;

-- ── households ────────────────────────────────────────────────────────────────

-- Members can see their own household
CREATE POLICY "households:select" ON households FOR SELECT
  USING (id = my_household_id());

-- ── household_members ─────────────────────────────────────────────────────────

-- Members can see who else is in their household
CREATE POLICY "members:select" ON household_members FOR SELECT
  USING (household_id = my_household_id());

-- Parents can add/remove members (inviting a nanny, etc.)
CREATE POLICY "members:insert" ON household_members FOR INSERT
  WITH CHECK (household_id = my_household_id() AND my_role() = 'parent');

CREATE POLICY "members:delete" ON household_members FOR DELETE
  USING (household_id = my_household_id() AND my_role() = 'parent');

-- ── children ─────────────────────────────────────────────────────────────────

CREATE POLICY "children:select" ON children FOR SELECT
  USING (household_id = my_household_id());

-- Only parents manage child profiles
CREATE POLICY "children:insert" ON children FOR INSERT
  WITH CHECK (household_id = my_household_id() AND my_role() = 'parent');

CREATE POLICY "children:update" ON children FOR UPDATE
  USING (household_id = my_household_id() AND my_role() = 'parent');

CREATE POLICY "children:delete" ON children FOR DELETE
  USING (household_id = my_household_id() AND my_role() = 'parent');

-- ── memory_events ─────────────────────────────────────────────────────────────

-- Both roles can read and create memories
CREATE POLICY "memory:select" ON memory_events FOR SELECT
  USING (in_my_household(child_id));

CREATE POLICY "memory:insert" ON memory_events FOR INSERT
  WITH CHECK (in_my_household(child_id));

-- Only parents can edit or delete memories
CREATE POLICY "memory:update" ON memory_events FOR UPDATE
  USING (in_my_household(child_id) AND my_role() = 'parent');

CREATE POLICY "memory:delete" ON memory_events FOR DELETE
  USING (in_my_household(child_id) AND my_role() = 'parent');

-- ── schedule_items ────────────────────────────────────────────────────────────

-- Both roles can read and update (nanny marks items done/active)
CREATE POLICY "schedule:select" ON schedule_items FOR SELECT
  USING (in_my_household(child_id));

CREATE POLICY "schedule:update" ON schedule_items FOR UPDATE
  USING (in_my_household(child_id));

-- Only parents create or delete schedule items
CREATE POLICY "schedule:insert" ON schedule_items FOR INSERT
  WITH CHECK (in_my_household(child_id) AND my_role() = 'parent');

CREATE POLICY "schedule:delete" ON schedule_items FOR DELETE
  USING (in_my_household(child_id) AND my_role() = 'parent');

-- ── grocery_items ─────────────────────────────────────────────────────────────

-- Both roles can read, add, and check off items
CREATE POLICY "grocery:select" ON grocery_items FOR SELECT
  USING (in_my_household(child_id));

CREATE POLICY "grocery:insert" ON grocery_items FOR INSERT
  WITH CHECK (in_my_household(child_id));

CREATE POLICY "grocery:update" ON grocery_items FOR UPDATE
  USING (in_my_household(child_id));

-- Only parents can delete grocery items
CREATE POLICY "grocery:delete" ON grocery_items FOR DELETE
  USING (in_my_household(child_id) AND my_role() = 'parent');

-- ── ai_summaries ──────────────────────────────────────────────────────────────

-- Both roles can read summaries
CREATE POLICY "ai:select" ON ai_summaries FOR SELECT
  USING (in_my_household(child_id));

-- Summaries are written server-side (service role), parents can delete
CREATE POLICY "ai:insert" ON ai_summaries FOR INSERT
  WITH CHECK (in_my_household(child_id) AND my_role() = 'parent');

CREATE POLICY "ai:delete" ON ai_summaries FOR DELETE
  USING (in_my_household(child_id) AND my_role() = 'parent');
