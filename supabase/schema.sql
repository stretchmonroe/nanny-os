-- Nanny OS -- Schema
-- Run this once in the Supabase SQL editor before running seed.ts
-- Requires: rls.sql has already been run (households + household_members must exist)

-- Core tables
-- Drop children with CASCADE in case it was previously created with UUID id.
-- All dependent tables will be recreated below.
DROP TABLE IF EXISTS children CASCADE;

CREATE TABLE IF NOT EXISTS children (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  full_name    TEXT,
  birth_date   DATE,
  emoji        TEXT DEFAULT '🧒',
  focus        TEXT,
  mood         TEXT,
  mood_label   TEXT,
  household_id UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memory_events (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  child_id    TEXT REFERENCES children(id),
  type        TEXT CHECK (type IN ('photo', 'note', 'milestone')),
  content     TEXT NOT NULL,
  category    TEXT CHECK (category IN ('meal', 'outdoor', 'play', 'nap', 'learning')),
  image_url   TEXT,
  created_by  TEXT DEFAULT 'nanny',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule_items (
  id             TEXT PRIMARY KEY,
  child_id       TEXT REFERENCES children(id),
  time           TEXT NOT NULL,
  title          TEXT NOT NULL,
  type           TEXT CHECK (type IN ('meal', 'outdoor', 'play', 'nap', 'learning')),
  done           BOOLEAN DEFAULT FALSE,
  active         BOOLEAN DEFAULT FALSE,
  notes          TEXT,
  scheduled_date DATE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grocery_items (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  child_id    TEXT REFERENCES children(id),
  name        TEXT NOT NULL,
  completed   BOOLEAN DEFAULT FALSE,
  created_by  TEXT DEFAULT 'parent',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_summaries (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  child_id       TEXT REFERENCES children(id),
  summary_date   DATE NOT NULL,
  headline       TEXT NOT NULL,
  summary        TEXT NOT NULL,
  highlights     JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Layer 2: Child profile tables

CREATE TABLE IF NOT EXISTS child_profiles (
  child_id           TEXT PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  temperament        TEXT CHECK (temperament IN ('easy', 'slow-to-warm', 'spirited')),
  montessori_plane   TEXT DEFAULT 'first',
  primary_focus      TEXT,
  allergies          TEXT[]   DEFAULT '{}',
  medical_notes      TEXT,
  pediatrician_name  TEXT,
  last_checkup_date  DATE,
  next_checkup_date  DATE,
  weight_kg          NUMERIC(5,2),
  height_cm          NUMERIC(5,1),
  notes              TEXT,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS child_developmental_snapshots (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  child_id             TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assessed_at          DATE NOT NULL,
  gross_motor          TEXT CHECK (gross_motor          IN ('emerging', 'on-track', 'advanced')),
  fine_motor           TEXT CHECK (fine_motor           IN ('emerging', 'on-track', 'advanced')),
  language_receptive   TEXT CHECK (language_receptive   IN ('emerging', 'on-track', 'advanced')),
  language_expressive  TEXT CHECK (language_expressive  IN ('emerging', 'on-track', 'advanced')),
  social_emotional     TEXT CHECK (social_emotional     IN ('emerging', 'on-track', 'advanced')),
  cognitive            TEXT CHECK (cognitive            IN ('emerging', 'on-track', 'advanced')),
  sensitive_periods    TEXT[]   DEFAULT '{}',
  focus_areas          TEXT[]   DEFAULT '{}',
  assessor_notes       TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS child_sleep_profiles (
  child_id                  TEXT PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  typical_wake_time         TIME,
  nap_count_per_day         INTEGER DEFAULT 1,
  typical_nap_start         TIME,
  typical_nap_duration_min  INTEGER,
  typical_bedtime           TIME,
  white_noise               BOOLEAN DEFAULT FALSE,
  blackout_curtains         BOOLEAN DEFAULT FALSE,
  sleep_cues                TEXT[]   DEFAULT '{}',
  wind_down_routine         TEXT,
  avg_overnight_wake_count  INTEGER DEFAULT 0,
  notes                     TEXT,
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS child_activity_preferences (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  child_id         TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  category         TEXT NOT NULL,
  activity         TEXT NOT NULL,
  preference_level TEXT NOT NULL CHECK (preference_level IN ('loves', 'likes', 'neutral', 'dislikes')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (child_id, activity)
);

CREATE TABLE IF NOT EXISTS child_sensory_preferences (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  child_id          TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  domain            TEXT NOT NULL CHECK (domain IN ('tactile', 'auditory', 'visual', 'vestibular', 'proprioceptive', 'oral', 'olfactory')),
  sensitivity_level TEXT NOT NULL CHECK (sensitivity_level IN ('seeking', 'typical', 'sensitive', 'avoidant')),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (child_id, domain)
);

CREATE TABLE IF NOT EXISTS child_language_snapshots (
  id                     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  child_id               TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  assessed_at            DATE NOT NULL,
  receptive_vocab_count  INTEGER,
  expressive_vocab_count INTEGER,
  known_words            TEXT[]   DEFAULT '{}',
  uses_signs             BOOLEAN  DEFAULT FALSE,
  known_signs            TEXT[]   DEFAULT '{}',
  gesture_types          TEXT[]   DEFAULT '{}',
  babbling_complexity    TEXT CHECK (babbling_complexity IN ('single', 'varied', 'sentence-like')),
  communication_style    TEXT,
  notes                  TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS child_feeding_preferences (
  child_id              TEXT PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  feeding_method        TEXT DEFAULT 'self-feeding',
  cup_type              TEXT,
  accepted_textures     TEXT[]   DEFAULT '{}',
  rejected_textures     TEXT[]   DEFAULT '{}',
  favorite_foods        TEXT[]   DEFAULT '{}',
  foods_to_introduce    TEXT[]   DEFAULT '{}',
  allergy_watch         TEXT[]   DEFAULT '{}',
  meal_pace             TEXT CHECK (meal_pace IN ('slow', 'typical', 'fast')),
  self_feeds            BOOLEAN  DEFAULT TRUE,
  notes                 TEXT,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parent_child_relationships (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  parent_user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id             TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship_label   TEXT NOT NULL CHECK (relationship_label IN ('mother', 'father', 'guardian', 'grandparent', 'other')),
  is_primary_caregiver BOOLEAN  DEFAULT FALSE,
  caregiving_days      TEXT[]   DEFAULT '{}',
  bonding_activities   TEXT[]   DEFAULT '{}',
  parenting_notes      TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (parent_user_id, child_id)
);

CREATE TABLE IF NOT EXISTS nanny_child_relationships (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nanny_user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id              TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  start_date            DATE NOT NULL,
  schedule_days         TEXT[]   DEFAULT '{}',
  schedule_start_time   TIME,
  schedule_end_time     TIME,
  caregiving_philosophy TEXT,
  special_skills        TEXT,
  bond_description      TEXT,
  communication_style   TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (nanny_user_id, child_id)
);

-- Layer 3: Activity planning tables

CREATE TABLE IF NOT EXISTS activity_library (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  category            TEXT NOT NULL,
  montessori_area     TEXT,
  description         TEXT,
  developmental_focus TEXT[]  DEFAULT '{}',
  age_min_months      INTEGER,
  age_max_months      INTEGER,
  duration_min_min    INTEGER,
  duration_max_min    INTEGER,
  materials           TEXT[]  DEFAULT '{}',
  indoor_outdoor      TEXT    CHECK (indoor_outdoor IN ('indoor', 'outdoor', 'both')),
  energy_level        TEXT    CHECK (energy_level IN ('low', 'medium', 'high')),
  setup_effort        TEXT    CHECK (setup_effort IN ('none', 'low', 'medium', 'high')),
  sensory_systems     TEXT[]  DEFAULT '{}',
  tips                TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_templates (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  day_type     TEXT NOT NULL,
  description  TEXT,
  suitable_for TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_blocks (
  id                TEXT PRIMARY KEY,
  template_id       TEXT NOT NULL REFERENCES schedule_templates(id) ON DELETE CASCADE,
  sort_order        INTEGER NOT NULL,
  label             TEXT NOT NULL,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  block_type        TEXT NOT NULL CHECK (block_type IN ('fixed', 'flexible', 'nap_window', 'transition')),
  activity_category TEXT,
  notes             TEXT
);

CREATE TABLE IF NOT EXISTS activity_recommendations (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  child_id             TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  recommended_date     DATE NOT NULL,
  activity_library_id  TEXT REFERENCES activity_library(id),
  activity_name        TEXT,
  time_of_day          TEXT CHECK (time_of_day IN ('morning', 'mid-morning', 'post-nap', 'afternoon', 'any')),
  priority             TEXT CHECK (priority IN ('primary', 'secondary', 'optional')) DEFAULT 'secondary',
  developmental_reason TEXT,
  caregiver_notes      TEXT,
  generated_by         TEXT DEFAULT 'ai',
  was_completed        BOOLEAN,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Layer 5: Grocery and household operations tables

CREATE TABLE IF NOT EXISTS grocery_lists (
  id           TEXT PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  list_type    TEXT NOT NULL CHECK (list_type IN ('groceries', 'household', 'pharmacy', 'baby')),
  week_of      DATE,
  created_by   TEXT NOT NULL,
  is_archived  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS grocery_list_items (
  id           TEXT PRIMARY KEY,
  list_id      TEXT NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  child_id     TEXT REFERENCES children(id),
  name         TEXT NOT NULL,
  category     TEXT CHECK (category IN ('produce','dairy','protein','snacks','grains','baby','household','pharmacy','frozen','beverages')),
  quantity     TEXT,
  priority     TEXT NOT NULL CHECK (priority IN ('urgent','routine','whenever')) DEFAULT 'routine',
  is_recurring BOOLEAN DEFAULT FALSE,
  completed    BOOLEAN DEFAULT FALSE,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  added_by     TEXT NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS household_notes (
  id           TEXT PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  child_id     TEXT REFERENCES children(id),
  note_type    TEXT NOT NULL CHECK (note_type IN ('reminder','handoff','supply-low','routine-update','schedule-change')),
  body         TEXT NOT NULL,
  created_by   TEXT NOT NULL,
  is_resolved  BOOLEAN DEFAULT FALSE,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL
);

-- Layer 7: Realism and interaction tables

CREATE TABLE IF NOT EXISTS memory_reactions (
  id          TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('memory_event','journal_entry','ai_summary','household_note')),
  target_id   TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('parent','nanny')),
  author_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS threaded_replies (
  id          TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('memory_event','journal_entry','ai_summary','household_note','ai_insight')),
  target_id   TEXT NOT NULL,
  body        TEXT NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('parent','nanny')),
  author_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_completions (
  id                  TEXT PRIMARY KEY,
  schedule_item_id    TEXT NOT NULL REFERENCES schedule_items(id) ON DELETE CASCADE,
  child_id            TEXT NOT NULL REFERENCES children(id)       ON DELETE CASCADE,
  completion_date     DATE NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('completed','skipped','replaced')),
  replaced_with       TEXT,
  duration_actual_min INTEGER,
  energy_level_actual TEXT CHECK (energy_level_actual IN ('low','medium','high')),
  mood_before         TEXT,
  mood_after          TEXT,
  notes               TEXT,
  logged_by           TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS voice_notes (
  id           TEXT PRIMARY KEY,
  child_id     TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  target_type  TEXT CHECK (target_type IN ('journal_entry','memory_event','schedule_item','standalone')),
  target_id    TEXT,
  duration_sec INTEGER NOT NULL,
  storage_url  TEXT,
  transcript   TEXT,
  author_type  TEXT NOT NULL CHECK (author_type IN ('parent','nanny')),
  author_name  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id                TEXT PRIMARY KEY,
  child_id          TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  request_type      TEXT NOT NULL CHECK (request_type IN ('activity-change','food-introduction','schedule-shift','milestone-confirm')),
  body              TEXT NOT NULL,
  requested_by      TEXT NOT NULL,
  requested_by_type TEXT NOT NULL CHECK (requested_by_type IN ('nanny','parent')),
  status            TEXT NOT NULL CHECK (status IN ('pending','approved','dismissed')) DEFAULT 'pending',
  response_body     TEXT,
  responded_by      TEXT,
  created_at        TIMESTAMPTZ NOT NULL,
  responded_at      TIMESTAMPTZ
);

-- Layer 6: AI insight tables

CREATE TABLE IF NOT EXISTS ai_insights (
  id               TEXT PRIMARY KEY,
  child_id         TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  insight_date     DATE NOT NULL,
  insight_type     TEXT NOT NULL CHECK (insight_type IN (
                     'pattern', 'correlation', 'developmental-observation',
                     'language', 'sleep', 'mood', 'feeding', 'recommendation'
                   )),
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  confidence       TEXT CHECK (confidence IN ('emerging', 'consistent', 'well-established')),
  data_window_days INTEGER,
  tags             TEXT[]  DEFAULT '{}',
  source_types     TEXT[]  DEFAULT '{}',
  is_dismissed     BOOLEAN DEFAULT FALSE,
  is_saved         BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL
);

-- Layer 4: Journal entries table

CREATE TABLE IF NOT EXISTS journal_entries (
  id           TEXT PRIMARY KEY,
  child_id     TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  entry_date   DATE NOT NULL,
  author_type  TEXT NOT NULL CHECK (author_type IN ('parent', 'nanny')),
  author_name  TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  mood_emoji   TEXT,
  tags         TEXT[]  DEFAULT '{}',
  photos       JSONB   DEFAULT '[]',
  is_favorite  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL
);
