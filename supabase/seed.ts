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

async function run() {
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
