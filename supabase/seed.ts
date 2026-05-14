/**
 * Nanny OS — Supabase seed runner
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npx tsx supabase/seed.ts
 *
 * Uses the service role key to bypass RLS.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key);

const DEMO_HOUSEHOLD_ID = "11111111-1111-1111-1111-111111111111";

async function run() {
  // ── Household ──────────────────────────────────────────────────────────────
  // Requires rls.sql to have been run first (households table must exist).
  // household_members must be inserted manually after auth users are created:
  //   INSERT INTO household_members (user_id, household_id, role) VALUES
  //     ('<sofia-uuid>',  DEMO_HOUSEHOLD_ID, 'parent'),
  //     ('<marco-uuid>',  DEMO_HOUSEHOLD_ID, 'parent'),
  //     ('<elena-uuid>',  DEMO_HOUSEHOLD_ID, 'nanny');
  await upsert("households", [
    { id: DEMO_HOUSEHOLD_ID, name: "Rivera Family" },
  ]);

  // ── Child ──────────────────────────────────────────────────────────────────
  await upsert("children", [
    {
      id: "default",
      name: "Mateo",
      full_name: "Mateo Rivera",
      birth_date: "2024-11-14",
      emoji: "🧒",
      focus: "Fine Motor Skills",
      mood: "😄",
      mood_label: "Happy",
      household_id: DEMO_HOUSEHOLD_ID,
    },
  ]);

  // ── Schedule ───────────────────────────────────────────────────────────────
  await upsert("schedule_items", [
    { id: "s1", child_id: "default", time: "07:30", title: "Breakfast",       type: "meal",     done: true,  active: false, notes: "Scrambled eggs with cheddar + banana — cleared the plate",    scheduled_date: "2026-05-14" },
    { id: "s2", child_id: "default", time: "08:45", title: "Morning Park",    type: "outdoor",  done: true,  active: false, notes: "45 min — first time down the big slide solo",                  scheduled_date: "2026-05-14" },
    { id: "s3", child_id: "default", time: "10:00", title: "Morning Snack",   type: "meal",     done: true,  active: false, notes: "Rice cakes + mango — said 'more' for the first time! 🌟",     scheduled_date: "2026-05-14" },
    { id: "s4", child_id: "default", time: "10:30", title: "Sensory Bin Play",type: "play",     done: false, active: true,  notes: "Rice bin with cups, scoops, and small safari animals",         scheduled_date: "2026-05-14" },
    { id: "s5", child_id: "default", time: "12:00", title: "Lunch",           type: "meal",     done: false, active: false, notes: "Avocado toast + blueberries + cheese stick",                   scheduled_date: "2026-05-14" },
    { id: "s6", child_id: "default", time: "12:45", title: "Nap",             type: "nap",      done: false, active: false, notes: "Target 90 min — blackout curtains + white noise on",           scheduled_date: "2026-05-14" },
    { id: "s7", child_id: "default", time: "14:30", title: "Afternoon Snack", type: "meal",     done: false, active: false, notes: "Yogurt with soft berries",                                     scheduled_date: "2026-05-14" },
    { id: "s8", child_id: "default", time: "15:00", title: "Reading Time",    type: "learning", done: false, active: false, notes: "Brown Bear + new Pete the Cat book",                           scheduled_date: "2026-05-14" },
  ]);

  // ── Grocery items ──────────────────────────────────────────────────────────
  await upsert("grocery_items", [
    { id: "g1",  child_id: "default", name: "Oatmeal (quick oats)",        completed: true,  created_by: "parent", created_at: "2026-05-12T09:00:00Z" },
    { id: "g2",  child_id: "default", name: "Mango (2 ripe)",               completed: true,  created_by: "parent", created_at: "2026-05-12T09:01:00Z" },
    { id: "g3",  child_id: "default", name: "Eggs × 12",                    completed: true,  created_by: "parent", created_at: "2026-05-12T09:02:00Z" },
    { id: "g4",  child_id: "default", name: "Babybel cheese wheels",         completed: true,  created_by: "nanny",  created_at: "2026-05-13T10:00:00Z" },
    { id: "g5",  child_id: "default", name: "Blueberry puffs (Happy Baby)", completed: true,  created_by: "nanny",  created_at: "2026-05-13T10:01:00Z" },
    { id: "g6",  child_id: "default", name: "Applesauce pouches",            completed: true,  created_by: "nanny",  created_at: "2026-05-13T10:02:00Z" },
    { id: "g7",  child_id: "default", name: "Avocado (× 3)",                completed: false, created_by: "nanny",  created_at: "2026-05-14T08:00:00Z" },
    { id: "g8",  child_id: "default", name: "Banana bunch",                 completed: false, created_by: "parent", created_at: "2026-05-14T08:01:00Z" },
    { id: "g9",  child_id: "default", name: "Rice cakes (unsalted)",         completed: false, created_by: "nanny",  created_at: "2026-05-14T08:02:00Z" },
    { id: "g10", child_id: "default", name: "Full-fat plain yogurt",         completed: false, created_by: "parent", created_at: "2026-05-14T08:03:00Z" },
    { id: "g11", child_id: "default", name: "Blueberries (pint)",            completed: false, created_by: "parent", created_at: "2026-05-14T08:04:00Z" },
    { id: "g12", child_id: "default", name: "Sweet potato (× 2)",            completed: false, created_by: "nanny",  created_at: "2026-05-14T08:05:00Z" },
    { id: "g13", child_id: "default", name: "Whole milk (1 gal)",            completed: false, created_by: "parent", created_at: "2026-05-14T08:06:00Z" },
    { id: "g14", child_id: "default", name: "Baby spinach",                  completed: false, created_by: "parent", created_at: "2026-05-14T08:07:00Z" },
    { id: "pg1",  child_id: "default", name: "Whole milk (1 gal)",            completed: true, created_by: "parent", created_at: "2026-05-05T09:00:00Z" },
    { id: "pg2",  child_id: "default", name: "Greek yogurt pouches × 6",      completed: true, created_by: "parent", created_at: "2026-05-05T09:01:00Z" },
    { id: "pg3",  child_id: "default", name: "Frozen peas (for steaming)",     completed: true, created_by: "nanny",  created_at: "2026-05-05T09:02:00Z" },
    { id: "pg4",  child_id: "default", name: "Whole grain bread",              completed: true, created_by: "parent", created_at: "2026-05-05T09:03:00Z" },
    { id: "pg5",  child_id: "default", name: "String cheese sticks × 12",     completed: true, created_by: "nanny",  created_at: "2026-05-06T08:00:00Z" },
    { id: "pg6",  child_id: "default", name: "Vanilla puffs (Happy Baby)",     completed: true, created_by: "nanny",  created_at: "2026-05-06T08:01:00Z" },
    { id: "pg7",  child_id: "default", name: "Bananas (bunch)",                completed: true, created_by: "parent", created_at: "2026-05-06T08:02:00Z" },
    { id: "pg8",  child_id: "default", name: "Avocado × 2",                   completed: true, created_by: "nanny",  created_at: "2026-05-07T07:30:00Z" },
    { id: "pg9",  child_id: "default", name: "Baby carrots (for steaming)",    completed: true, created_by: "parent", created_at: "2026-05-07T07:31:00Z" },
    { id: "pg10", child_id: "default", name: "Cheddar block (for cubes)",      completed: true, created_by: "parent", created_at: "2026-05-07T07:32:00Z" },
    { id: "pg11", child_id: "default", name: "Sweet potato × 3",              completed: true, created_by: "nanny",  created_at: "2026-05-07T07:33:00Z" },
    { id: "pg12", child_id: "default", name: "Applesauce pouches × 6",        completed: true, created_by: "parent", created_at: "2026-05-07T07:34:00Z" },
  ]);

  // ── Memory events ──────────────────────────────────────────────────────────
  await upsert("memory_events", [
    // May 14
    { id: "r1",  child_id: "default", type: "photo",     content: "First time down the big slide by himself — pure pride on his face",           category: "outdoor",  image_url: "https://picsum.photos/seed/baby1/400/600",      created_by: "nanny",  is_favorite: false, created_at: "2026-05-14T09:47:00Z" },
    { id: "r2",  child_id: "default", type: "milestone", content: "Said 'more' clearly for the first time — first functional word! 🌟",           category: "learning", image_url: null,                                            created_by: "nanny",  is_favorite: true,  created_at: "2026-05-14T10:15:00Z" },
    { id: "r3",  child_id: "default", type: "photo",     content: "12 straight minutes on stacking rings — new personal focus record",            category: "play",     image_url: "https://picsum.photos/seed/toddler2/400/600",   created_by: "nanny",  is_favorite: false, created_at: "2026-05-14T11:20:00Z" },
    { id: "r4",  child_id: "default", type: "note",      content: "Cuddly and calm before sensory bin. Very sweet mood all morning.",             category: "play",     image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-14T10:55:00Z" },
    // May 13
    { id: "r5",  child_id: "default", type: "milestone", content: "Climbed the full staircase unassisted for the first time 🏔️",                 category: "learning", image_url: null,                                            created_by: "nanny",  is_favorite: true,  created_at: "2026-05-13T15:45:00Z" },
    { id: "r6",  child_id: "default", type: "photo",     content: "Water table in the backyard — completely soaked, completely ecstatic",          category: "outdoor",  image_url: "https://picsum.photos/seed/water5/400/500",     created_by: "nanny",  is_favorite: false, created_at: "2026-05-13T10:30:00Z" },
    { id: "r7",  child_id: "default", type: "note",      content: "1hr 45min nap — best sleep of the month. Woke up glowing.",                    category: "nap",      image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-13T14:15:00Z" },
    { id: "r8",  child_id: "default", type: "photo",     content: "Brown Bear for the fourth time today — he never gets bored of it 📖",           category: "learning", image_url: "https://picsum.photos/seed/book7/400/500",      created_by: "nanny",  is_favorite: false, created_at: "2026-05-13T16:00:00Z" },
    // May 12
    { id: "r9",  child_id: "default", type: "photo",     content: "Farmer's market morning — so curious about every texture and smell",           category: "outdoor",  image_url: "https://picsum.photos/seed/market6/400/500",    created_by: "nanny",  is_favorite: false, created_at: "2026-05-12T09:15:00Z" },
    { id: "r10", child_id: "default", type: "milestone", content: "Stacked 6 blocks before the big dramatic knockdown — new personal best 🏗️",   category: "play",     image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-12T11:00:00Z" },
    { id: "r11", child_id: "default", type: "note",      content: "Tried avocado again — ate 3 bites without making the face. Real progress.",    category: "meal",     image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-12T12:30:00Z" },
    { id: "r12", child_id: "default", type: "photo",     content: "Oliver playdate — sweet parallel play all afternoon",                           category: "play",     image_url: "https://picsum.photos/seed/playdate17/400/500", created_by: "nanny",  is_favorite: false, created_at: "2026-05-12T15:30:00Z" },
    // May 11
    { id: "r13", child_id: "default", type: "milestone", content: "First social wave — 'bye bye' to the mailman, completely unprompted 👋",        category: "learning", image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-11T11:00:00Z" },
    { id: "r14", child_id: "default", type: "photo",     content: "Morning light and warm oatmeal — the best little sleepy face",                 category: "meal",     image_url: "https://picsum.photos/seed/morning8/400/500",   created_by: "parent", is_favorite: false, created_at: "2026-05-11T08:30:00Z" },
    { id: "r15", child_id: "default", type: "note",      content: "Such a calm Monday. Long walk, perfect nap, easy bedtime. Some days just flow.", category: "outdoor", image_url: null,                                            created_by: "parent", is_favorite: false, created_at: "2026-05-11T19:30:00Z" },
    // May 9
    { id: "r16", child_id: "default", type: "photo",     content: "Library story time — completely mesmerized by the puppet show",                 category: "learning", image_url: "https://picsum.photos/seed/library15/400/500",  created_by: "nanny",  is_favorite: false, created_at: "2026-05-09T10:00:00Z" },
    { id: "r17", child_id: "default", type: "milestone", content: "First time clapping on cue during the library song 👏",                         category: "learning", image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-09T10:45:00Z" },
    { id: "r18", child_id: "default", type: "note",      content: "Post-library energy was incredible. Ate absolutely everything at lunch.",       category: "meal",     image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-09T12:00:00Z" },
    // May 8
    { id: "r19", child_id: "default", type: "photo",     content: "Splash pad debut — couldn't stop laughing at the sprinklers",                   category: "outdoor",  image_url: "https://picsum.photos/seed/splashpad/400/500",  created_by: "nanny",  is_favorite: true,  created_at: "2026-05-08T11:00:00Z" },
    { id: "r20", child_id: "default", type: "milestone", content: "First real running gait — ran directly into the sprinklers 🏃",                  category: "outdoor",  image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-08T11:30:00Z" },
    { id: "r21", child_id: "default", type: "note",      content: "Refused the sun hat for exactly 4 minutes then fully accepted it. Character development.", category: "outdoor", image_url: null,                                created_by: "nanny",  is_favorite: false, created_at: "2026-05-08T11:15:00Z" },
    // May 7
    { id: "r22", child_id: "default", type: "photo",     content: "Sensory bin with dried beans — deep concentration mode",                        category: "play",     image_url: "https://picsum.photos/seed/sensorybin/400/500", created_by: "nanny",  is_favorite: false, created_at: "2026-05-07T11:00:00Z" },
    { id: "r23", child_id: "default", type: "note",      content: "Huge language day — pointed at 8 different objects and waited for their names.", category: "learning", image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-07T14:00:00Z" },
    // May 6
    { id: "r24", child_id: "default", type: "photo",     content: "Oliver playdate — shared the sandbox bucket without any prompting",             category: "play",     image_url: "https://picsum.photos/seed/sandbox12/400/500",  created_by: "nanny",  is_favorite: false, created_at: "2026-05-06T14:30:00Z" },
    { id: "r25", child_id: "default", type: "note",      content: "Sweet potato for the first time — 6 bites! Might be a new favourite.",          category: "meal",     image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-06T12:15:00Z" },
    // May 5
    { id: "r26", child_id: "default", type: "photo",     content: "First sidewalk chalk scribbles on the patio",                                   category: "outdoor",  image_url: "https://picsum.photos/seed/chalk22/400/500",    created_by: "nanny",  is_favorite: false, created_at: "2026-05-05T10:30:00Z" },
    { id: "r27", child_id: "default", type: "milestone", content: "First intentional scribble with sidewalk chalk — held it correctly 🖍️",          category: "play",     image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-05T10:45:00Z" },
    // May 2
    { id: "r28", child_id: "default", type: "photo",     content: "Friday library — grabbed a book and walked it to the reading mat himself",       category: "learning", image_url: "https://picsum.photos/seed/library15/400/600",  created_by: "nanny",  is_favorite: false, created_at: "2026-05-02T10:15:00Z" },
    { id: "r29", child_id: "default", type: "note",      content: "Starting to show real preferences — always picks the blue cup. Every time.",     category: "play",     image_url: null,                                            created_by: "nanny",  is_favorite: false, created_at: "2026-05-02T15:00:00Z" },
    // May 1
    { id: "r30", child_id: "default", type: "photo",     content: "May 1st morning walk — noticed the birds for the first time",                   category: "outdoor",  image_url: "https://picsum.photos/seed/morning8/400/600",   created_by: "parent", is_favorite: false, created_at: "2026-05-01T09:00:00Z" },
    { id: "r31", child_id: "default", type: "note",      content: "Two weeks of outdoor morning walks is paying off. Calmer afternoons, better sleep.", category: "outdoor", image_url: null,                                        created_by: "parent", is_favorite: false, created_at: "2026-05-01T20:00:00Z" },
    // May 13 (new)
    { id: "r9",  child_id: "default", type: "note",      content: "Elena texted Sofia mid-nap: 'He climbed the full stairs today. He knew it was a big deal.' Sofia screenshot it immediately.", category: "learning", image_url: null, created_by: "parent", is_favorite: false, created_at: "2026-05-13T13:55:00Z" },
    // May 12 (new)
    { id: "r14", child_id: "default", type: "note",      content: "Starting to acknowledge Oliver directly — made eye contact and offered him a block. Not just parallel play anymore.",             category: "play",     image_url: null, created_by: "nanny",  is_favorite: false, created_at: "2026-05-12T16:15:00Z" },
    // May 11 (new)
    { id: "r18", child_id: "default", type: "photo",     content: "Afternoon walk — found every puddle on the block and tested each one thoroughly",                                                 category: "outdoor",  image_url: "https://picsum.photos/seed/walk_puddle/400/500", created_by: "nanny", is_favorite: false, created_at: "2026-05-11T15:00:00Z" },
    // May 10 — Sunday family day (new)
    { id: "r19", child_id: "default", type: "photo",     content: "Family pancake morning — maple syrup on his nose, pure happiness",                                                               category: "meal",     image_url: "https://picsum.photos/seed/pancake_fam/400/500", created_by: "parent", is_favorite: false, created_at: "2026-05-10T08:45:00Z" },
    { id: "r20", child_id: "default", type: "note",      content: "Grandma came for the afternoon — ran to her the second she walked in. That recognition gets us every time.",                     category: "play",     image_url: null, created_by: "parent", is_favorite: false, created_at: "2026-05-10T14:30:00Z" },
    { id: "r21", child_id: "default", type: "note",      content: "Marco did bedtime solo for the first time. Asleep in 9 minutes. He texted Sofia a photo of the monitor. He was so proud.",      category: "nap",      image_url: null, created_by: "parent", is_favorite: false, created_at: "2026-05-10T19:15:00Z" },
    // May 7 (new)
    { id: "r30", child_id: "default", type: "photo",     content: "Afternoon stacking rings — worked through all 7 sizes, found a real groove",                                                     category: "play",     image_url: "https://picsum.photos/seed/rings_stack/400/500", created_by: "nanny", is_favorite: false, created_at: "2026-05-07T15:30:00Z" },
    // May 6 (new)
    { id: "r32", child_id: "default", type: "note",      content: "Sweet potato for the first time — 6 bites! Zero resistance. A new favourite forming.",                                           category: "meal",     image_url: null, created_by: "nanny",  is_favorite: false, created_at: "2026-05-06T12:15:00Z" },
    { id: "r33", child_id: "default", type: "note",      content: "Spotted a dog on the walk home — stopped cold, pointed, looked at Elena. The naming game is clicking.",                          category: "outdoor",  image_url: null, created_by: "nanny",  is_favorite: false, created_at: "2026-05-06T16:45:00Z" },
    // May 5 (new)
    { id: "r36", child_id: "default", type: "note",      content: "Garbage truck on the morning walk: stood completely still watching it for 3 full minutes. Total wonder.",                         category: "outdoor",  image_url: null, created_by: "nanny",  is_favorite: false, created_at: "2026-05-05T09:30:00Z" },
    // May 4 — harder day (new)
    { id: "r37", child_id: "default", type: "note",      content: "Overtired Monday — fussier than usual at breakfast, short 55-min nap, lower appetite. Needed a reset after an active weekend.",  category: "meal",     image_url: null, created_by: "nanny",  is_favorite: false, created_at: "2026-05-04T08:30:00Z" },
    { id: "r38", child_id: "default", type: "photo",     content: "Even on tough days he finds his thing — blocks and books for 40 quiet minutes",                                                  category: "play",     image_url: "https://picsum.photos/seed/blocks_quiet/400/500", created_by: "nanny", is_favorite: false, created_at: "2026-05-04T14:30:00Z" },
    { id: "r39", child_id: "default", type: "note",      content: "Short walk at 3:30 fully reset his mood. Came home a different kid. Fresh air solves a lot.",                                    category: "outdoor",  image_url: null, created_by: "nanny",  is_favorite: false, created_at: "2026-05-04T16:00:00Z" },
    // May 3 — Sunday (new)
    { id: "r40", child_id: "default", type: "photo",     content: "Park morning with Marco — the Sunday dad tradition is forming nicely",                                                           category: "outdoor",  image_url: "https://picsum.photos/seed/park_marco/400/500", created_by: "parent", is_favorite: false, created_at: "2026-05-03T10:00:00Z" },
    { id: "r41", child_id: "default", type: "note",      content: "Low-energy Sunday — not sick, just quieter. Sometimes toddlers need a rest day. We let him set the pace.",                      category: "nap",      image_url: null, created_by: "parent", is_favorite: false, created_at: "2026-05-03T14:00:00Z" },
    { id: "r42", child_id: "default", type: "note",      content: "Sofia and Mateo did 6 books in a row this afternoon. He chose every one. Reading is becoming their ritual.",                     category: "learning", image_url: null, created_by: "parent", is_favorite: false, created_at: "2026-05-03T16:00:00Z" },
    // May 2 — Saturday library (new additions)
    { id: "r43", child_id: "default", type: "photo",     content: "Saturday library — walked in, grabbed a book, walked it straight to the reading mat himself",                                    category: "learning", image_url: "https://picsum.photos/seed/library_books/400/600", created_by: "nanny", is_favorite: false, created_at: "2026-05-02T10:15:00Z" },
    { id: "r45", child_id: "default", type: "milestone", content: "Walked into library and went directly to the reading mat without any prompting — spatial memory forming.",                       category: "learning", image_url: null, created_by: "nanny",  is_favorite: false, created_at: "2026-05-02T10:00:00Z" },
    { id: "r46", child_id: "default", type: "note",      content: "Started reaching for his jacket at 8:30 before Elena mentioned going out — recognizing the daily routine.",                     category: "learning", image_url: null, created_by: "nanny",  is_favorite: false, created_at: "2026-05-02T08:35:00Z" },
    // May 1 (new)
    { id: "r49", child_id: "default", type: "milestone", content: "First clear head-shake 'no' — deliberate, not just crying. A real communication leap.",                                          category: "learning", image_url: null, created_by: "nanny",  is_favorite: false, created_at: "2026-05-01T13:30:00Z" },
  ]);

  // ── AI Summaries ───────────────────────────────────────────────────────────
  await upsert("ai_summaries", [
    {
      id: "as1", child_id: "default", summary_date: "2026-05-13",
      headline: "A breakthrough day",
      summary: "Mateo climbed the full staircase unassisted and knew exactly how big that was. Water table in the morning, the longest nap of the month in the afternoon, and a calm reading session to close the day.",
      highlights: ["Stairs milestone 🏔️", "1h 45min nap record 💤", "Water table 💦"],
    },
    {
      id: "as2", child_id: "default", summary_date: "2026-05-12",
      headline: "Market morning + Oliver",
      summary: "Farmer's market set a great tone — lots of sensory input. A 6-block tower record before lunch, then Oliver came over for parallel play. Elena noted he's starting to acknowledge other kids more directly.",
      highlights: ["6-block tower record 🏗️", "Oliver playdate 👦", "Tried avocado 🥑"],
    },
    {
      id: "as3", child_id: "default", summary_date: "2026-05-11",
      headline: "Gentle start, big wave",
      summary: "A calmer Monday after the weekend. The highlight: an unprompted 'bye bye' wave to the mail carrier — first time he's used a gesture socially without prompting. Long outdoor walk, excellent nap.",
      highlights: ["First social wave 👋", "Long outdoor walk 🌳", "Easy bedtime 🌙"],
    },
    {
      id: "as4", child_id: "default", summary_date: "2026-05-09",
      headline: "Library magic",
      summary: "Friday library day and the puppet show stopped Mateo completely in his tracks. Elena reported he didn't move for 8 full minutes. Clapped along to the song unprompted for the first time.",
      highlights: ["Puppet show focus 🎭", "First clapping on cue 👏", "Great appetite 🍽️"],
    },
    {
      id: "as5", child_id: "default", summary_date: "2026-05-08",
      headline: "Splash pad debut",
      summary: "The splash pad opened for the season and Mateo ran directly into the sprinklers — first real running gait. Refused the sun hat briefly then accepted it. High energy burned off by noon, then a 100-minute nap.",
      highlights: ["First real run 🏃", "Splash pad debut 💦", "100-min nap 💤"],
    },
    { id: "as6",  child_id: "default", summary_date: "2026-05-10", headline: "A Rivera family Sunday",            summary: "A full family day — pancake breakfast, Marco at the park with Mateo while Sofia rested. Grandma came for the afternoon and Mateo ran to her the moment she arrived. Marco put him down for bed solo for the first time and it took 9 minutes.",                                       highlights: ["Grandma visit 👵", "Marco solo bedtime 🌙", "Family pancakes 🥞"] },
    { id: "as7",  child_id: "default", summary_date: "2026-05-07", headline: "Beans, pointing, and patience",    summary: "Deep sensory play in the morning with a bin of dried beans — Elena noted nearly 18 minutes of independent play. The afternoon was pure language: Mateo pointed at 8 different objects one after another, each time waiting for Elena to name them.",                                  highlights: ["18-min sensory focus 🫘", "8-object pointing game 🗣️", "Stacking rings mastered 🔵"] },
    { id: "as8",  child_id: "default", summary_date: "2026-05-06", headline: "Sweet potato and a very shared bucket", summary: "The morning was a solid park run. Lunch brought the sweet potato breakthrough — 6 bites of a food he'd been rejecting for three weeks. The Oliver playdate was the real highlight: he handed Oliver the sandbox bucket without any prompting.",                               highlights: ["Sweet potato milestone 🍠", "First unprompted sharing 🪣", "Oliver playdate 👦"] },
    { id: "as9",  child_id: "default", summary_date: "2026-05-05", headline: "Chalk marks and garbage trucks",   summary: "Mateo discovered sidewalk chalk and held it correctly on his second try — the first intentional scribble Elena has seen. Earlier on the morning walk, a garbage truck stopped him for three full minutes. Language and fine motor both active.",                                    highlights: ["First chalk scribble 🖍️", "Garbage truck fixation 🚛", "Correct crayon grip ✏️"] },
    { id: "as10", child_id: "default", summary_date: "2026-05-04", headline: "A reset day — and that's okay",   summary: "Mateo was overtired from an active weekend — fussier at breakfast, a short 55-minute nap, lower appetite. But the afternoon redeemed itself: 40 minutes of blocks and books unprompted, then a short walk that fully reset his mood.",                                           highlights: ["Blocks + books 40min 🧱", "Reset walk worked 🌿", "Good bedtime after all 🌙"] },
    { id: "as11", child_id: "default", summary_date: "2026-05-03", headline: "A quiet Sunday with the family",  summary: "Marco and Mateo had the morning together at the park while Sofia rested. A lower-energy day overall — no big milestones, and that was fine. Sofia did extended reading in the afternoon: six books in a row, Mateo chose each one.",                                               highlights: ["Marco park morning 🏃", "6-book reading session 📚", "Sofia + Mateo time ❤️"] },
    { id: "as12", child_id: "default", summary_date: "2026-05-02", headline: "He knew exactly where the reading mat was", summary: "Saturday library and this time Mateo walked in, scanned the room, and went directly to the reading mat — no prompting. Elena noted it felt like a real spatial memory forming. He grabbed a book from the shelf himself.",                                              highlights: ["Spatial memory at library 🗺️", "Grabbed book independently 📖", "Blue cup preference set 🔵"] },
    { id: "as13", child_id: "default", summary_date: "2026-05-01", headline: "May begins — the outdoor rhythm is holding", summary: "First day of May and the morning walk felt settled — like a real ritual now. Mateo noticed birds for the first time, pointing and looking back at Elena to name them. Two weeks of outdoor mornings is paying off in calmer afternoons.",                              highlights: ["Noticed birds for first time 🐦", "Outdoor rhythm locked in 🌳", "First clear 'no' shake 🙅"] },
  ]);

  console.log("✓ Seed complete");
}

async function upsert(table: string, rows: Record<string, unknown>[]) {
  const { error } = await db.from(table).upsert(rows);
  if (error) {
    console.error(`✗ ${table}:`, error.message);
  } else {
    console.log(`✓ ${table} (${rows.length} rows)`);
  }
}

run().catch(console.error);
