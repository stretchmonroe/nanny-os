-- Run in the Supabase SQL editor after schema.sql

CREATE TABLE IF NOT EXISTS suggestions (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  child_id         TEXT REFERENCES children(id),
  type             TEXT NOT NULL,
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  reason           TEXT,
  category         TEXT,
  status           TEXT NOT NULL CHECK (status IN ('pending','approved','dismissed')) DEFAULT 'pending',
  response_note    TEXT,
  created_by       TEXT NOT NULL CHECK (created_by IN ('nanny','parent')),
  research_backed  BOOLEAN DEFAULT FALSE,
  scheduled_day    TEXT,
  outcome_rating   TEXT CHECK (outcome_rating IN ('great','noted')),
  outcome_note     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suggestion_replies (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  suggestion_id  TEXT NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  author         TEXT NOT NULL CHECK (author IN ('nanny','parent')),
  content        TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
