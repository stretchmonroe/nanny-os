-- Nanny OS — Supabase Seed
-- Family: Mateo Rivera (18mo), Nanny: Elena Chen, Parents: Sofia & Marco Rivera
-- Covers May 1–14, 2026

-- ── Schema ───────────────────────────────────────────────────────────────────

-- households and household_members are created by rls.sql.
-- Run rls.sql first, then this seed.

CREATE TABLE IF NOT EXISTS children (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  full_name    TEXT,
  birth_date   DATE,
  emoji        TEXT DEFAULT '🧒',
  focus        TEXT,
  mood         TEXT,
  mood_label   TEXT,
  household_id UUID,  -- populated below; FK added by rls.sql
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

-- ── Demo household ───────────────────────────────────────────────────────────
-- Fixed UUID so the seed is idempotent and household_members can reference it.
-- After creating auth users, run:
--   INSERT INTO household_members (user_id, household_id, role) VALUES
--     ('<sofia-uuid>',  '11111111-1111-1111-1111-111111111111', 'parent'),
--     ('<marco-uuid>',  '11111111-1111-1111-1111-111111111111', 'parent'),
--     ('<elena-uuid>',  '11111111-1111-1111-1111-111111111111', 'nanny');

INSERT INTO households (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Rivera Family')
ON CONFLICT (id) DO NOTHING;

-- ── Child ────────────────────────────────────────────────────────────────────

INSERT INTO children (id, name, full_name, birth_date, emoji, focus, mood, mood_label, household_id)
VALUES (
  'default',
  'Mateo',
  'Mateo Rivera',
  '2024-11-14',
  '🧒',
  'Fine Motor Skills',
  '😄',
  'Happy',
  '11111111-1111-1111-1111-111111111111'
) ON CONFLICT (id) DO NOTHING;

-- ── Today's Schedule (May 14, 2026) ─────────────────────────────────────────

INSERT INTO schedule_items (id, child_id, time, title, type, done, active, notes, scheduled_date) VALUES
('s1', 'default', '07:30', 'Breakfast',        'meal',     TRUE,  FALSE, 'Scrambled eggs with cheddar + banana — cleared the plate',    '2026-05-14'),
('s2', 'default', '08:45', 'Morning Park',      'outdoor',  TRUE,  FALSE, '45 min — first time down the big slide solo',                  '2026-05-14'),
('s3', 'default', '10:00', 'Morning Snack',     'meal',     TRUE,  FALSE, 'Rice cakes + mango — said ''more'' for the first time! 🌟',   '2026-05-14'),
('s4', 'default', '10:30', 'Sensory Bin Play',  'play',     FALSE, TRUE,  'Rice bin with cups, scoops, and small safari animals',         '2026-05-14'),
('s5', 'default', '12:00', 'Lunch',             'meal',     FALSE, FALSE, 'Avocado toast + blueberries + cheese stick',                   '2026-05-14'),
('s6', 'default', '12:45', 'Nap',               'nap',      FALSE, FALSE, 'Target 90 min — blackout curtains + white noise on',           '2026-05-14'),
('s7', 'default', '14:30', 'Afternoon Snack',   'meal',     FALSE, FALSE, 'Yogurt with soft berries',                                     '2026-05-14'),
('s8', 'default', '15:00', 'Reading Time',      'learning', FALSE, FALSE, 'Brown Bear + new Pete the Cat book',                           '2026-05-14')
ON CONFLICT (id) DO NOTHING;

-- ── Grocery List ─────────────────────────────────────────────────────────────

INSERT INTO grocery_items (id, child_id, name, completed, created_by, created_at) VALUES
('g1',  'default', 'Oatmeal (quick oats)',        TRUE,  'parent', '2026-05-12 09:00:00+00'),
('g2',  'default', 'Mango (2 ripe)',               TRUE,  'parent', '2026-05-12 09:01:00+00'),
('g3',  'default', 'Eggs × 12',                    TRUE,  'parent', '2026-05-12 09:02:00+00'),
('g4',  'default', 'Babybel cheese wheels',         TRUE,  'nanny',  '2026-05-13 10:00:00+00'),
('g5',  'default', 'Blueberry puffs (Happy Baby)', TRUE,  'nanny',  '2026-05-13 10:01:00+00'),
('g6',  'default', 'Applesauce pouches',            TRUE,  'nanny',  '2026-05-13 10:02:00+00'),
('g7',  'default', 'Avocado (× 3)',                FALSE, 'nanny',  '2026-05-14 08:00:00+00'),
('g8',  'default', 'Banana bunch',                 FALSE, 'parent', '2026-05-14 08:01:00+00'),
('g9',  'default', 'Rice cakes (unsalted)',         FALSE, 'nanny',  '2026-05-14 08:02:00+00'),
('g10', 'default', 'Full-fat plain yogurt',         FALSE, 'parent', '2026-05-14 08:03:00+00'),
('g11', 'default', 'Blueberries (pint)',            FALSE, 'parent', '2026-05-14 08:04:00+00'),
('g12', 'default', 'Sweet potato (× 2)',            FALSE, 'nanny',  '2026-05-14 08:05:00+00'),
('g13', 'default', 'Whole milk (1 gal)',            FALSE, 'parent', '2026-05-14 08:06:00+00'),
('g14', 'default', 'Baby spinach',                  FALSE, 'parent', '2026-05-14 08:07:00+00')
ON CONFLICT (id) DO NOTHING;

-- ── Memory Events (May 1–14, 2026) ───────────────────────────────────────────

INSERT INTO memory_events (id, child_id, type, content, category, image_url, created_by, is_favorite, created_at) VALUES

-- May 14 (Today)
('r1',  'default', 'photo',     'First time down the big slide by himself — pure pride on his face',           'outdoor',  'https://picsum.photos/seed/baby1/400/600',      'nanny',  FALSE, '2026-05-14 09:47:00+00'),
('r2',  'default', 'milestone', 'Said ''more'' clearly for the first time — first functional word! 🌟',         'learning', NULL,                                            'nanny',  TRUE,  '2026-05-14 10:15:00+00'),
('r3',  'default', 'photo',     '12 straight minutes on stacking rings — new personal focus record',           'play',     'https://picsum.photos/seed/toddler2/400/600',   'nanny',  FALSE, '2026-05-14 11:20:00+00'),
('r4',  'default', 'note',      'Cuddly and calm before sensory bin. Very sweet mood all morning.',            'play',     NULL,                                            'nanny',  FALSE, '2026-05-14 10:55:00+00'),

-- May 13
('r5',  'default', 'milestone', 'Climbed the full staircase unassisted for the first time 🏔️',                'learning', NULL,                                            'nanny',  TRUE,  '2026-05-13 15:45:00+00'),
('r6',  'default', 'photo',     'Water table in the backyard — completely soaked, completely ecstatic',        'outdoor',  'https://picsum.photos/seed/water5/400/500',     'nanny',  FALSE, '2026-05-13 10:30:00+00'),
('r7',  'default', 'note',      '1hr 45min nap — best sleep of the month. Woke up glowing.',                  'nap',      NULL,                                            'nanny',  FALSE, '2026-05-13 14:15:00+00'),
('r8',  'default', 'photo',     'Brown Bear for the fourth time today — he never gets bored of it 📖',         'learning', 'https://picsum.photos/seed/book7/400/500',      'nanny',  FALSE, '2026-05-13 16:00:00+00'),

-- May 12
('r9',  'default', 'photo',     'Farmer''s market morning — so curious about every texture and smell',         'outdoor',  'https://picsum.photos/seed/market6/400/500',    'nanny',  FALSE, '2026-05-12 09:15:00+00'),
('r10', 'default', 'milestone', 'Stacked 6 blocks before the big dramatic knockdown — new personal best 🏗️',  'play',     NULL,                                            'nanny',  FALSE, '2026-05-12 11:00:00+00'),
('r11', 'default', 'note',      'Tried avocado again — ate 3 bites without making the face. Real progress.',  'meal',     NULL,                                            'nanny',  FALSE, '2026-05-12 12:30:00+00'),
('r12', 'default', 'photo',     'Oliver playdate — sweet parallel play all afternoon',                         'play',     'https://picsum.photos/seed/playdate17/400/500', 'nanny',  FALSE, '2026-05-12 15:30:00+00'),

-- May 11
('r13', 'default', 'milestone', 'First social wave — ''bye bye'' to the mailman, completely unprompted 👋',    'learning', NULL,                                            'nanny',  FALSE, '2026-05-11 11:00:00+00'),
('r14', 'default', 'photo',     'Morning light and warm oatmeal — the best little sleepy face',               'meal',     'https://picsum.photos/seed/morning8/400/500',   'parent', FALSE, '2026-05-11 08:30:00+00'),
('r15', 'default', 'note',      'Such a calm Monday. Long walk, perfect nap, easy bedtime. Some days just flow.', 'outdoor', NULL,                                         'parent', FALSE, '2026-05-11 19:30:00+00'),

-- May 9 (Library Friday)
('r16', 'default', 'photo',     'Library story time — completely mesmerized by the puppet show',              'learning', 'https://picsum.photos/seed/library15/400/500',  'nanny',  FALSE, '2026-05-09 10:00:00+00'),
('r17', 'default', 'milestone', 'First time clapping on cue during the library song 👏',                      'learning', NULL,                                            'nanny',  FALSE, '2026-05-09 10:45:00+00'),
('r18', 'default', 'note',      'Post-library energy was incredible. Ate absolutely everything at lunch.',    'meal',     NULL,                                            'nanny',  FALSE, '2026-05-09 12:00:00+00'),

-- May 8 (Splash Pad)
('r19', 'default', 'photo',     'Splash pad debut — couldn''t stop laughing at the sprinklers',              'outdoor',  'https://picsum.photos/seed/splashpad/400/500',  'nanny',  TRUE,  '2026-05-08 11:00:00+00'),
('r20', 'default', 'milestone', 'First real running gait — ran directly into the sprinklers 🏃',             'outdoor',  NULL,                                            'nanny',  FALSE, '2026-05-08 11:30:00+00'),
('r21', 'default', 'note',      'Refused the sun hat for exactly 4 minutes then fully accepted it. Character development.', 'outdoor', NULL,                              'nanny',  FALSE, '2026-05-08 11:15:00+00'),

-- May 7
('r22', 'default', 'photo',     'Sensory bin with dried beans — deep concentration mode',                    'play',     'https://picsum.photos/seed/sensorybin/400/500', 'nanny',  FALSE, '2026-05-07 11:00:00+00'),
('r23', 'default', 'note',      'Huge language day — pointed at 8 different objects and waited for their names.', 'learning', NULL,                                       'nanny',  FALSE, '2026-05-07 14:00:00+00'),

-- May 6 (Oliver Tuesday)
('r24', 'default', 'photo',     'Oliver playdate — shared the sandbox bucket without any prompting',         'play',     'https://picsum.photos/seed/sandbox12/400/500',  'nanny',  FALSE, '2026-05-06 14:30:00+00'),
('r25', 'default', 'note',      'Sweet potato for the first time — 6 bites! Might be a new favourite.',     'meal',     NULL,                                            'nanny',  FALSE, '2026-05-06 12:15:00+00'),

-- May 5
('r26', 'default', 'photo',     'First sidewalk chalk scribbles on the patio',                               'outdoor',  'https://picsum.photos/seed/chalk22/400/500',    'nanny',  FALSE, '2026-05-05 10:30:00+00'),
('r27', 'default', 'milestone', 'First intentional scribble with sidewalk chalk — held it correctly 🖍️',    'play',     NULL,                                            'nanny',  FALSE, '2026-05-05 10:45:00+00'),

-- May 2 (Library Friday)
('r28', 'default', 'photo',     'Friday library — grabbed a book and walked it to the reading mat himself',  'learning', 'https://picsum.photos/seed/library15/400/600',  'nanny',  FALSE, '2026-05-02 10:15:00+00'),
('r29', 'default', 'note',      'Starting to show real preferences — always picks the blue cup. Every time.', 'play',    NULL,                                            'nanny',  FALSE, '2026-05-02 15:00:00+00'),

-- May 1
('r30', 'default', 'photo',     'May 1st morning walk — noticed the birds for the first time',               'outdoor',  'https://picsum.photos/seed/morning8/400/600',   'parent', FALSE, '2026-05-01 09:00:00+00'),
('r31', 'default', 'note',      'Two weeks of outdoor morning walks is paying off. Calmer afternoons, better sleep.', 'outdoor', NULL,                                    'parent', FALSE, '2026-05-01 20:00:00+00')

ON CONFLICT (id) DO NOTHING;

-- ── AI Summaries (past 5 days) ────────────────────────────────────────────────

INSERT INTO ai_summaries (id, child_id, summary_date, headline, summary, highlights) VALUES

('as1', 'default', '2026-05-13', 'A breakthrough day',
  'Mateo climbed the full staircase unassisted and knew exactly how big that was. Water table in the morning, the longest nap of the month in the afternoon, and a calm reading session to close the day. Elena called it one of the best days in weeks.',
  '["Stairs milestone 🏔️", "1h 45min nap record 💤", "Water table 💦"]'
),

('as2', 'default', '2026-05-12', 'Market morning + Oliver',
  'Farmer''s market set a great tone — lots of sensory input and vendor interaction. A 6-block tower record before lunch, then Oliver came over for parallel play in the afternoon. Elena noted he''s starting to acknowledge other kids more directly.',
  '["6-block tower record 🏗️", "Oliver playdate 👦", "Tried avocado 🥑"]'
),

('as3', 'default', '2026-05-11', 'Gentle start, big wave',
  'A calmer Monday after the weekend. The highlight: an unprompted ''bye bye'' wave to the mail carrier — first time he''s used a gesture socially without any prompting. Long outdoor walk, excellent nap, and Sofia noted bedtime was unusually smooth.',
  '["First social wave 👋", "Long outdoor walk 🌳", "Easy bedtime 🌙"]'
),

('as4', 'default', '2026-05-09', 'Library magic',
  'Friday library day and the puppet show stopped Mateo completely in his tracks. Elena reported he didn''t move for 8 full minutes — remarkable for 18 months. Clapped along to the song unprompted for the first time. Strong appetite all day.',
  '["Puppet show focus 🎭", "First clapping on cue 👏", "Great appetite 🍽️"]'
),

('as5', 'default', '2026-05-08', 'Splash pad debut',
  'The splash pad opened for the season and Mateo ran — genuinely ran — directly into the sprinklers. First time showing a real running gait. Refused the sun hat briefly then accepted it. High energy burned off by noon, then a 100-minute nap.',
  '["First real run 🏃", "Splash pad debut 💦", "100-min nap 💤"]'
)

ON CONFLICT (id) DO NOTHING;
