/**
 * Nanny OS — Supabase seed runner
 *
 * Layers:
 *   1 — Foundation    (users, household, permissions)
 *   2 — Child         (child record, profile, developmental snapshot,
 *                       sleep, activity preferences, sensory preferences,
 *                       language snapshot, feeding preferences,
 *                       parent–child relationships, nanny–child relationship)
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npx tsx supabase/seed.ts
 *
 * Requires: seed.sql applied first (all table schemas must exist).
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Constants ─────────────────────────────────────────────────────────────────

const HOUSEHOLD_ID = "11111111-1111-1111-1111-111111111111";
const CHILD_ID     = "default";

const DEMO_USERS = [
  { email: "sofia@riverafamily.com", password: "demo1234!", full_name: "Sofia Rivera", role: "parent" as const },
  { email: "marco@riverafamily.com", password: "demo1234!", full_name: "Marco Rivera", role: "parent" as const },
  { email: "elena@riverafamily.com", password: "demo1234!", full_name: "Elena Chen",   role: "nanny"  as const },
];

type UserMap = { sofia: string; marco: string; elena: string };

// ── Runner ────────────────────────────────────────────────────────────────────

async function run() {
  console.log("── Layer 1: Foundation ─────────────────────────────────────────────────────");
  const members = await seedUsers();
  await seedHousehold();
  await seedPermissions(members);
  console.log("✓ Foundation layer complete");

  console.log("\n── Layer 2: Child & Profile ─────────────────────────────────────────────────");
  const users = await resolveUserIds();
  await seedChild();
  await seedChildProfile();
  await seedDevelopmentalSnapshot();
  await seedSleepProfile();
  await seedActivityPreferences();
  await seedSensoryPreferences();
  await seedLanguageSnapshot();
  await seedFeedingPreferences();
  await seedParentChildRelationships(users);
  await seedNannyChildRelationship(users);
  console.log("✓ Child & profile layer complete");

  console.log("\n── Layer 3: Activity Planning ──────────────────────────────────────────────");
  await seedActivityLibrary();
  await seedScheduleTemplates();
  await seedScheduleBlocks();
  await seedActivityRecommendations();
  await seedExtendedScheduleItems();
  console.log("✓ Activity planning layer complete");

  console.log("\n── Layer 4: Journal & Memory ───────────────────────────────────────────────");
  await seedJournalEntries();
  console.log("✓ Journal & memory layer complete");

  console.log("\n── Layer 5: Grocery & Household Ops ───────────────────────────────────────");
  await seedGroceryLists();
  await seedGroceryListItems();
  await seedHouseholdNotes();
  console.log("✓ Grocery & household ops layer complete");

  console.log("\n── Layer 6: AI Insights & Developmental Intelligence ───────────────────────");
  await seedAiInsights();
  await seedExtendedAiSummaries();
  console.log("✓ AI insights layer complete");

  console.log("\n── Layer 7: Realism & Interactions ────────────────────────────────────────");
  await seedMemoryReactions();
  await seedThreadedReplies();
  await seedActivityCompletions();
  await seedVoiceNotes();
  await seedApprovalRequests();
  console.log("✓ Realism & interactions layer complete");
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1 — Foundation
// ═══════════════════════════════════════════════════════════════════════════════

// Uses auth.admin to bypass email confirmation. Idempotent: resolves existing
// users by email rather than failing on duplicate.
async function seedUsers(): Promise<Array<{ user_id: string; role: string }>> {
  const members: Array<{ user_id: string; role: string }> = [];

  for (const def of DEMO_USERS) {
    const { data, error } = await db.auth.admin.createUser({
      email:         def.email,
      password:      def.password,
      email_confirm: true,
      user_metadata: { full_name: def.full_name },
    });

    if (!error) {
      console.log(`✓ user  ${def.email}`);
      members.push({ user_id: data.user.id, role: def.role });
      continue;
    }

    if (error.message.includes("already been registered")) {
      const { data: list, error: listErr } = await db.auth.admin.listUsers();
      if (listErr) { console.error(`✗ listUsers:`, listErr.message); continue; }
      const existing = list.users.find((u) => u.email === def.email);
      if (existing) {
        console.log(`~ user  ${def.email} (exists)`);
        members.push({ user_id: existing.id, role: def.role });
      }
      continue;
    }

    console.error(`✗ user  ${def.email}:`, error.message);
  }

  return members;
}

async function seedHousehold() {
  await upsert("households", [{ id: HOUSEHOLD_ID, name: "Rivera Family" }]);
}

// Composite PK (user_id, household_id) — safe to re-run.
async function seedPermissions(members: Array<{ user_id: string; role: string }>) {
  await upsert(
    "household_members",
    members.map((m) => ({ user_id: m.user_id, household_id: HOUSEHOLD_ID, role: m.role })),
    "user_id,household_id",
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2 — Child & Profile
// ═══════════════════════════════════════════════════════════════════════════════

// Looks up auth UUIDs by email. Fails fast if Layer 1 has not been run.
async function resolveUserIds(): Promise<UserMap> {
  const { data, error } = await db.auth.admin.listUsers();
  if (error) throw new Error(`Cannot resolve user IDs: ${error.message}`);

  const find = (email: string) => {
    const u = data.users.find((u) => u.email === email);
    if (!u) throw new Error(`User not found: ${email} — run Layer 1 first.`);
    return u.id;
  };

  return {
    sofia: find("sofia@riverafamily.com"),
    marco: find("marco@riverafamily.com"),
    elena: find("elena@riverafamily.com"),
  };
}

// ── Child (base record) ───────────────────────────────────────────────────────

async function seedChild() {
  await upsert("children", [{
    id:           CHILD_ID,
    name:         "Mateo",
    full_name:    "Mateo Rivera",
    birth_date:   "2024-11-14",
    emoji:        "🧒",
    focus:        "Fine Motor Skills",
    mood:         "😄",
    mood_label:   "Happy",
    household_id: HOUSEHOLD_ID,
  }]);
}

// ── Child profile (extended) ──────────────────────────────────────────────────

async function seedChildProfile() {
  await upsert("child_profiles", [{
    child_id:          CHILD_ID,
    temperament:       "easy",
    montessori_plane:  "first",
    primary_focus:     "Language and Fine Motor",
    allergies:         [],
    medical_notes:     "No known allergies or conditions. Vaccination schedule current as of April 2026 checkup. Pediatrician is aware of expressive language lag and not concerned — receptive comprehension and gesture repertoire are strong developmental compensators.",
    pediatrician_name: "Dr. Amara Osei, MD",
    last_checkup_date: "2026-04-10",
    next_checkup_date: "2026-08-01",
    weight_kg:         11.4,
    height_cm:         80.2,
    notes:             "Thriving 18-month-old. Generally adaptable and curious with a slow-to-warm tendency on novel sensory input — warms quickly once comfort is established and never refuses twice. Gross and fine motor are advanced for age. Expressive language is on the lower end of the typical range; receptive vocabulary and joint attention are strong, and Elena documents daily approximations to track progress.",
  }], "child_id");
}

// ── Developmental snapshot ────────────────────────────────────────────────────
// Montessori first plane (birth–6): sensitive periods for language, movement,
// and order are all active concurrently at 18 months. Assessment data is
// observational (Elena + parents), not clinical.

async function seedDevelopmentalSnapshot() {
  await upsert("child_developmental_snapshots", [{
    id:                  "dev1",
    child_id:            CHILD_ID,
    assessed_at:         "2026-05-14",
    gross_motor:         "advanced",
    fine_motor:          "advanced",
    language_receptive:  "on-track",
    language_expressive: "emerging",
    social_emotional:    "on-track",
    cognitive:           "advanced",
    sensitive_periods:   ["language", "movement", "order"],
    focus_areas:         ["expressive language", "fine motor refinement", "cooperative play"],
    assessor_notes:      "Runs with a coordinated alternating gait. Climbed the full staircase unassisted on May 13 — above the typical 18-month milestone. Stacks 6 blocks with deliberate, careful placement before the knockdown; holds chalk with a correct tripod grip on only the second attempt. Said first functional word ('more') today at snack — context-appropriate, unprompted, and clearly intentional. Strong joint attention: points consistently, makes eye contact, and holds the gaze waiting for the adult to name before moving on. Offers objects to peers (May 12 and May 6 with Oliver). Spatial memory is forming: walked directly to the library reading mat without any prompting (May 2). Recognises daily routine cues — reached for his jacket before an outing was mentioned (May 2).",
  }]);
}

// ── Sleep profile ─────────────────────────────────────────────────────────────

async function seedSleepProfile() {
  await upsert("child_sleep_profiles", [{
    child_id:                 CHILD_ID,
    typical_wake_time:        "07:00",
    nap_count_per_day:        1,
    typical_nap_start:        "12:45",
    typical_nap_duration_min: 90,
    typical_bedtime:          "19:30",
    white_noise:              true,
    blackout_curtains:        true,
    sleep_cues: [
      "eye rubbing",
      "ear pulling",
      "decreased engagement with toys",
      "leaning into caregiver",
      "quieter vocalizations",
      "glassy eyes",
    ],
    wind_down_routine:        "Active play winds down naturally → dim the room → 2–3 books on the floor → lullaby (Elena often uses a Mandarin song here) → sleep sack → crib awake but drowsy. Begin the routine 20 minutes before the target nap time — starting late compresses the calming window and increases settle time.",
    avg_overnight_wake_count: 0,
    notes:                    "Reliably one nap. Best on record: 1 hr 45 min on May 13, following a high-output morning with the stair milestone. Short naps under 75 minutes almost always trace to an over-stimulated morning rather than readiness to drop the nap — check the morning log before concluding early. Self-settles when put down drowsy but awake. White noise and blackout curtains are non-negotiable; nap quality drops measurably without both. Marco completed the first solo bedtime on May 10 in 9 minutes.",
  }], "child_id");
}

// ── Activity preferences ──────────────────────────────────────────────────────

async function seedActivityPreferences() {
  const rows: Record<string, unknown>[] = [

    // loves ──────────────────────────────────────────────────────────────────
    {
      id: "ap01", category: "outdoor", activity: "Neighborhood walks",
      preference_level: "loves",
      notes: "Reaches for his jacket before anyone mentions going out — routine recognition is clearly forming. Notices dogs, trucks, puddles, and birds with intense, sustained focus. Two weeks of morning walks has measurably improved afternoon regulation and nap quality.",
    },
    {
      id: "ap02", category: "outdoor", activity: "Slide play",
      preference_level: "loves",
      notes: "Went down the big slide solo on May 14 — watched three other children do it first, then went without hesitation. Seeks height and speed. Repeats the same slide 8–10 times in a session without losing interest or needing encouragement.",
    },
    {
      id: "ap03", category: "water", activity: "Water table",
      preference_level: "loves",
      notes: "Gets completely soaked and completely ecstatic. The single most reliable outdoor tool for mood regulation and energy release. Backyard water table is the go-to reset on high-energy or fussy mornings.",
    },
    {
      id: "ap04", category: "water", activity: "Splash pad",
      preference_level: "loves",
      notes: "Debut May 8 — ran directly into the sprinklers on arrival, first time showing a true running gait. Refused the sun hat for 4 minutes then accepted it. Will need the hat cue introduced before the next visit.",
    },
    {
      id: "ap05", category: "sensory", activity: "Sensory bins (rice, beans, sand)",
      preference_level: "loves",
      notes: "Sustained independent focus of 18+ minutes observed with the dried bean bin on May 7. Uses cups, scoops, and small safari animals in sequence and methodically. Rice and bean bins preferred over sand — less material refusal and easier cleanup.",
    },
    {
      id: "ap06", category: "building", activity: "Stacking and block play",
      preference_level: "loves",
      notes: "Stacked 6 blocks on May 12 before the deliberate dramatic knockdown — 12 minutes of uninterrupted, focused work. Worked through all 7 stacking rings independently on May 7, finding a real groove with the sequence. Handles blocks two-handed with careful placement.",
    },
    {
      id: "ap07", category: "literacy", activity: "Being read to",
      preference_level: "loves",
      notes: "Brown Bear, Pete the Cat, and any animal-naming book. Brings books to adults and waits — clear and consistent request behaviour. Evening reading ritual with Sofia (2–3 books, floor, dim light) is a non-negotiable wind-down anchor. Has favourite pages in each regular book and touches them when they come up.",
    },
    {
      id: "ap08", category: "literacy", activity: "Library story time",
      preference_level: "loves",
      notes: "Mesmerized by the puppet show on May 9 — didn't move for 8 minutes, remarkable sustained focus for this age. Clapped along to the song unprompted for the first time. Now walks directly to the reading mat upon entry without any prompting; spatial memory for the library layout is clearly established.",
    },
    {
      id: "ap09", category: "outdoor", activity: "Sidewalk chalk",
      preference_level: "loves",
      notes: "Discovered chalk on May 5. Held it with a correct tripod grip on the second attempt — fine motor readiness is there. Made first intentional scribble that Elena documented as deliberate, not random. Early stage but engaged, persistent, and proud of the marks.",
    },

    // likes ──────────────────────────────────────────────────────────────────
    {
      id: "ap10", category: "social", activity: "Parallel play playdates (Oliver)",
      preference_level: "likes",
      notes: "Oliver is the consistent and only regular playdate. Interaction has been parallel — but on May 12 Mateo made deliberate eye contact and offered a block; on May 6 he shared the sandbox bucket without prompting. The shift toward cooperative play is gradual and real. Don't rush it.",
    },
    {
      id: "ap11", category: "outdoor", activity: "Farmer's market",
      preference_level: "likes",
      notes: "Curious about textures, smells, and vendor interactions without being overwhelmed. Maintains long attention in novel high-sensory environments when the pace is slow. Stays content in carrier or walking for 45+ minutes.",
    },
    {
      id: "ap12", category: "music", activity: "Songs and rhythm",
      preference_level: "likes",
      notes: "Claps to music spontaneously. Responds to Elena's Mandarin lullabies at nap transitions — fussing stops within 30 seconds. Not yet initiating songs independently, but tracks rhythm and clearly anticipates familiar melodies.",
    },
    {
      id: "ap13", category: "outdoor", activity: "Park climbing structures",
      preference_level: "likes",
      notes: "Comfortable on age-appropriate structures and pushes just beyond comfort with supervision. Marco has made park mornings a Sunday ritual — Mateo navigates the junior climbing frame with increasing confidence each week.",
    },

    // neutral ────────────────────────────────────────────────────────────────
    {
      id: "ap14", category: "social", activity: "Group settings with unfamiliar adults",
      preference_level: "neutral",
      notes: "Textbook slow-to-warm. Watches from a safe distance, edges closer over 10–15 minutes, then engages fully on his own terms. Does not seek out strangers but rarely refuses them once he has made his own assessment.",
    },
    {
      id: "ap15", category: "creative", activity: "Finger painting",
      preference_level: "neutral",
      notes: "Tried once in April — tolerated the texture on his hands without distress but didn't seek more. Worth reintroducing in June given the increasing tactile seeking.",
    },

    // dislikes ───────────────────────────────────────────────────────────────
    {
      id: "ap16", category: "transition", activity: "Abrupt activity endings",
      preference_level: "dislikes",
      notes: "Skip the 2-minute transition warning and he protests reliably. With the verbal warning plus a gentle shoulder touch — Elena's method — he almost always transitions willingly. Consistency from all caregivers matters here.",
    },
    {
      id: "ap17", category: "environment", activity: "Prolonged loud environments",
      preference_level: "dislikes",
      notes: "Brief loud moments are fascinating (garbage truck = 3 minutes of total wonder). Sustained high-noise settings — crowded indoor malls, loud restaurants — cause wilting within 15–20 minutes. Schedule outings before noon and avoid peak-hour indoor crowds.",
    },
  ].map((r) => ({ ...r, child_id: CHILD_ID }));

  await upsert("child_activity_preferences", rows, "child_id,activity");
}

// ── Sensory preferences ───────────────────────────────────────────────────────

async function seedSensoryPreferences() {
  await upsert("child_sensory_preferences", [
    {
      id: "sp1", child_id: CHILD_ID, domain: "tactile", sensitivity_level: "seeking",
      notes: "Hands-first with every new surface without hesitation. Rice bins, water, chalk, grass, sand, tree bark — seeks all of it. No tactile avoidance noted at any point. Accepts messy meals and novel food textures more readily than most 18-month-olds.",
    },
    {
      id: "sp2", child_id: CHILD_ID, domain: "vestibular", sensitivity_level: "seeking",
      notes: "Runs, climbs, descends slides, and seeks spinning and swinging. Gravitates toward height and momentum. Swinging is calming rather than activating — useful as a wind-down in the 10 minutes before lunch.",
    },
    {
      id: "sp3", child_id: CHILD_ID, domain: "proprioceptive", sensitivity_level: "seeking",
      notes: "Pushes toy boxes across floors, carries large board books two-handed, seeks firm bear hugs from familiar adults. Heavy work input settles him reliably. Elena incorporates 5 minutes of push/carry into the pre-nap routine on days when he's restless.",
    },
    {
      id: "sp4", child_id: CHILD_ID, domain: "auditory", sensitivity_level: "typical",
      notes: "Engaged by music, storytelling, and outdoor ambient sound. Startles momentarily at sudden loud sounds and self-regulates within seconds — no lingering distress. The garbage truck on May 5 produced complete fascination, not fear — stood still watching it for 3 full minutes. Sustained noise (busy restaurants, crowded indoor spaces) is the real limit; he wilts after 15–20 minutes.",
    },
    {
      id: "sp5", child_id: CHILD_ID, domain: "visual", sensitivity_level: "typical",
      notes: "Tracks movement closely and with intention. Strong visual memory — notices new objects in familiar environments immediately, which Elena uses to introduce Montessori materials without drawing attention to them first. Attracted to color contrast; no sensitivity to bright light.",
    },
    {
      id: "sp6", child_id: CHILD_ID, domain: "oral", sensitivity_level: "typical",
      notes: "Food texture adventurousness has increased measurably in May. Accepted avocado (3 bites, May 12 — no resistance face this time, genuine progress after weeks of rejection) and sweet potato (6 bites, May 6, zero resistance — establishing as a regular). Mouthing non-food objects is declining from the 12-month peak. Oral exploration now expressed primarily through food.",
    },
    {
      id: "sp7", child_id: CHILD_ID, domain: "olfactory", sensitivity_level: "typical",
      notes: "No notable sensitivities or strong seeking. Shows curiosity about food smells in novel environments — paused at the baker's stall at the farmer's market. Not a functional regulatory domain at this stage.",
    },
  ]);
}

// ── Language snapshot ─────────────────────────────────────────────────────────
// Receptive count estimated from Elena's daily object-naming documentation.
// Expressive count reflects only clear, intentional, context-appropriate productions.
// Word approximations (consistent sound for consistent referent) are tracked
// separately in Elena's daily notes but not counted here.

async function seedLanguageSnapshot() {
  await upsert("child_language_snapshots", [{
    id:                     "ls1",
    child_id:               CHILD_ID,
    assessed_at:            "2026-05-14",
    receptive_vocab_count:  65,
    expressive_vocab_count: 6,
    known_words:            ["more", "mama", "dada", "uh-oh", "ba", "no"],
    uses_signs:             false,
    known_signs:            [],
    gesture_types: [
      "declarative pointing (showing something interesting)",
      "imperative pointing (requesting)",
      "open-hand reaching",
      "showing (holds object up toward adult and waits)",
      "waving bye-bye (first unprompted, May 11)",
      "head-shake no (first deliberate use, May 1)",
      "clapping on cue (first at library, May 9)",
    ],
    babbling_complexity:   "varied",
    communication_style:   "Point–look–vocalize. Makes eye contact and holds the gaze, waiting for the adult to supply the word before moving on — strong joint attention and turn-taking awareness. Rarely fills communicative pauses with crying; re-attempts with a new gesture or renewed eye contact instead.",
    notes:                 "Said 'more' clearly and in full context at morning snack today (May 14) — first functional word at 18 months, triggered by rice cakes and mango. Dr. Osei is aware and not concerned: receptive vocabulary and gesture repertoire are robust compensators at this age. Head-shake 'no' appeared May 1 — deliberate, not reflexive, used correctly and consistently since. First clapping on cue at library story time May 9 — social imitation is developing. Elena logs word approximations and new gesture uses daily; parents should name objects every time he points, even if he doesn't say it back — he is building the receptive store first.",
  }]);
}

// ── Feeding preferences ───────────────────────────────────────────────────────

async function seedFeedingPreferences() {
  await upsert("child_feeding_preferences", [{
    child_id:          CHILD_ID,
    feeding_method:    "self-feeding",
    cup_type:          "straw",
    accepted_textures: ["soft chunks", "smooth purees", "dissolvables", "small soft solids", "creamy spreads"],
    rejected_textures: ["stringy", "slimy", "very chewy", "mixed textures (lumps suspended in smooth)"],
    favorite_foods:    [
      "scrambled eggs",
      "banana",
      "oatmeal",
      "mango",
      "blueberries",
      "rice cakes (unsalted)",
      "babybel cheese",
      "sweet potato (new — accepted May 6)",
      "avocado (accepting — May 12)",
    ],
    foods_to_introduce: [
      "soft meat pieces (chicken, turkey)",
      "steamed broccoli florets",
      "lentils",
      "citrus segments",
      "short soft pasta",
      "hummus",
    ],
    allergy_watch: [],
    meal_pace:     "typical",
    self_feeds:    true,
    notes:         "Blue cup preference is absolute — offer it first, every time, without variation. He will accept other cups eventually but the extra negotiation isn't worth it. Cleared his plate of scrambled eggs and banana on May 14; said 'more' for the first time at the same snack. Sweet potato: 6 bites May 6, zero resistance — add to regular rotation now. Avocado: 3 bites May 12 with no resistance face — real progress after weeks of rejection; continue offering. Straw cup is the working vessel; open cup practice is beginning (used 3 times with moderate success). Meal pace slows noticeably when overtired — dropping the spoon and losing interest in food before finishing is an early tired cue, not pickiness.",
  }], "child_id");
}

// ── Parent–child relationships ────────────────────────────────────────────────

async function seedParentChildRelationships(users: UserMap) {
  await upsert("parent_child_relationships", [
    {
      id:                   "pcr-sofia",
      parent_user_id:       users.sofia,
      child_id:             CHILD_ID,
      relationship_label:   "mother",
      is_primary_caregiver: true,
      caregiving_days:      ["Saturday", "Sunday"],
      bonding_activities:   ["evening reading ritual", "bath time", "weekend outings", "morning feeds"],
      parenting_notes:      "Responsive, attachment-focused parenting style. Reads 2–3 books with Mateo every single evening — dim room, floor, same books in rotation. Deeply attuned to his cues; texts Elena during work hours for updates and milestone moments. Works part-time from home and steps in for nap transitions when her schedule allows. Was the first to recognise the significance of today's 'more' moment and called it immediately.",
    },
    {
      id:                   "pcr-marco",
      parent_user_id:       users.marco,
      child_id:             CHILD_ID,
      relationship_label:   "father",
      is_primary_caregiver: false,
      caregiving_days:      ["Saturday", "Sunday"],
      bonding_activities:   ["Sunday park mornings", "weekend outdoor play", "bedtime (building toward solo)"],
      parenting_notes:      "Active, physical, and deeply enthusiastic parenting style. Has made Sunday park mornings a ritual — he and Mateo are forming a real and consistent tradition. Completed first solo bedtime on May 10 in 9 minutes and immediately sent Sofia a photo of the monitor. He was visibly proud. Works full-time during the week; fully present and engaged every weekend. Growing confidence with sleep and feeding routines month over month.",
    },
  ], "parent_user_id,child_id");
}

// ── Nanny–child relationship ──────────────────────────────────────────────────

async function seedNannyChildRelationship(users: UserMap) {
  await upsert("nanny_child_relationships", [{
    id:                    "ncr-elena",
    nanny_user_id:         users.elena,
    child_id:              CHILD_ID,
    start_date:            "2025-02-01",
    schedule_days:         ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    schedule_start_time:   "08:00",
    schedule_end_time:     "17:30",
    caregiving_philosophy: "Montessori-informed, follow-the-child approach. Prepares the environment and then steps back — observes before intervening, trusts the child's drive toward competence. Values long uninterrupted work cycles, independent movement, and outdoor time as a regulatory foundation. Documents in careful daily detail because she believes the record matters both for the family and for her own reflective practice.",
    special_skills:        "AMI 0–3 Montessori assistant training. Bilingual Mandarin/English — uses Mandarin lullabies at nap transitions, which have proven to be a reliable and fast-acting regulation tool for Mateo. Pediatric first aid certified. Background in infant sleep and feeding support.",
    bond_description:      "Very strong and clearly secure. Mateo reaches for Elena at the morning handoff and shows her discoveries throughout the day — both are reliable behavioural indicators of a healthy caregiver attachment. She texts Sofia spontaneously when milestones happen without being asked: on May 13 she sent 'He climbed the full stairs today. He knew it was a big deal.' Sofia screenshotted it immediately. Sofia has said more than once that Elena feels like part of the family.",
    communication_style:   "Verbal handoff summary at the end of every day. Spontaneous in-the-moment milestone texts mid-day. Shares activity photos via the app in real time. Sends a brief end-of-week summary to both parents on Fridays — highlights, what to watch for, and what to try over the weekend.",
  }], "nanny_user_id,child_id");
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3 — Activity Planning
// ═══════════════════════════════════════════════════════════════════════════════

async function seedActivityLibrary() {
  await upsert("activity_library", [
    {
      id: "al-walk-01", name: "Neighborhood Walk + Object Naming",
      category: "outdoor", montessori_area: "culture",
      description: "Slow-paced walk with intentional pauses for observation and naming. Child leads the pace and directs attention via pointing.",
      developmental_focus: ["gross_motor", "language_receptive", "visual_attention", "routine"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 25, duration_max_min: 50,
      materials: [],
      indoor_outdoor: "outdoor", energy_level: "medium", setup_effort: "none",
      sensory_systems: ["vestibular", "proprioceptive", "visual", "auditory"],
      tips: "Pause every time he points — truck, dog, puddle, bird — and name it once. Don't rush the pause. The point-look-wait sequence is his language engine right now. Two weeks of morning walks has measurably improved afternoon regulation.",
    },
    {
      id: "al-park-01", name: "Slide + Climbing Structure",
      category: "outdoor", montessori_area: "culture",
      description: "Open-ended gross motor play at the playground. Child chooses challenge level independently.",
      developmental_focus: ["gross_motor", "vestibular", "confidence", "risk_assessment"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 30, duration_max_min: 60,
      materials: [],
      indoor_outdoor: "outdoor", energy_level: "high", setup_effort: "none",
      sensory_systems: ["vestibular", "proprioceptive", "tactile"],
      tips: "Stand close, don't lift. He watched three children on the big slide before going solo on May 14 — that self-assessment is developmentally correct. Seeks the biggest slide available; resist redirecting to smaller ones.",
    },
    {
      id: "al-water-01", name: "Water Table",
      category: "water", montessori_area: "practical_life",
      description: "Open-ended water play with cups, funnels, and small objects. High tactile input with strong regulatory effect.",
      developmental_focus: ["tactile_seeking", "fine_motor", "cause_and_effect", "regulation"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 20, duration_max_min: 45,
      materials: ["water table", "cups of varying sizes", "funnels", "small waterproof animals"],
      indoor_outdoor: "outdoor", energy_level: "medium", setup_effort: "low",
      sensory_systems: ["tactile", "visual", "proprioceptive"],
      tips: "Change accessories weekly — cups, basters, funnels, measuring spoons. He gets completely soaked and completely ecstatic; dress accordingly. Most reliable reset tool for high-energy or fussy mornings.",
    },
    {
      id: "al-splash-01", name: "Splash Pad",
      category: "water", montessori_area: "culture",
      description: "Community splash pad visit. Novel, high-sensory outdoor water environment with gross motor demands.",
      developmental_focus: ["vestibular", "gross_motor", "sensory_regulation", "novel_environment"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 30, duration_max_min: 60,
      materials: ["water shoes or sandals", "change of clothes", "sun hat"],
      indoor_outdoor: "outdoor", energy_level: "high", setup_effort: "low",
      sensory_systems: ["tactile", "vestibular", "proprioceptive", "auditory"],
      tips: "Introduce the sun hat before entering — he protested 4 minutes on debut (May 8) then accepted. Start the hat cue in the parking lot. Allow 5–10 minutes to acclimate at the perimeter before expecting full engagement.",
    },
    {
      id: "al-bin-01", name: "Rice Sensory Bin",
      category: "sensory", montessori_area: "sensorial",
      description: "Deep bin filled with uncooked rice, small cups, scoops, and figurines. Invites sustained independent exploration.",
      developmental_focus: ["tactile_seeking", "fine_motor", "concentration", "independent_play"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 20, duration_max_min: 40,
      materials: ["large bin or tray", "uncooked rice", "small cups", "scoops", "safari animals"],
      indoor_outdoor: "both", energy_level: "low", setup_effort: "medium",
      sensory_systems: ["tactile", "auditory", "visual"],
      tips: "Set it up silently and let him discover it — prepared environment, Montessori-style. Don't demonstrate or direct; observe. 18+ minutes of independent focus observed with the bean bin variant on May 7.",
    },
    {
      id: "al-bin-02", name: "Dried Bean Sensory Bin",
      category: "sensory", montessori_area: "sensorial",
      description: "Heavier-weight sensory bin using dried beans. Stronger proprioceptive input than rice. Better for high-seeking or restless days.",
      developmental_focus: ["proprioceptive_seeking", "fine_motor", "concentration"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 15, duration_max_min: 35,
      materials: ["large bin", "mixed dried beans", "cups", "scoops", "small animals"],
      indoor_outdoor: "both", energy_level: "low", setup_effort: "medium",
      sensory_systems: ["tactile", "proprioceptive", "auditory"],
      tips: "Heavier bean weight gives more proprioceptive input than rice — better choice on restless days. Rotate between rice and bean bins every 2–3 sessions to maintain novelty.",
    },
    {
      id: "al-build-01", name: "Wooden Block Stacking",
      category: "fine_motor", montessori_area: "sensorial",
      description: "Open-ended block construction. Child stacks, knocks down, and restacks independently.",
      developmental_focus: ["fine_motor", "hand_eye_coordination", "concentration", "spatial_reasoning"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 15, duration_max_min: 30,
      materials: ["10+ wooden unit blocks"],
      indoor_outdoor: "indoor", energy_level: "low", setup_effort: "none",
      sensory_systems: ["tactile", "proprioceptive", "visual"],
      tips: "Let him work without commentary — the concentration is the goal. Don't narrate unless he looks up for connection. He stacked 6 blocks on May 12; watch for 7+ this week.",
    },
    {
      id: "al-build-02", name: "Stacking Rings (Gradation)",
      category: "fine_motor", montessori_area: "sensorial",
      description: "Ordered ring stacking on a central post. Targets size gradation, sequential reasoning, and hand control.",
      developmental_focus: ["fine_motor", "order", "sequential_reasoning", "hand_control"],
      age_min_months: 12, age_max_months: 30, duration_min_min: 10, duration_max_min: 20,
      materials: ["7-ring stacking set"],
      indoor_outdoor: "indoor", energy_level: "low", setup_effort: "none",
      sensory_systems: ["tactile", "visual"],
      tips: "He worked through all 7 sizes in sequence on May 7 — mastered. Mix up the starting position to reintroduce the gradation challenge.",
    },
    {
      id: "al-read-01", name: "Board Books (Child-Selected, Adult-Led)",
      category: "reading", montessori_area: "language",
      description: "Child selects from the rotating basket; adult reads slowly with object-naming pauses. Primary language input activity.",
      developmental_focus: ["language_receptive", "print_awareness", "joint_attention", "vocabulary"],
      age_min_months: 6, age_max_months: 36, duration_min_min: 15, duration_max_min: 30,
      materials: ["4–5 rotating board books"],
      indoor_outdoor: "indoor", energy_level: "low", setup_effort: "none",
      sensory_systems: ["visual", "auditory"],
      tips: "Let him choose every time — he brings books to you consistently, which is clear request behaviour. Honor it. He has favourite pages in each book and touches them when they appear. Current rotation: Brown Bear, Pete the Cat, any animal-naming book.",
    },
    {
      id: "al-read-02", name: "Library Story Time",
      category: "reading", montessori_area: "language",
      description: "Weekly library visit for structured story time, puppet shows, and songs. Highest-value language and social environment of the week.",
      developmental_focus: ["language_receptive", "social_observation", "rhythm", "print_awareness"],
      age_min_months: 12, age_max_months: 48, duration_min_min: 45, duration_max_min: 75,
      materials: [],
      indoor_outdoor: "indoor", energy_level: "low", setup_effort: "none",
      sensory_systems: ["auditory", "visual"],
      tips: "Arrive 10 minutes early. He walks directly to the reading mat now; let him lead. Puppet show is peak engagement: stood completely still for 8 minutes on May 9.",
    },
    {
      id: "al-chalk-01", name: "Sidewalk Chalk",
      category: "outdoor", montessori_area: "practical_life",
      description: "Outdoor mark-making on patio or driveway. Early creative expression and fine motor challenge.",
      developmental_focus: ["fine_motor", "mark_making", "creative_expression", "cause_and_effect"],
      age_min_months: 15, age_max_months: 48, duration_min_min: 15, duration_max_min: 35,
      materials: ["thick sidewalk chalk sticks"],
      indoor_outdoor: "outdoor", energy_level: "low", setup_effort: "none",
      sensory_systems: ["tactile", "visual", "proprioceptive"],
      tips: "He held it with a correct tripod grip on the second attempt (May 5). Offer without demonstration — sit nearby with your own chalk and parallel play. First intentional scribble was May 5; repeat exposure builds mark-making confidence fast.",
    },
    {
      id: "al-sand-01", name: "Sandbox or Sandpit",
      category: "sensory", montessori_area: "sensorial",
      description: "Open-ended sand play with scoops and molds. Proven parallel-play setting for Oliver playdates.",
      developmental_focus: ["tactile_seeking", "fine_motor", "open_ended_play", "cooperative_play"],
      age_min_months: 12, age_max_months: 48, duration_min_min: 25, duration_max_min: 50,
      materials: ["sandbox", "scoops", "cups", "molds"],
      indoor_outdoor: "outdoor", energy_level: "low", setup_effort: "low",
      sensory_systems: ["tactile", "visual", "proprioceptive"],
      tips: "Ideal Oliver playdate format — he shared the sandbox bucket unprompted on May 6. Don't prompt sharing; create the conditions and observe.",
    },
    {
      id: "al-lang-01", name: "Object Pointing + Naming Game",
      category: "language", montessori_area: "language",
      description: "Child-led pointing to objects in the environment; adult provides the word once per point and waits. Mirrors the Montessori three-period lesson's first period.",
      developmental_focus: ["language_receptive", "joint_attention", "vocabulary_building", "communication"],
      age_min_months: 12, age_max_months: 30, duration_min_min: 10, duration_max_min: 20,
      materials: [],
      indoor_outdoor: "both", energy_level: "low", setup_effort: "none",
      sensory_systems: ["visual", "auditory"],
      tips: "Follow his pointing — don't lead. He pointed to 8 objects in sequence on May 7, each time waiting for Elena to name them. Say the word clearly once, make eye contact, wait. No quizzing ('What's that?') — only supply.",
    },
    {
      id: "al-life-01", name: "Simple Pour and Transfer",
      category: "fine_motor", montessori_area: "practical_life",
      description: "Transferring a dry material from one vessel to another using a small pitcher. Classic Montessori practical life work.",
      developmental_focus: ["fine_motor", "concentration", "independence", "wrist_control"],
      age_min_months: 15, age_max_months: 36, duration_min_min: 10, duration_max_min: 20,
      materials: ["small pitcher", "two cups", "tray", "lentils or dry rice"],
      indoor_outdoor: "indoor", energy_level: "low", setup_effort: "low",
      sensory_systems: ["tactile", "proprioceptive", "auditory"],
      tips: "Use a tray to define the workspace. Resist fixing spills; acknowledge without drama and offer the cloth. Start with dry material before water.",
    },
    {
      id: "al-swing-01", name: "Outdoor Swing (Vestibular Regulation)",
      category: "outdoor", montessori_area: "culture",
      description: "Rhythmic back-and-forth swinging on a playground swing. Calming rather than activating at moderate pace.",
      developmental_focus: ["vestibular_regulation", "language_rhythm", "calming", "bilateral_coordination"],
      age_min_months: 12, age_max_months: 48, duration_min_min: 10, duration_max_min: 20,
      materials: [],
      indoor_outdoor: "outdoor", energy_level: "low", setup_effort: "none",
      sensory_systems: ["vestibular", "proprioceptive"],
      tips: "Use as a pre-lunch wind-down, not a high-energy opener. Moderate pace is calming; fast is activating. Narrate the rhythm ('up-and-back') to build language in the repetitive structure.",
    },
    {
      id: "al-bubble-01", name: "Bubble Wands",
      category: "outdoor", montessori_area: "culture",
      description: "Blowing and chasing bubbles outdoors. Visual tracking, bilateral coordination, and natural language opportunity.",
      developmental_focus: ["visual_tracking", "bilateral_coordination", "language", "shared_attention"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 15, duration_max_min: 25,
      materials: ["bubble wand", "bubble solution"],
      indoor_outdoor: "outdoor", energy_level: "low", setup_effort: "low",
      sensory_systems: ["visual", "auditory", "tactile"],
      tips: "Name everything: 'big bubble', 'pop!', 'more?'. Natural 'more' practice — he said it for the first time today (May 14). Oliver also loves bubbles; good shared visual activity where no proximity is required.",
    },
    {
      id: "al-basket-01", name: "Treasure Basket Exploration",
      category: "sensory", montessori_area: "sensorial",
      description: "Low basket with 10–12 natural and household objects of varying texture, weight, and shape. Heuristic play — open-ended discovery.",
      developmental_focus: ["tactile_discrimination", "object_permanence", "independent_exploration", "language"],
      age_min_months: 12, age_max_months: 30, duration_min_min: 20, duration_max_min: 35,
      materials: ["low basket", "natural objects: pinecone, shell, wooden spoon, small brush, cork, smooth stone, fabric swatch, leather strap, metal spoon"],
      indoor_outdoor: "indoor", energy_level: "low", setup_effort: "low",
      sensory_systems: ["tactile", "visual", "oral", "proprioceptive"],
      tips: "Observe without directing — sit nearby but don't interact unless invited. Rotate 4–5 new objects each week. He will discover his own exploration sequence.",
    },
    {
      id: "al-carry-01", name: "Push and Carry Heavy Objects",
      category: "gross_motor", montessori_area: "practical_life",
      description: "Purposeful heavy work: carrying large board books, pushing toy boxes, transferring a laundry basket. Real purpose, not pretend play.",
      developmental_focus: ["proprioceptive_seeking", "gross_motor", "purposeful_movement", "independence"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 8, duration_max_min: 15,
      materials: ["toy box", "large board books", "small laundry basket"],
      indoor_outdoor: "indoor", energy_level: "medium", setup_effort: "none",
      sensory_systems: ["proprioceptive", "vestibular"],
      tips: "Give him a real job: carry books from shelf to reading mat, push toy box to the corner. Elena incorporates 5 minutes of heavy work into the pre-nap routine on restless days — reliably settles him.",
    },
    {
      id: "al-food-01", name: "Fruit and Vegetable Sensory Exploration",
      category: "sensory", montessori_area: "practical_life",
      description: "Handling, smelling, and exploring whole and cut fruits and vegetables before a meal. Food familiarity through sensory exposure, not pressure.",
      developmental_focus: ["olfactory", "tactile", "language", "food_familiarity"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 10, duration_max_min: 20,
      materials: ["2–3 fruits or vegetables, whole and halved"],
      indoor_outdoor: "indoor", energy_level: "low", setup_effort: "low",
      sensory_systems: ["tactile", "olfactory", "visual", "oral"],
      tips: "Seat him at his table 10 minutes before the meal. Name each item as he touches and smells it — no pressure to taste. Avocado and sweet potato were introduced via sensory exploration first; acceptance at the table followed within two sessions.",
    },
    {
      id: "al-lull-01", name: "Lullaby and Pre-Nap Rhythm",
      category: "music", montessori_area: "language",
      description: "Sung lullaby in a dim room as part of the nap wind-down sequence. Auditory regulation and language through music.",
      developmental_focus: ["regulation", "auditory_processing", "language_rhythm", "transition_support"],
      age_min_months: 0, age_max_months: 48, duration_min_min: 8, duration_max_min: 15,
      materials: [],
      indoor_outdoor: "indoor", energy_level: "low", setup_effort: "none",
      sensory_systems: ["auditory"],
      tips: "Elena's Mandarin lullaby is the single most reliable nap regulation tool — fussing stops within 30 seconds. Do not skip this step. Begin in the dim room after books, before the sleep sack.",
    },
    {
      id: "al-nature-01", name: "Nature Observation Walk (Theme Focus)",
      category: "outdoor", montessori_area: "culture",
      description: "Focused neighborhood walk built around one natural theme: birds, puddles, trucks, or insects. Narrows attention and deepens vocabulary within a category.",
      developmental_focus: ["visual_attention", "language", "categorization", "scientific_observation"],
      age_min_months: 15, age_max_months: 48, duration_min_min: 25, duration_max_min: 45,
      materials: [],
      indoor_outdoor: "outdoor", energy_level: "medium", setup_effort: "none",
      sensory_systems: ["visual", "auditory", "vestibular"],
      tips: "Pick one theme per walk: birds, trucks, puddles, flowers. Point and wait — he will point back. He noticed birds for the first time on May 1 using this format. Trucks and dogs are guaranteed engagement; start there on low-focus mornings.",
    },
    {
      id: "al-drum-01", name: "Drum and Rhythm Play",
      category: "music", montessori_area: "sensorial",
      description: "Free rhythm-making with a small drum or pot and wooden spoon. Turn-taking with an adult builds social engagement and auditory attention.",
      developmental_focus: ["auditory_processing", "bilateral_coordination", "rhythm", "turn_taking"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 10, duration_max_min: 20,
      materials: ["small drum or metal pot", "two wooden spoons"],
      indoor_outdoor: "indoor", energy_level: "medium", setup_effort: "low",
      sensory_systems: ["auditory", "tactile", "proprioceptive"],
      tips: "Mirror his rhythm before leading — follow for 30 seconds before introducing variation. Take turns: you play, he plays, pause and look. Clapping on cue appeared in May; rhythm play accelerates beat imitation.",
    },
    {
      id: "al-puddle-01", name: "Puddle Walk",
      category: "outdoor", montessori_area: "culture",
      description: "Walk timed after light rain specifically to explore puddles. High sensory engagement and natural cause-and-effect discovery.",
      developmental_focus: ["vestibular", "tactile", "cause_and_effect", "language", "joyful_movement"],
      age_min_months: 12, age_max_months: 48, duration_min_min: 20, duration_max_min: 35,
      materials: ["rain boots", "change of clothes"],
      indoor_outdoor: "outdoor", energy_level: "medium", setup_effort: "none",
      sensory_systems: ["tactile", "vestibular", "proprioceptive", "visual"],
      tips: "He tested every puddle on the block on May 11. This is pure regulation play — let him splash and stomp without redirecting. Bring a change of clothes but don't threaten to use them. The freedom matters more than staying dry.",
    },
    {
      id: "al-book-01", name: "Book Basket Self-Selection",
      category: "reading", montessori_area: "language",
      description: "Low accessible basket with 4–5 books at floor level. Child selects independently and brings to caregiver. Builds reading as self-initiated behaviour.",
      developmental_focus: ["autonomy", "language", "print_awareness", "independent_initiation"],
      age_min_months: 12, age_max_months: 36, duration_min_min: 15, duration_max_min: 30,
      materials: ["low wicker basket", "4–5 rotating board books"],
      indoor_outdoor: "indoor", energy_level: "low", setup_effort: "low",
      sensory_systems: ["visual", "tactile", "auditory"],
      tips: "4–5 books maximum in the basket — too many causes overwhelm. Rotate weekly. He carries books to you and waits; he walks to the library reading mat unprompted. Build the same home routine.",
    },
    {
      id: "al-ball-01", name: "Soft Ball Rolling and Catching",
      category: "gross_motor", montessori_area: "culture",
      description: "Seated or standing ball rolling with an adult. Turn-taking, gross motor, and early hand-eye coordination.",
      developmental_focus: ["gross_motor", "hand_eye_coordination", "turn_taking", "shared_play"],
      age_min_months: 12, age_max_months: 30, duration_min_min: 10, duration_max_min: 20,
      materials: ["soft fabric ball, 4–6 inches"],
      indoor_outdoor: "both", energy_level: "medium", setup_effort: "none",
      sensory_systems: ["tactile", "visual", "proprioceptive"],
      tips: "Start with floor rolling — predictable trajectory, easier to intercept. Sit 1.5–2 metres apart. Rolling and catching are the developmental milestone at 18 months; no throwing yet. Good gross motor warm-up before outdoor time.",
    },
  ]);
}

// ── Schedule templates ────────────────────────────────────────────────────────

async function seedScheduleTemplates() {
  await upsert("schedule_templates", [
    {
      id: "tmpl-weekday-std",
      name: "Standard Weekday",
      day_type: "weekday_standard",
      description: "Elena's default Monday–Thursday structure. Anchors outdoor time in the morning, a long sensory or fine motor work block mid-morning, nap at 12:45, and a flexible outdoor or creative afternoon.",
      suitable_for: "Any standard weekday without a library visit or playdate. Adaptable: swap the morning work block category based on the child's energy level and the previous day's output.",
    },
    {
      id: "tmpl-library-fri",
      name: "Library Friday",
      day_type: "library_friday",
      description: "Weekly Friday structure anchored on 10am library story time. Shorter morning outdoor, earlier snack, post-library outdoor energy release before lunch. Afternoon mirrors the library with quiet reading at home.",
      suitable_for: "Every Friday when the library is open. The library anchor is the single highest-value language activity of the week — do not schedule over it.",
    },
    {
      id: "tmpl-high-energy",
      name: "High-Energy Output Day",
      day_type: "high_energy",
      description: "For days when physical output is the primary need: post-weekend energy, high-seeking mornings, or warm weather. Front-loads gross motor and water play; lunch comes earlier, nap may run long.",
      suitable_for: "Mondays after active weekends, warm weather days with water access, or whenever high-energy cues appear by 8:30am. Commit to the outdoor-first structure early.",
    },
    {
      id: "tmpl-recovery",
      name: "Recovery Day",
      day_type: "low_energy_recovery",
      description: "For overtired, post-disruption, or low-regulation days. Removes outdoor pressure from the morning, leans on indoor sensory and fine motor work, and protects the nap window above all else.",
      suitable_for: "The day after a short nap, after a busy social day, or whenever tired cues appear before 9am. Mateo's May 4 overtired day needed this structure. Don't force the outdoor block when cues say stay in.",
    },
    {
      id: "tmpl-weekend-family",
      name: "Weekend Family Day",
      day_type: "weekend_family",
      description: "Parent-led weekend structure. Relaxed morning pacing, family outdoor time, a protected nap window, and Sofia's evening reading ritual as the day anchor.",
      suitable_for: "Saturdays and Sundays when Elena is not working. Marco's park mornings slot into the 8:30–10:00 outdoor block. Grandma visits fit in the 15:00–17:00 flexible block.",
    },
  ]);
}

// ── Schedule blocks ───────────────────────────────────────────────────────────

async function seedScheduleBlocks() {
  await upsert("schedule_blocks", [

    // Standard Weekday ────────────────────────────────────────────────────────
    { id: "sb-wk-01", template_id: "tmpl-weekday-std", sort_order:  1, label: "Breakfast",               start_time: "07:30", end_time: "08:10", block_type: "fixed",     activity_category: "meal",     notes: "Standard breakfast. Blue cup — always. Self-feeds. Watch appetite as first tiredness indicator." },
    { id: "sb-wk-02", template_id: "tmpl-weekday-std", sort_order:  2, label: "Morning handoff",         start_time: "08:00", end_time: "08:25", block_type: "fixed",     activity_category: null,       notes: "Elena arrives. Brief verbal handoff. Confirm overnight notes, mood on waking, and any appetite changes." },
    { id: "sb-wk-03", template_id: "tmpl-weekday-std", sort_order:  3, label: "Morning outdoor block",   start_time: "08:30", end_time: "09:30", block_type: "flexible",  activity_category: "outdoor",  notes: "Primary activity: walk, park, or backyard. High energy → park + slide. Calm morning → walk + naming. Choose based on yesterday's output." },
    { id: "sb-wk-04", template_id: "tmpl-weekday-std", sort_order:  4, label: "Transition + snack prep", start_time: "09:30", end_time: "10:00", block_type: "transition", activity_category: null,       notes: "2-minute verbal warning + shoulder touch before ending outdoor. He protests abrupt transitions reliably." },
    { id: "sb-wk-05", template_id: "tmpl-weekday-std", sort_order:  5, label: "Morning snack",           start_time: "10:00", end_time: "10:20", block_type: "fixed",     activity_category: "meal",     notes: "Rice cakes, fruit, or babybel. At his table. Blue cup." },
    { id: "sb-wk-06", template_id: "tmpl-weekday-std", sort_order:  6, label: "Morning work block",      start_time: "10:20", end_time: "11:45", block_type: "flexible",  activity_category: "sensory",  notes: "Primary indoor work slot. Rotate across: sensory bin → fine motor (blocks/rings) → language (object naming, books). One category per session. Protect uninterrupted concentration — 18-minute focus cycles are possible." },
    { id: "sb-wk-07", template_id: "tmpl-weekday-std", sort_order:  7, label: "Pre-lunch wind-down",     start_time: "11:45", end_time: "12:00", block_type: "transition", activity_category: null,       notes: "Lower stimulation. Tidy work area together. Soft conversation, no new activities." },
    { id: "sb-wk-08", template_id: "tmpl-weekday-std", sort_order:  8, label: "Lunch",                   start_time: "12:00", end_time: "12:40", block_type: "fixed",     activity_category: "meal",     notes: "Main meal. Dropping utensils and losing interest before finishing is a tired cue, not pickiness." },
    { id: "sb-wk-09", template_id: "tmpl-weekday-std", sort_order:  9, label: "Pre-nap routine",         start_time: "12:40", end_time: "12:50", block_type: "fixed",     activity_category: null,       notes: "Dim room → 2–3 books on the floor → Mandarin lullaby → sleep sack → crib awake. Don't compress or skip steps." },
    { id: "sb-wk-10", template_id: "tmpl-weekday-std", sort_order: 10, label: "Nap window",              start_time: "12:50", end_time: "14:30", block_type: "nap_window", activity_category: null,      notes: "Target 90 min. White noise + blackout curtains non-negotiable. Short nap (<75 min) → check morning log, not early wake readiness." },
    { id: "sb-wk-11", template_id: "tmpl-weekday-std", sort_order: 11, label: "Wake + afternoon snack",  start_time: "14:30", end_time: "15:00", block_type: "fixed",     activity_category: "meal",     notes: "Allow 10-minute wake buffer before engaging. Yogurt, fruit, or soft crackers." },
    { id: "sb-wk-12", template_id: "tmpl-weekday-std", sort_order: 12, label: "Afternoon activity",      start_time: "15:00", end_time: "16:30", block_type: "flexible",  activity_category: "outdoor",  notes: "Second outdoor or creative block. Chalk, bubbles, water table, or park. Lower intensity than morning if morning was high-output." },
    { id: "sb-wk-13", template_id: "tmpl-weekday-std", sort_order: 13, label: "Wind-down reading",       start_time: "16:30", end_time: "17:00", block_type: "flexible",  activity_category: "reading",  notes: "Book basket self-selection. Quiet floor time. Sets up Sofia's evening reading ritual at handoff." },
    { id: "sb-wk-14", template_id: "tmpl-weekday-std", sort_order: 14, label: "Tidy and handoff prep",   start_time: "17:00", end_time: "17:30", block_type: "transition", activity_category: null,       notes: "Tidy room together — he helps carry books to the basket. Verbal handoff summary ready for parent pickup." },

    // Library Friday ──────────────────────────────────────────────────────────
    { id: "sb-fri-01", template_id: "tmpl-library-fri", sort_order:  1, label: "Breakfast",              start_time: "07:30", end_time: "08:10", block_type: "fixed",     activity_category: "meal",     notes: "Same breakfast routine. Predictability on library days matters — keeps the transition smooth." },
    { id: "sb-fri-02", template_id: "tmpl-library-fri", sort_order:  2, label: "Morning handoff",        start_time: "08:00", end_time: "08:20", block_type: "fixed",     activity_category: null,       notes: "Elena arrives. Library day — confirm pickup timing with parents." },
    { id: "sb-fri-03", template_id: "tmpl-library-fri", sort_order:  3, label: "Short morning walk",     start_time: "08:20", end_time: "09:10", block_type: "flexible",  activity_category: "outdoor",  notes: "30–40 min only. No playground — save physical output for post-library release. Walk + naming, not park." },
    { id: "sb-fri-04", template_id: "tmpl-library-fri", sort_order:  4, label: "Pre-library snack",      start_time: "09:10", end_time: "09:35", block_type: "fixed",     activity_category: "meal",     notes: "Eat before leaving — library runs 10–11am, too long to wait for morning snack." },
    { id: "sb-fri-05", template_id: "tmpl-library-fri", sort_order:  5, label: "Travel to library",      start_time: "09:35", end_time: "09:55", block_type: "transition", activity_category: null,       notes: "Arrive 5–10 minutes early. He walks directly to the reading mat now; let him lead." },
    { id: "sb-fri-06", template_id: "tmpl-library-fri", sort_order:  6, label: "Library story time",     start_time: "10:00", end_time: "11:00", block_type: "fixed",     activity_category: "reading",  notes: "Non-negotiable weekly anchor. Puppet show = peak engagement (8-minute still focus May 9). Sit close but behind him during shows; don't redirect his gaze." },
    { id: "sb-fri-07", template_id: "tmpl-library-fri", sort_order:  7, label: "Post-library outdoor",   start_time: "11:00", end_time: "11:45", block_type: "flexible",  activity_category: "outdoor",  notes: "Energy release after contained sitting. Bubbles, nearby park, or walk home with stops. Mandatory — skipping leads to fussy lunch." },
    { id: "sb-fri-08", template_id: "tmpl-library-fri", sort_order:  8, label: "Lunch",                  start_time: "12:00", end_time: "12:40", block_type: "fixed",     activity_category: "meal",     notes: "Post-library appetite is reliably strong. Offer full portions." },
    { id: "sb-fri-09", template_id: "tmpl-library-fri", sort_order:  9, label: "Pre-nap routine",        start_time: "12:40", end_time: "12:55", block_type: "fixed",     activity_category: null,       notes: "Standard pre-nap sequence. Library mornings produce good naps." },
    { id: "sb-fri-10", template_id: "tmpl-library-fri", sort_order: 10, label: "Nap window",             start_time: "12:55", end_time: "14:30", block_type: "nap_window", activity_category: null,      notes: "Expect a solid nap after library morning. White noise + blackout." },
    { id: "sb-fri-11", template_id: "tmpl-library-fri", sort_order: 11, label: "Afternoon snack",        start_time: "14:30", end_time: "14:55", block_type: "fixed",     activity_category: "meal",     notes: "Standard afternoon snack. Blue cup." },
    { id: "sb-fri-12", template_id: "tmpl-library-fri", sort_order: 12, label: "Library echo — reading", start_time: "15:00", end_time: "16:30", block_type: "flexible",  activity_category: "reading",  notes: "Mirror the library: book basket, reading mat, 3–4 books at his pace. No new activities — anchor the Friday reading rhythm." },
    { id: "sb-fri-13", template_id: "tmpl-library-fri", sort_order: 13, label: "Wind-down and handoff",  start_time: "16:30", end_time: "17:30", block_type: "transition", activity_category: null,       notes: "Soft close. Send end-of-week Friday summary to both parents." },

    // High-Energy Day ─────────────────────────────────────────────────────────
    { id: "sb-hi-01", template_id: "tmpl-high-energy", sort_order:  1, label: "Breakfast (full portions)", start_time: "07:30", end_time: "08:10", block_type: "fixed",    activity_category: "meal",     notes: "Higher output morning needs good fuel. Full portions." },
    { id: "sb-hi-02", template_id: "tmpl-high-energy", sort_order:  2, label: "High-output outdoor",      start_time: "08:15", end_time: "09:30", block_type: "flexible",  activity_category: "outdoor",  notes: "Park + slide, or open run area. Let him go until he naturally slows — don't cap this session early." },
    { id: "sb-hi-03", template_id: "tmpl-high-energy", sort_order:  3, label: "Snack + hydration",        start_time: "09:30", end_time: "09:50", block_type: "fixed",     activity_category: "meal",     notes: "High output burns appetite. Offer snack even if slightly early." },
    { id: "sb-hi-04", template_id: "tmpl-high-energy", sort_order:  4, label: "Water table or splash pad", start_time: "09:50", end_time: "11:00", block_type: "flexible", activity_category: "outdoor",  notes: "High-sensory input. Best single regulation tool available. Dress for full soaking." },
    { id: "sb-hi-05", template_id: "tmpl-high-energy", sort_order:  5, label: "Wind-down swing or walk",  start_time: "11:00", end_time: "11:30", block_type: "transition", activity_category: "outdoor", notes: "Moderate swing pace 10–15 min, then slow walk home. Brings the nervous system down before lunch." },
    { id: "sb-hi-06", template_id: "tmpl-high-energy", sort_order:  6, label: "Lunch (early)",            start_time: "11:30", end_time: "12:10", block_type: "fixed",     activity_category: "meal",     notes: "Shift lunch earlier on high-energy days — high output burns hunger faster. Don't wait for 12:00." },
    { id: "sb-hi-07", template_id: "tmpl-high-energy", sort_order:  7, label: "Pre-nap routine",          start_time: "12:10", end_time: "12:25", block_type: "fixed",     activity_category: null,       notes: "Standard sequence. Big morning → good nap. May run longer than 90 min — let it." },
    { id: "sb-hi-08", template_id: "tmpl-high-energy", sort_order:  8, label: "Nap window (extended)",    start_time: "12:25", end_time: "14:30", block_type: "nap_window", activity_category: null,      notes: "Expect 90–110 min after high-output mornings. Best record: 1hr 45min after staircase climbing on May 13." },
    { id: "sb-hi-09", template_id: "tmpl-high-energy", sort_order:  9, label: "Wake + snack",             start_time: "14:30", end_time: "15:00", block_type: "fixed",     activity_category: "meal",     notes: "Extended wake buffer today. Don't rush engagement after a long nap." },
    { id: "sb-hi-10", template_id: "tmpl-high-energy", sort_order: 10, label: "Low-key afternoon",        start_time: "15:00", end_time: "16:30", block_type: "flexible",  activity_category: "fine_motor", notes: "Blocks, stacking rings, pour-and-transfer, or book basket. No second outdoor push — let the body recover." },
    { id: "sb-hi-11", template_id: "tmpl-high-energy", sort_order: 11, label: "Reading and handoff",      start_time: "16:30", end_time: "17:30", block_type: "flexible",  activity_category: "reading",  notes: "Soft close. Handoff notes should flag morning output level for parents." },

    // Recovery Day ────────────────────────────────────────────────────────────
    { id: "sb-rec-01", template_id: "tmpl-recovery", sort_order:  1, label: "Breakfast (no rush)",        start_time: "07:30", end_time: "08:20", block_type: "fixed",     activity_category: "meal",     notes: "Slower pace. Don't push appetite. Watch for tired cues even at breakfast — that's your baseline signal." },
    { id: "sb-rec-02", template_id: "tmpl-recovery", sort_order:  2, label: "Quiet indoor play",          start_time: "08:20", end_time: "09:15", block_type: "flexible",  activity_category: "sensory",  notes: "No outdoor pressure yet. Treasure basket, book basket, or gentle block play. Follow his lead completely." },
    { id: "sb-rec-03", template_id: "tmpl-recovery", sort_order:  3, label: "Morning snack (early if needed)", start_time: "09:15", end_time: "09:40", block_type: "fixed", activity_category: "meal",   notes: "May need it earlier on low-appetite days. Small portions, familiar foods only." },
    { id: "sb-rec-04", template_id: "tmpl-recovery", sort_order:  4, label: "Sensory or fine motor work", start_time: "09:40", end_time: "11:00", block_type: "flexible",  activity_category: "sensory",  notes: "Sensory bin or pour-and-transfer. Low setup, low demand. Don't introduce new materials on recovery days." },
    { id: "sb-rec-05", template_id: "tmpl-recovery", sort_order:  5, label: "Short gentle outdoor walk",  start_time: "11:00", end_time: "11:35", block_type: "flexible",  activity_category: "outdoor",  notes: "20–25 min only. No playground. His pace. Fresh air matters even on tired days — it improves appetite." },
    { id: "sb-rec-06", template_id: "tmpl-recovery", sort_order:  6, label: "Lunch",                      start_time: "11:45", end_time: "12:25", block_type: "fixed",     activity_category: "meal",     notes: "Don't stress low appetite. Familiar foods only. The short walk almost always improves eating on tough days." },
    { id: "sb-rec-07", template_id: "tmpl-recovery", sort_order:  7, label: "Pre-nap (watch for early cues)", start_time: "12:25", end_time: "12:40", block_type: "fixed", activity_category: null,       notes: "Start pre-nap at first tired cue — don't wait for 12:45. Pushing past the window collapses the nap." },
    { id: "sb-rec-08", template_id: "tmpl-recovery", sort_order:  8, label: "Nap window",                 start_time: "12:40", end_time: "14:30", block_type: "nap_window", activity_category: null,      notes: "The priority. Protect it above everything. May 4: overtired nap was 55 min because the window was missed — that note stands." },
    { id: "sb-rec-09", template_id: "tmpl-recovery", sort_order:  9, label: "Wake + gentle snack",        start_time: "14:30", end_time: "15:00", block_type: "fixed",     activity_category: "meal",     notes: "Very gentle wake. Extended buffer. Don't introduce activities until he self-initiates." },
    { id: "sb-rec-10", template_id: "tmpl-recovery", sort_order: 10, label: "Very quiet afternoon",       start_time: "15:00", end_time: "16:30", block_type: "flexible",  activity_category: "reading",  notes: "Books, treasure basket, or quiet observation. No sensory bin on true recovery days — too activating." },
    { id: "sb-rec-11", template_id: "tmpl-recovery", sort_order: 11, label: "Handoff with full notes",    start_time: "16:30", end_time: "17:30", block_type: "transition", activity_category: null,       notes: "Parents need the full picture: nap quality, appetite, energy. Set realistic bedtime expectations." },

    // Weekend Family Day ──────────────────────────────────────────────────────
    { id: "sb-wknd-01", template_id: "tmpl-weekend-family", sort_order: 1, label: "Family breakfast",        start_time: "07:30", end_time: "08:30", block_type: "fixed",     activity_category: "meal",    notes: "Relaxed. Marco's pancake Saturday tradition fits here if energy allows." },
    { id: "sb-wknd-02", template_id: "tmpl-weekend-family", sort_order: 2, label: "Morning outdoor (family)", start_time: "08:30", end_time: "10:00", block_type: "flexible",  activity_category: "outdoor", notes: "Marco's Sunday park slot, farmer's market, or neighbourhood walk. One adult engages, one stays close." },
    { id: "sb-wknd-03", template_id: "tmpl-weekend-family", sort_order: 3, label: "Snack",                   start_time: "10:00", end_time: "10:25", block_type: "fixed",     activity_category: "meal",    notes: "Standard mid-morning snack. Blue cup." },
    { id: "sb-wknd-04", template_id: "tmpl-weekend-family", sort_order: 4, label: "Free play or family activity", start_time: "10:25", end_time: "12:00", block_type: "flexible", activity_category: null,  notes: "Backyard, indoor play, or family outing. Sofia's reading time slots here if she's home." },
    { id: "sb-wknd-05", template_id: "tmpl-weekend-family", sort_order: 5, label: "Lunch",                   start_time: "12:00", end_time: "12:45", block_type: "fixed",     activity_category: "meal",    notes: "Relaxed family lunch. Don't let it run long — nap window matters more on weekends than any other block." },
    { id: "sb-wknd-06", template_id: "tmpl-weekend-family", sort_order: 6, label: "Pre-nap routine",         start_time: "12:45", end_time: "12:55", block_type: "fixed",     activity_category: null,      notes: "Same sequence as weekdays — consistency is the mechanism. Dim room, 2 books, lullaby, sleep sack. Marco did it solo in 9 min on May 10." },
    { id: "sb-wknd-07", template_id: "tmpl-weekend-family", sort_order: 7, label: "Nap window",              start_time: "12:55", end_time: "14:30", block_type: "nap_window", activity_category: null,     notes: "Protect the weekend nap. White noise + blackout. Weekend disruptions almost always come from shortening this." },
    { id: "sb-wknd-08", template_id: "tmpl-weekend-family", sort_order: 8, label: "Snack + afternoon time",  start_time: "14:30", end_time: "17:00", block_type: "flexible",  activity_category: "social",  notes: "Grandma visits go here — he ran to her on May 10 the moment she arrived. Introduce new adults at the end of this window, not the start." },
    { id: "sb-wknd-09", template_id: "tmpl-weekend-family", sort_order: 9, label: "Dinner + evening reading", start_time: "17:00", end_time: "19:30", block_type: "fixed",    activity_category: "reading", notes: "Family dinner → Sofia's reading ritual (2–3 books, floor, dim light) → sleep sack → crib. The reading ritual is non-negotiable; don't let dinner timing compress it." },
  ]);
}

// ── Activity recommendations (AI-generated) ───────────────────────────────────
// Timeline: app is current as of May 14, 2026 (today in the seed).
// May 14 recommendations reflect post-milestone context ('more' — first word).
// May 15-20 are forward planning. was_completed is null until the day completes.

async function seedActivityRecommendations() {
  await upsert("activity_recommendations", [

    // May 14 — language breakthrough day ─────────────────────────────────────
    {
      id: "ar-0514-01", child_id: CHILD_ID, recommended_date: "2026-05-14",
      activity_library_id: "al-walk-01", time_of_day: "morning", priority: "primary",
      developmental_reason: "Said 'more' for the first time at snack — expressive language window is opening. Morning walk with deliberate object-naming pauses directly feeds the joint-attention mechanism that produced today's breakthrough.",
      caregiver_notes: "Pause at every truck and dog. Wait the full 3 seconds after pointing before supplying the word.",
      generated_by: "ai", was_completed: true,
    },
    {
      id: "ar-0514-02", child_id: CHILD_ID, recommended_date: "2026-05-14",
      activity_library_id: "al-bin-01", time_of_day: "mid-morning", priority: "primary",
      developmental_reason: "High tactile seeking noted this week (water table May 13, chalk building). Rice bin supports sensory regulation while maintaining fine motor focus — good balance after an active gross-motor morning at the park.",
      caregiver_notes: "Rice bin today; bean bin was used May 7. Set up silently and let him find it.",
      generated_by: "ai", was_completed: true,
    },
    {
      id: "ar-0514-03", child_id: CHILD_ID, recommended_date: "2026-05-14",
      activity_library_id: "al-build-01", time_of_day: "mid-morning", priority: "secondary",
      developmental_reason: "Stacked 6 blocks on May 12 — fine motor consolidation phase. Repeat exposure within 3–4 days cements the skill before pushing to the next challenge level.",
      caregiver_notes: "If he initiates block play naturally after the sensory bin, let the session run. Don't transition away during concentration.",
      generated_by: "ai", was_completed: true,
    },
    {
      id: "ar-0514-04", child_id: CHILD_ID, recommended_date: "2026-05-14",
      activity_library_id: "al-read-01", time_of_day: "afternoon", priority: "secondary",
      developmental_reason: "Language is the active developmental edge today. Board book reading post-nap capitalises on afternoon alertness and reinforces the 'more' moment with rich vocabulary input.",
      caregiver_notes: "Let him choose. Pete the Cat + one animal book if he's open. Don't rush pages — let him touch and look.",
      generated_by: "ai", was_completed: null,
    },

    // May 15 — build on language momentum ────────────────────────────────────
    {
      id: "ar-0515-01", child_id: CHILD_ID, recommended_date: "2026-05-15",
      activity_library_id: "al-water-01", time_of_day: "mid-morning", priority: "primary",
      developmental_reason: "Tactile seeking is the dominant sensory profile this week. Water table after a standard park morning provides deep regulation input — best tool for pre-nap settling on active days.",
      caregiver_notes: "Set up at 10:30 after snack. Change accessories from May 13: add funnels and basters.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0515-02", child_id: CHILD_ID, recommended_date: "2026-05-15",
      activity_library_id: "al-lang-01", time_of_day: "afternoon", priority: "primary",
      developmental_reason: "First functional word yesterday. The 48 hours following an expressive language leap are the optimal window for reinforcement. Object pointing game exercises the point-look-wait-name loop that produced 'more'.",
      caregiver_notes: "8–10 objects from the room. Follow his pointing entirely. No quizzing — only supply. He may attempt a sound approximation during this session.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0515-03", child_id: CHILD_ID, recommended_date: "2026-05-15",
      activity_library_id: "al-build-02", time_of_day: "mid-morning", priority: "secondary",
      developmental_reason: "Stacking rings mastered on May 7. Mixing up the starting order reintroduces the gradation challenge. Maintains fine motor focus block continuity alongside block stacking earlier this week.",
      caregiver_notes: "Jumble the rings before presenting. He'll self-correct. Don't intervene unless he completely disengages.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0515-04", child_id: CHILD_ID, recommended_date: "2026-05-15",
      activity_library_id: "al-basket-01", time_of_day: "afternoon", priority: "optional",
      developmental_reason: "Treasure basket introduces new tactile textures in a low-demand format — good for the afternoon slot when initiative is lower. New objects this session build sensory vocabulary.",
      caregiver_notes: "New objects this week: pinecone, small smooth stone, wooden spool. Place basket quietly near his regular play area.",
      generated_by: "ai", was_completed: null,
    },

    // May 16 — Library Friday ─────────────────────────────────────────────────
    {
      id: "ar-0516-01", child_id: CHILD_ID, recommended_date: "2026-05-16",
      activity_library_id: "al-read-02", time_of_day: "morning", priority: "primary",
      developmental_reason: "Weekly library anchor. Language is at an active edge post-'more'. The puppet show format consistently produces the longest sustained attention observed (8 min on May 9). Highest-value language activity of the week.",
      caregiver_notes: "Arrive by 9:50. He walks to the reading mat — let him. Sit close but behind him during the puppet show. Don't redirect his gaze.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0516-02", child_id: CHILD_ID, recommended_date: "2026-05-16",
      activity_library_id: "al-bubble-01", time_of_day: "morning", priority: "secondary",
      developmental_reason: "Post-library outdoor needs to release contained energy without re-escalating before nap. Bubble wands are visually engaging and physically light — ideal energy bridge. Natural 'more' practice context.",
      caregiver_notes: "Bubbles immediately outside the library, before walking home. 25–30 min cap — want energy for nap.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0516-03", child_id: CHILD_ID, recommended_date: "2026-05-16",
      activity_library_id: "al-book-01", time_of_day: "post-nap", priority: "secondary",
      developmental_reason: "Library echo in the afternoon reinforces the Friday rhythm and builds reading as a daily self-initiated practice, not just a caregiver-directed one.",
      caregiver_notes: "3–4 books from the basket. Reading mat on the floor. No time pressure. Mirror the morning's feel.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0516-04", child_id: CHILD_ID, recommended_date: "2026-05-16",
      activity_library_id: "al-chalk-01", time_of_day: "post-nap", priority: "optional",
      developmental_reason: "Fine motor follow-up to a language-heavy morning. Third chalk session since May 5 introduction — repeat exposure in the early confidence phase accelerates mark-making skill.",
      caregiver_notes: "Only if weather permits and he's well-rested. Don't push on post-library tired afternoons.",
      generated_by: "ai", was_completed: null,
    },

    // May 19 — Monday reset after weekend ─────────────────────────────────────
    {
      id: "ar-0519-01", child_id: CHILD_ID, recommended_date: "2026-05-19",
      activity_library_id: "al-nature-01", time_of_day: "morning", priority: "primary",
      developmental_reason: "Monday morning walk re-anchors the routine after the weekend schedule shift. Nature observation (birds theme) reconnects the point-look-name loop after 2 days without Elena's naming consistency.",
      caregiver_notes: "Birds theme — same route as May 1 when he noticed them for the first time. See if he initiates the point.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0519-02", child_id: CHILD_ID, recommended_date: "2026-05-19",
      activity_library_id: "al-bin-02", time_of_day: "mid-morning", priority: "primary",
      developmental_reason: "Dried bean bin offers heavier proprioceptive input than rice — better for Monday resets when the body needs re-grounding after an active weekend. Last bean bin was May 7; novelty is renewed.",
      caregiver_notes: "Add 3 new figurines. Set up in silence on the work mat.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0519-03", child_id: CHILD_ID, recommended_date: "2026-05-19",
      activity_library_id: "al-carry-01", time_of_day: "morning", priority: "secondary",
      developmental_reason: "Proprioceptive heavy work helps re-regulate after weekend movement variation. Simple carry-and-deliver in the pre-nap window reduces restlessness and improves settle time.",
      caregiver_notes: "Books from shelf to reading mat, or toy box push across the room. Real destination — purposeful, not play.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0519-04", child_id: CHILD_ID, recommended_date: "2026-05-19",
      activity_library_id: "al-chalk-01", time_of_day: "post-nap", priority: "optional",
      developmental_reason: "Chalk is now in the early confidence phase — 4th session builds the mark-making habit. Afternoon post-nap alertness window supports fine motor precision.",
      caregiver_notes: "Weather permitting. Offer alongside outdoor time, not instead of it.",
      generated_by: "ai", was_completed: null,
    },

    // May 20 — Oliver playdate day ────────────────────────────────────────────
    {
      id: "ar-0520-01", child_id: CHILD_ID, recommended_date: "2026-05-20",
      activity_library_id: "al-sand-01", time_of_day: "morning", priority: "primary",
      developmental_reason: "Sandbox is the proven Oliver format. He shared the bucket unprompted on May 6 and offered a block directly on May 12 — the cooperative engagement trajectory is building. Same setting, same materials, same peer.",
      caregiver_notes: "Arrive with Oliver already set up. Let Mateo find his way in on his own terms — his slow-warm approach leads to better and longer engagement.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0520-02", child_id: CHILD_ID, recommended_date: "2026-05-20",
      activity_library_id: "al-build-01", time_of_day: "morning", priority: "secondary",
      developmental_reason: "Pre-playdate solo work helps Mateo arrive regulated. 15 minutes of block play before Oliver arrives gives him a settled, independent baseline — he engages better socially when he's not arriving scattered.",
      caregiver_notes: "Set up blocks at 10:00. Oliver arrives at 11:00. Let him finish his session naturally — don't interrupt for the playdate transition.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0520-03", child_id: CHILD_ID, recommended_date: "2026-05-20",
      activity_library_id: "al-bubble-01", time_of_day: "morning", priority: "secondary",
      developmental_reason: "Bubble wands are proven parallel shared visual play — both children engage independently without proximity coordination. Good bridge activity when direct cooperative play stalls.",
      caregiver_notes: "Introduce when sandbox energy dips. Natural 'more' practice for Mateo in context he enjoys.",
      generated_by: "ai", was_completed: null,
    },
    {
      id: "ar-0520-04", child_id: CHILD_ID, recommended_date: "2026-05-20",
      activity_library_id: "al-bin-01", time_of_day: "post-nap", priority: "optional",
      developmental_reason: "Post-playdate regulation. Social engagement is cognitively demanding at 18 months even when it goes well. A solo sensory bin after nap returns him to independent, calm baseline before the handoff.",
      caregiver_notes: "Don't skip the post-nap solo window after playdates. He needs the decompression even on good days.",
      generated_by: "ai", was_completed: null,
    },
  ]);
}

// ── Extended schedule items ───────────────────────────────────────────────────
// App date: May 14, 2026.
// May 12–13: all done (past). May 15–20: done: false (future planned days).
// May 14 items already exist (s1–s8 in seed.sql); not re-seeded here.

async function seedExtendedScheduleItems() {
  await upsert("schedule_items", [

    // May 12 (Monday) — Farmer's market + 6-block record ─────────────────────
    { id: "m12a", child_id: CHILD_ID, scheduled_date: "2026-05-12", time: "07:30", title: "Breakfast",        type: "meal",     done: true,  active: false, notes: "Oatmeal + blueberries + banana. Blue cup. Cleared the bowl." },
    { id: "m12b", child_id: CHILD_ID, scheduled_date: "2026-05-12", time: "08:45", title: "Farmer's Market",  type: "outdoor",  done: true,  active: false, notes: "45 min — curious about every texture and smell. Longest pause at the bakery stall and the flower buckets." },
    { id: "m12c", child_id: CHILD_ID, scheduled_date: "2026-05-12", time: "10:00", title: "Morning Snack",    type: "meal",     done: true,  active: false, notes: "Rice cakes + banana. Good appetite after the market." },
    { id: "m12d", child_id: CHILD_ID, scheduled_date: "2026-05-12", time: "10:30", title: "Block Tower",      type: "play",     done: true,  active: false, notes: "Stacked 6 blocks — new personal best 🏗️ Deliberate, careful placement. 12 minutes uninterrupted before the intentional knockdown." },
    { id: "m12e", child_id: CHILD_ID, scheduled_date: "2026-05-12", time: "12:00", title: "Lunch",            type: "meal",     done: true,  active: false, notes: "Avocado toast + blueberries + babybel. Tried avocado — 3 bites, no resistance face this time. Real progress." },
    { id: "m12f", child_id: CHILD_ID, scheduled_date: "2026-05-12", time: "12:45", title: "Nap",              type: "nap",      done: true,  active: false, notes: "75 min — solid. Woke up in a great mood." },
    { id: "m12g", child_id: CHILD_ID, scheduled_date: "2026-05-12", time: "14:30", title: "Afternoon Snack",  type: "meal",     done: true,  active: false, notes: "Yogurt + soft berries." },
    { id: "m12h", child_id: CHILD_ID, scheduled_date: "2026-05-12", time: "15:30", title: "Oliver Playdate",  type: "play",     done: true,  active: false, notes: "Parallel play all afternoon. He made direct eye contact and offered Oliver a block — the shift is real." },

    // May 13 (Tuesday) — Water table + staircase breakthrough ─────────────────
    { id: "m13a", child_id: CHILD_ID, scheduled_date: "2026-05-13", time: "07:30", title: "Breakfast",           type: "meal",     done: true,  active: false, notes: "Scrambled eggs + banana — cleared the plate." },
    { id: "m13b", child_id: CHILD_ID, scheduled_date: "2026-05-13", time: "08:30", title: "Morning Walk",        type: "outdoor",  done: true,  active: false, notes: "40 min — spotted three dogs. Pointed at each, held eye contact, waited for the name. Strong joint attention morning." },
    { id: "m13c", child_id: CHILD_ID, scheduled_date: "2026-05-13", time: "10:00", title: "Morning Snack",       type: "meal",     done: true,  active: false, notes: "Rice cakes + mango. Good appetite." },
    { id: "m13d", child_id: CHILD_ID, scheduled_date: "2026-05-13", time: "10:30", title: "Water Table",         type: "outdoor",  done: true,  active: false, notes: "Completely soaked, completely ecstatic. 35 minutes. Best sensory regulation morning of the week." },
    { id: "m13e", child_id: CHILD_ID, scheduled_date: "2026-05-13", time: "12:00", title: "Lunch",               type: "meal",     done: true,  active: false, notes: "Avocado + blueberries + babybel. Ate well." },
    { id: "m13f", child_id: CHILD_ID, scheduled_date: "2026-05-13", time: "12:45", title: "Nap",                 type: "nap",      done: true,  active: false, notes: "1hr 45min — best of the month 💤 Woke up glowing." },
    { id: "m13g", child_id: CHILD_ID, scheduled_date: "2026-05-13", time: "14:30", title: "Afternoon Snack",     type: "meal",     done: true,  active: false, notes: "Applesauce + rice cakes." },
    { id: "m13h", child_id: CHILD_ID, scheduled_date: "2026-05-13", time: "15:30", title: "Staircase Climbing",  type: "outdoor",  done: true,  active: false, notes: "Climbed the full staircase unassisted 🏔️ Paused at the top, looked back at Elena. He knew exactly how big that was." },
    { id: "m13i", child_id: CHILD_ID, scheduled_date: "2026-05-13", time: "16:00", title: "Reading Time",        type: "learning", done: true,  active: false, notes: "Brown Bear × 4. Touches the same page every single time." },

    // May 15 (Thursday) — language momentum + water table follow-up ───────────
    { id: "m15a", child_id: CHILD_ID, scheduled_date: "2026-05-15", time: "07:30", title: "Breakfast",           type: "meal",     done: false, active: false, notes: "Scrambled eggs + banana. Blue cup." },
    { id: "m15b", child_id: CHILD_ID, scheduled_date: "2026-05-15", time: "08:45", title: "Park — Slide Work",   type: "outdoor",  done: false, active: false, notes: "Big slide focus. Let him set the repetition count — resist redirecting to smaller equipment." },
    { id: "m15c", child_id: CHILD_ID, scheduled_date: "2026-05-15", time: "10:00", title: "Morning Snack",       type: "meal",     done: false, active: false, notes: "Rice cakes + fruit. Blue cup." },
    { id: "m15d", child_id: CHILD_ID, scheduled_date: "2026-05-15", time: "10:30", title: "Water Table",         type: "outdoor",  done: false, active: false, notes: "High tactile seeking week — water table again. Change accessories from May 13: funnels and basters." },
    { id: "m15e", child_id: CHILD_ID, scheduled_date: "2026-05-15", time: "12:00", title: "Lunch",               type: "meal",     done: false, active: false, notes: "Avocado toast + blueberries + sweet potato. Both accepted foods — try offering sweet potato as a side now." },
    { id: "m15f", child_id: CHILD_ID, scheduled_date: "2026-05-15", time: "12:45", title: "Nap",                 type: "nap",      done: false, active: false, notes: "Target 90 min. White noise + blackout. Water table mornings → reliable naps." },
    { id: "m15g", child_id: CHILD_ID, scheduled_date: "2026-05-15", time: "14:30", title: "Afternoon Snack",     type: "meal",     done: false, active: false, notes: "Yogurt + soft berries." },
    { id: "m15h", child_id: CHILD_ID, scheduled_date: "2026-05-15", time: "15:00", title: "Object Naming Game",  type: "learning", done: false, active: false, notes: "Language edge is open post-'more'. Point-wait-name loop with 8–10 objects from the room. Follow his pointing." },
    { id: "m15i", child_id: CHILD_ID, scheduled_date: "2026-05-15", time: "16:00", title: "Sidewalk Chalk",      type: "outdoor",  done: false, active: false, notes: "3rd chalk session. Parallel play — sit nearby with your own chalk. Watch for increased intentionality vs. May 5." },

    // May 16 (Friday) — Library Day ───────────────────────────────────────────
    { id: "m16a", child_id: CHILD_ID, scheduled_date: "2026-05-16", time: "07:30", title: "Breakfast",           type: "meal",     done: false, active: false, notes: "Standard breakfast. Predictability on library days keeps the transition smooth." },
    { id: "m16b", child_id: CHILD_ID, scheduled_date: "2026-05-16", time: "08:20", title: "Short Morning Walk",  type: "outdoor",  done: false, active: false, notes: "30 min only. No playground — save physical output for post-library release." },
    { id: "m16c", child_id: CHILD_ID, scheduled_date: "2026-05-16", time: "09:10", title: "Pre-Library Snack",   type: "meal",     done: false, active: false, notes: "Eat before leaving — library runs 10–11am, too long to wait." },
    { id: "m16d", child_id: CHILD_ID, scheduled_date: "2026-05-16", time: "10:00", title: "Library Story Time",  type: "learning", done: false, active: false, notes: "Arrive 5–10 min early. He walks to the reading mat — let him. Puppet show is peak engagement." },
    { id: "m16e", child_id: CHILD_ID, scheduled_date: "2026-05-16", time: "11:00", title: "Post-Library Outdoor", type: "outdoor", done: false, active: false, notes: "Bubble wands or nearby park. 30 min cap — protect nap energy." },
    { id: "m16f", child_id: CHILD_ID, scheduled_date: "2026-05-16", time: "12:00", title: "Lunch",               type: "meal",     done: false, active: false, notes: "Post-library appetite reliably strong. Full portions." },
    { id: "m16g", child_id: CHILD_ID, scheduled_date: "2026-05-16", time: "12:45", title: "Nap",                 type: "nap",      done: false, active: false, notes: "Library mornings → solid naps. White noise + blackout." },
    { id: "m16h", child_id: CHILD_ID, scheduled_date: "2026-05-16", time: "15:00", title: "Quiet Reading",       type: "learning", done: false, active: false, notes: "Library echo: book basket, reading mat, 3–4 books at his pace. No new activities — anchor the Friday reading rhythm." },

    // May 19 (Monday) — routine reset after weekend ───────────────────────────
    { id: "m19a", child_id: CHILD_ID, scheduled_date: "2026-05-19", time: "07:30", title: "Breakfast",           type: "meal",     done: false, active: false, notes: "Oatmeal + banana + blueberries. Blue cup. Monday reset breakfast." },
    { id: "m19b", child_id: CHILD_ID, scheduled_date: "2026-05-19", time: "08:45", title: "Nature Walk — Birds", type: "outdoor",  done: false, active: false, notes: "Birds theme. Same route as May 1. See if he initiates the point before you do." },
    { id: "m19c", child_id: CHILD_ID, scheduled_date: "2026-05-19", time: "10:00", title: "Morning Snack",       type: "meal",     done: false, active: false, notes: "Rice cakes + mango. Blue cup." },
    { id: "m19d", child_id: CHILD_ID, scheduled_date: "2026-05-19", time: "10:30", title: "Bean Sensory Bin",    type: "play",     done: false, active: false, notes: "Dried bean bin — heavier proprioceptive input for Monday reset. 3 new figurines. Set up in silence." },
    { id: "m19e", child_id: CHILD_ID, scheduled_date: "2026-05-19", time: "12:00", title: "Lunch",               type: "meal",     done: false, active: false, notes: "Sweet potato + eggs + blueberries. Both confirmed favourites — good Monday lunch." },
    { id: "m19f", child_id: CHILD_ID, scheduled_date: "2026-05-19", time: "12:45", title: "Nap",                 type: "nap",      done: false, active: false, notes: "Target 90 min. Heavy work carry if restless before nap routine." },
    { id: "m19g", child_id: CHILD_ID, scheduled_date: "2026-05-19", time: "14:30", title: "Afternoon Snack",     type: "meal",     done: false, active: false, notes: "Yogurt + soft berries." },
    { id: "m19h", child_id: CHILD_ID, scheduled_date: "2026-05-19", time: "15:00", title: "Sidewalk Chalk",      type: "outdoor",  done: false, active: false, notes: "4th chalk session — confidence building. Weather permitting. Parallel play format." },

    // May 20 (Tuesday) — Oliver playdate ──────────────────────────────────────
    { id: "m20a", child_id: CHILD_ID, scheduled_date: "2026-05-20", time: "07:30", title: "Breakfast",               type: "meal",     done: false, active: false, notes: "Scrambled eggs + banana. Blue cup. Playdate day — good fuel." },
    { id: "m20b", child_id: CHILD_ID, scheduled_date: "2026-05-20", time: "08:45", title: "Morning Walk",             type: "outdoor",  done: false, active: false, notes: "35 min, relaxed pace. Save energy for playdate social engagement." },
    { id: "m20c", child_id: CHILD_ID, scheduled_date: "2026-05-20", time: "10:00", title: "Morning Snack",            type: "meal",     done: false, active: false, notes: "Rice cakes + banana. Blue cup." },
    { id: "m20d", child_id: CHILD_ID, scheduled_date: "2026-05-20", time: "10:15", title: "Solo Block Play",          type: "play",     done: false, active: false, notes: "Pre-playdate warm-up. 15 min independent blocks before Oliver arrives — arrives settled and centred." },
    { id: "m20e", child_id: CHILD_ID, scheduled_date: "2026-05-20", time: "11:00", title: "Oliver Playdate — Sandbox", type: "play",   done: false, active: false, notes: "Let Mateo find his own way in. Last session: unprompted bucket share (May 6), direct block offer (May 12). Watch for the next step." },
    { id: "m20f", child_id: CHILD_ID, scheduled_date: "2026-05-20", time: "12:30", title: "Lunch",                    type: "meal",     done: false, active: false, notes: "Later lunch — playdate ran to 12:15. Good appetite expected." },
    { id: "m20g", child_id: CHILD_ID, scheduled_date: "2026-05-20", time: "13:15", title: "Nap",                      type: "nap",      done: false, active: false, notes: "Slightly shifted. Social engagement is tiring even when it goes well — protect this nap." },
    { id: "m20h", child_id: CHILD_ID, scheduled_date: "2026-05-20", time: "15:00", title: "Afternoon Snack",          type: "meal",     done: false, active: false, notes: "Yogurt + berries. Post-nap solo buffer before any re-engagement." },
    { id: "m20i", child_id: CHILD_ID, scheduled_date: "2026-05-20", time: "15:30", title: "Bubble Wands",             type: "outdoor",  done: false, active: false, notes: "Post-playdate outdoor close. Light, visual, regulation. Natural 'more' context — he'll use it here." },

    // May 14 (Wednesday) — milestone day ─────────────────────────────────────
    { id: "s2",   child_id: CHILD_ID, scheduled_date: "2026-05-14", time: "09:00", title: "Park — Slide",             type: "outdoor",  done: true,  active: false, notes: "Big slide focus. First solo descent — said 'more' immediately after. Went four more times." },
    { id: "s4",   child_id: CHILD_ID, scheduled_date: "2026-05-14", time: "10:30", title: "Rice Sensory Bin",         type: "play",     done: true,  active: false, notes: "Safari animals in the rice bin. 28 uninterrupted minutes — strong independent play window." },
    { id: "s5",   child_id: CHILD_ID, scheduled_date: "2026-05-14", time: "12:00", title: "Lunch",                    type: "meal",     done: true,  active: false, notes: "Pushed to 12:20 — sensory bin ran long. Right call. He came to lunch naturally." },
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 7 — Realism & Interactions
// ═══════════════════════════════════════════════════════════════════════════════

async function seedMemoryReactions() {
  await upsert("memory_reactions", [

    // ── Reactions on memory_events ────────────────────────────────────────────

    // r2 — "Said 'more' — first functional word"
    { id: "rxn-01", target_type: "memory_event", target_id: "r2",  emoji: "❤️",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-14T10:18:00+00:00" },
    { id: "rxn-02", target_type: "memory_event", target_id: "r2",  emoji: "🥹",  author_type: "parent", author_name: "Marco", created_at: "2026-05-14T10:50:00+00:00" },

    // r1 — First solo slide photo
    { id: "rxn-03", target_type: "memory_event", target_id: "r1",  emoji: "🌟",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-14T10:20:00+00:00" },
    { id: "rxn-04", target_type: "memory_event", target_id: "r1",  emoji: "👏",  author_type: "parent", author_name: "Marco", created_at: "2026-05-14T11:00:00+00:00" },

    // r5 — Staircase milestone
    { id: "rxn-05", target_type: "memory_event", target_id: "r5",  emoji: "🥹",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-13T16:00:00+00:00" },
    { id: "rxn-06", target_type: "memory_event", target_id: "r5",  emoji: "👏",  author_type: "parent", author_name: "Marco", created_at: "2026-05-13T19:15:00+00:00" },

    // r6 — Water table photo
    { id: "rxn-07", target_type: "memory_event", target_id: "r6",  emoji: "❤️",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-13T16:30:00+00:00" },

    // r19 — Splash pad debut
    { id: "rxn-08", target_type: "memory_event", target_id: "r19", emoji: "🌟",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-08T14:00:00+00:00" },
    { id: "rxn-09", target_type: "memory_event", target_id: "r19", emoji: "❤️",  author_type: "parent", author_name: "Marco", created_at: "2026-05-08T19:45:00+00:00" },

    // r17 — First clapping on cue
    { id: "rxn-10", target_type: "memory_event", target_id: "r17", emoji: "👏",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-09T14:00:00+00:00" },
    { id: "rxn-11", target_type: "memory_event", target_id: "r17", emoji: "👏",  author_type: "parent", author_name: "Marco", created_at: "2026-05-09T19:00:00+00:00" },

    // r24 — Oliver sandbox sharing
    { id: "rxn-12", target_type: "memory_event", target_id: "r24", emoji: "❤️",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-06T18:00:00+00:00" },

    // r27 — First chalk scribble milestone
    { id: "rxn-13", target_type: "memory_event", target_id: "r27", emoji: "🌟",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-05T16:30:00+00:00" },
    { id: "rxn-14", target_type: "memory_event", target_id: "r27", emoji: "👏",  author_type: "parent", author_name: "Marco", created_at: "2026-05-05T19:00:00+00:00" },

    // r13 — First social wave
    { id: "rxn-15", target_type: "memory_event", target_id: "r13", emoji: "🥹",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-11T18:00:00+00:00" },

    // ── Reactions on journal_entries ──────────────────────────────────────────

    // j01 — Elena's "He said it. Clear as anything."
    { id: "rxn-16", target_type: "journal_entry", target_id: "j01", emoji: "❤️",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-14T10:30:00+00:00" },
    { id: "rxn-17", target_type: "journal_entry", target_id: "j01", emoji: "🥹",  author_type: "parent", author_name: "Marco", created_at: "2026-05-14T11:05:00+00:00" },

    // j04 — Elena's stairs entry
    { id: "rxn-18", target_type: "journal_entry", target_id: "j04", emoji: "🥹",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-13T16:08:00+00:00" },
    { id: "rxn-19", target_type: "journal_entry", target_id: "j04", emoji: "👏",  author_type: "parent", author_name: "Marco", created_at: "2026-05-13T19:20:00+00:00" },

    // j09 — Sofia's Sunday pancakes entry
    { id: "rxn-20", target_type: "journal_entry", target_id: "j09", emoji: "❤️",  author_type: "parent", author_name: "Marco", created_at: "2026-05-10T20:10:00+00:00" },

    // j11 — Elena's splash pad entry
    { id: "rxn-21", target_type: "journal_entry", target_id: "j11", emoji: "🌟",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-08T14:30:00+00:00" },
    { id: "rxn-22", target_type: "journal_entry", target_id: "j11", emoji: "❤️",  author_type: "parent", author_name: "Marco", created_at: "2026-05-08T19:45:00+00:00" },

    // j17 — Elena's library reading mat entry
    { id: "rxn-23", target_type: "journal_entry", target_id: "j17", emoji: "🥹",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-02T11:45:00+00:00" },
    { id: "rxn-24", target_type: "journal_entry", target_id: "j17", emoji: "❤️",  author_type: "parent", author_name: "Marco", created_at: "2026-05-02T14:10:00+00:00" },

    // j16 — Elena's "Not every day is a highlight reel"
    { id: "rxn-25", target_type: "journal_entry", target_id: "j16", emoji: "❤️",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-04T17:30:00+00:00" },

    // ── Reactions on ai_summaries ─────────────────────────────────────────────

    // as14 — May 14 "Two milestones before 11am"
    { id: "rxn-26", target_type: "ai_summary",    target_id: "as14", emoji: "❤️",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-14T19:00:00+00:00" },
    { id: "rxn-27", target_type: "ai_summary",    target_id: "as14", emoji: "👏",  author_type: "parent", author_name: "Marco", created_at: "2026-05-14T19:10:00+00:00" },

    // as1 — May 13 "A breakthrough day"
    { id: "rxn-28", target_type: "ai_summary",    target_id: "as1",  emoji: "🥹",  author_type: "parent", author_name: "Sofia", created_at: "2026-05-13T21:00:00+00:00" },

  ]);
}

async function seedThreadedReplies() {
  await upsert("threaded_replies", [

    // ── Thread: j01 — Elena's "He said it. Clear as anything." ───────────────

    {
      id: "tr-01", target_type: "journal_entry", target_id: "j01",
      body: "I watched this video four times before I went back into the meeting. I'm still not over it.",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-14T10:35:00+00:00",
    },
    {
      id: "tr-02", target_type: "journal_entry", target_id: "j01",
      body: "We are framing that video. Not negotiable. 🏆",
      author_type: "parent", author_name: "Marco",
      created_at: "2026-05-14T11:02:00+00:00",
    },
    {
      id: "tr-03", target_type: "journal_entry", target_id: "j01",
      body: "He went down four more times after I texted you. Each time a little more confident. By the last one he was saying 'more' before he even reached the bottom.",
      author_type: "nanny", author_name: "Elena",
      created_at: "2026-05-14T11:18:00+00:00",
    },
    {
      id: "tr-04", target_type: "journal_entry", target_id: "j01",
      body: "Elena — thank you for texting right away. Thank you for being there for this one.",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-14T11:45:00+00:00",
    },

    // ── Thread: j04 — Elena's stairs milestone entry ─────────────────────────

    {
      id: "tr-05", target_type: "journal_entry", target_id: "j04",
      body: "I love that you texted me right away. Please never stop doing that. I stepped out of a presentation for that text and I would do it again every time.",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-13T16:10:00+00:00",
    },
    {
      id: "tr-06", target_type: "journal_entry", target_id: "j04",
      body: "He walked me up the first two steps when I got home and looked extremely pleased about it. I played it very cool. I was not cool.",
      author_type: "parent", author_name: "Marco",
      created_at: "2026-05-13T19:30:00+00:00",
    },
    {
      id: "tr-07", target_type: "journal_entry", target_id: "j04",
      body: "That's exactly right — letting him initiate the demonstration was the correct move. He's going to want to show everyone he meets for the next week. Let him.",
      author_type: "nanny", author_name: "Elena",
      created_at: "2026-05-14T08:45:00+00:00",
    },

    // ── Thread: r2 — "said 'more' for the first time" memory event ────────────

    {
      id: "tr-08", target_type: "memory_event", target_id: "r2",
      body: "THE WORD. FIRST WORD. 🌟🌟🌟",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-14T10:18:00+00:00",
    },
    {
      id: "tr-09", target_type: "memory_event", target_id: "r2",
      body: "Ok so I definitely didn't get a little emotional at my desk. That is not what happened.",
      author_type: "parent", author_name: "Marco",
      created_at: "2026-05-14T10:52:00+00:00",
    },

    // ── Thread: hn-13 — Sweet potato handoff note ─────────────────────────────

    {
      id: "tr-10", target_type: "household_note", target_id: "hn-13",
      body: "Trying it at dinner tonight. Same firmness. Will report back.",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-06T18:00:00+00:00",
    },
    {
      id: "tr-11", target_type: "household_note", target_id: "hn-13",
      body: "Perfect. One or two cubes next to something he already knows. Don't make a moment of it — just let it be there.",
      author_type: "nanny", author_name: "Elena",
      created_at: "2026-05-07T08:30:00+00:00",
    },
    {
      id: "tr-12", target_type: "household_note", target_id: "hn-13",
      body: "He had three bites. THREE. Elena you were right about the texture. You are always right.",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-07T19:05:00+00:00",
    },
    {
      id: "tr-13", target_type: "household_note", target_id: "hn-13",
      body: "🌟 Keep offering it. Consistency is doing most of the work. He's building trust with the food.",
      author_type: "nanny", author_name: "Elena",
      created_at: "2026-05-08T08:15:00+00:00",
    },

    // ── Thread: hn-03 — "more" reinforcement tip note ─────────────────────────

    {
      id: "tr-14", target_type: "household_note", target_id: "hn-03",
      body: "We did this at dinner. He said it twice — once for more food and once pointing at Marco's phone because he wanted to watch the slide video again. 😭",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-14T20:30:00+00:00",
    },
    {
      id: "tr-15", target_type: "household_note", target_id: "hn-03",
      body: "Functional use across two completely different contexts on day one. That's exactly what you want to see. He's got this word now.",
      author_type: "nanny", author_name: "Elena",
      created_at: "2026-05-15T08:30:00+00:00",
    },

    // ── Thread: j09 — Sofia's Sunday pancakes entry ────────────────────────────

    {
      id: "tr-16", target_type: "journal_entry", target_id: "j09",
      body: "The syrup nose photo is in my top five photos of my entire life. My actual all-time top five.",
      author_type: "parent", author_name: "Marco",
      created_at: "2026-05-10T20:15:00+00:00",
    },
    {
      id: "tr-17", target_type: "journal_entry", target_id: "j09",
      body: "He came in on Monday so settled and ready. Whatever Sunday was — it worked perfectly.",
      author_type: "nanny", author_name: "Elena",
      created_at: "2026-05-11T08:15:00+00:00",
    },

    // ── Thread: j17 — Elena's library reading mat entry ───────────────────────

    {
      id: "tr-18", target_type: "journal_entry", target_id: "j17",
      body: "He walked straight to the mat. Like he owned the place. I don't have words. I love him so much.",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-02T12:00:00+00:00",
    },
    {
      id: "tr-19", target_type: "journal_entry", target_id: "j17",
      body: "Nine years doing this and she still writes about the moments that stay with her. That's the bar.",
      author_type: "parent", author_name: "Marco",
      created_at: "2026-05-02T14:05:00+00:00",
    },
    {
      id: "tr-20", target_type: "journal_entry", target_id: "j17",
      body: "It was one of those mornings. I'm glad I wrote it down.",
      author_type: "nanny", author_name: "Elena",
      created_at: "2026-05-02T15:30:00+00:00",
    },

    // ── Thread: j16 — Elena's "honest Monday" entry ────────────────────────────

    {
      id: "tr-21", target_type: "journal_entry", target_id: "j16",
      body: "Thank you for writing the hard days too. It makes the whole picture real. We see everything you're doing.",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-04T17:30:00+00:00",
    },
    {
      id: "tr-22", target_type: "journal_entry", target_id: "j16",
      body: "The reset walk at 3:30 is going in the playbook. Good instinct.",
      author_type: "parent", author_name: "Marco",
      created_at: "2026-05-04T19:00:00+00:00",
    },

    // ── Thread: as14 — May 14 AI summary ──────────────────────────────────────

    {
      id: "tr-23", target_type: "ai_summary", target_id: "as14",
      body: "Two milestones before 11am. I need a minute.",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-14T19:00:00+00:00",
    },
    {
      id: "tr-24", target_type: "ai_summary", target_id: "as14",
      body: "Casually the best Thursday.",
      author_type: "parent", author_name: "Marco",
      created_at: "2026-05-14T19:12:00+00:00",
    },

    // ── Thread: ai-01 — outdoor walks → naps insight ───────────────────────────

    {
      id: "tr-25", target_type: "ai_insight", target_id: "ai-01",
      body: "This confirms what I suspected. Even on the mornings I'm tempted to skip it — we shouldn't. Saving this one.",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-14T18:45:00+00:00",
    },
    {
      id: "tr-26", target_type: "ai_insight", target_id: "ai-01",
      body: "Shared with Marco. We're aligned. The morning walk is protected.",
      author_type: "parent", author_name: "Sofia",
      created_at: "2026-05-14T19:05:00+00:00",
    },

    // ── Thread: j08 — Sofia's "He waved. All by himself." entry ───────────────

    {
      id: "tr-27", target_type: "journal_entry", target_id: "j08",
      body: "I do the hallway thing too. Every single night. I thought it was just me.",
      author_type: "parent", author_name: "Marco",
      created_at: "2026-05-11T21:15:00+00:00",
    },
    {
      id: "tr-28", target_type: "journal_entry", target_id: "j08",
      body: "The hallway thing is the right thing. That's where the day lands.",
      author_type: "nanny", author_name: "Elena",
      created_at: "2026-05-12T08:15:00+00:00",
    },

  ]);
}

async function seedActivityCompletions() {
  await upsert("activity_completions", [

    // ── May 12 ────────────────────────────────────────────────────────────────

    {
      id: "ac-m12b",
      schedule_item_id: "m12b",
      child_id: CHILD_ID,
      completion_date: "2026-05-12",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 50,
      energy_level_actual: "high",
      mood_before: "curious",
      mood_after: "bright, engaged",
      notes: "Ran 5min longer than planned — he was deep in the flower stall moment. Worth it. One vendor gave him a blueberry. He held it for a full minute before eating it.",
      logged_by: "nanny",
      created_at: "2026-05-12T09:40:00+00:00",
    },
    {
      id: "ac-m12d",
      schedule_item_id: "m12d",
      child_id: CHILD_ID,
      completion_date: "2026-05-12",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 22,
      energy_level_actual: "medium",
      mood_before: "focused",
      mood_after: "very satisfied",
      notes: "Six-block tower — new personal best. The sixth block went on with both hands, maximum concentration. He looked at me before knocking it down. He wanted to make sure I'd seen.",
      logged_by: "nanny",
      created_at: "2026-05-12T10:55:00+00:00",
    },
    {
      id: "ac-m12h",
      schedule_item_id: "m12h",
      child_id: CHILD_ID,
      completion_date: "2026-05-12",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 65,
      energy_level_actual: "medium",
      mood_before: "neutral",
      mood_after: "happy, social",
      notes: "Oliver visit ran longer than planned — both settled into a groove. The block-offering moment happened at about 45min in. I didn't intervene. Glad I didn't.",
      logged_by: "nanny",
      created_at: "2026-05-12T16:40:00+00:00",
    },

    // ── May 13 ────────────────────────────────────────────────────────────────

    {
      id: "ac-m13b",
      schedule_item_id: "m13b",
      child_id: CHILD_ID,
      completion_date: "2026-05-13",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 42,
      energy_level_actual: "medium",
      mood_before: "calm",
      mood_after: "alert, energized",
      notes: "Three dogs spotted — pointed at each one with strong joint attention. Held the pointing posture until I named each dog. This is the clearest language-requesting behavior I've seen consistently.",
      logged_by: "nanny",
      created_at: "2026-05-13T09:15:00+00:00",
    },
    {
      id: "ac-m13d",
      schedule_item_id: "m13d",
      child_id: CHILD_ID,
      completion_date: "2026-05-13",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 40,
      energy_level_actual: "high",
      mood_before: "eager",
      mood_after: "regulated, calm",
      notes: "Water table ran 5min over — he was in full flow state. Ended naturally when he stepped back and looked satisfied. That's the cue. The sensory regulation afterward was palpable.",
      logged_by: "nanny",
      created_at: "2026-05-13T10:45:00+00:00",
    },
    {
      id: "ac-m13f",
      schedule_item_id: "m13f",
      child_id: CHILD_ID,
      completion_date: "2026-05-13",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 105,
      energy_level_actual: "low",
      mood_before: "sleepy, content",
      mood_after: "glowing",
      notes: "Best nap of the month — 1h 45min. White noise + blackout. Woke up in a completely different state than he went down. The staircase climb in the morning and water table used everything he had.",
      logged_by: "nanny",
      created_at: "2026-05-13T14:30:00+00:00",
    },
    {
      id: "ac-m13h",
      schedule_item_id: "m13h",
      child_id: CHILD_ID,
      completion_date: "2026-05-13",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 18,
      energy_level_actual: "high",
      mood_before: "adventurous",
      mood_after: "triumphant",
      notes: "He initiated it — I didn't prompt. Walked to the bottom, studied it for a moment, both hands on the rail, and went. All eleven stairs. Turned around at the top. That look — I'll write about it properly later. Climbed it three more times before moving on.",
      logged_by: "nanny",
      created_at: "2026-05-13T15:50:00+00:00",
    },

    // ── May 14 ────────────────────────────────────────────────────────────────

    {
      id: "ac-s2",
      schedule_item_id: "s2",
      child_id: CHILD_ID,
      completion_date: "2026-05-14",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 50,
      energy_level_actual: "high",
      mood_before: "happy",
      mood_after: "elated",
      notes: "First solo slide descent at 9:47am. Said 'more' immediately after. Went four more times. Language and gross motor milestone in the same session. Texted Sofia immediately.",
      logged_by: "nanny",
      created_at: "2026-05-14T10:05:00+00:00",
    },
    {
      id: "ac-s4",
      schedule_item_id: "s4",
      child_id: CHILD_ID,
      completion_date: "2026-05-14",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 28,
      energy_level_actual: "medium",
      mood_before: "focused",
      mood_after: "calm, content",
      notes: "Rice bin with safari animals — 28 uninterrupted minutes. He found a groove and stayed in it. Good independent play window. Let it run to its natural close.",
      logged_by: "nanny",
      created_at: "2026-05-14T11:02:00+00:00",
    },
    {
      id: "ac-s5",
      schedule_item_id: "s5",
      child_id: CHILD_ID,
      completion_date: "2026-05-14",
      status: "replaced",
      replaced_with: "Lunch at 12:20 (pushed 20 min)",
      duration_actual_min: 18,
      energy_level_actual: "medium",
      mood_before: "still engaged with sensory bin",
      mood_after: "satisfied",
      notes: "Sensory bin ran long — he was deep in it at noon. Pushed lunch to 12:20 rather than interrupt the focus state. Right call. He came to lunch naturally when he was ready.",
      logged_by: "nanny",
      created_at: "2026-05-14T12:40:00+00:00",
    },

    // ── May 15 ────────────────────────────────────────────────────────────────

    {
      id: "ac-m15b",
      schedule_item_id: "m15b",
      child_id: CHILD_ID,
      completion_date: "2026-05-15",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 55,
      energy_level_actual: "high",
      mood_before: "bright, eager",
      mood_after: "proud, spent",
      notes: "Slide × 7 — he counted them himself in his own way, looking at me after each one. Said 'more' each time before going up again. I just kept confirming: 'more slide?' and waiting for it. He's using the word consistently across contexts now.",
      logged_by: "nanny",
      created_at: "2026-05-15T09:45:00+00:00",
    },
    {
      id: "ac-m15d",
      schedule_item_id: "m15d",
      child_id: CHILD_ID,
      completion_date: "2026-05-15",
      status: "replaced",
      replaced_with: "Bubble wands on the back patio",
      duration_actual_min: 30,
      energy_level_actual: "medium",
      mood_before: "curious",
      mood_after: "calm, giggly",
      notes: "Water table was set up and ready — he walked past it to the bubble wands Sofia had left on the patio table. Followed his lead. He watched each bubble float and pop with the same concentration he gives the sensory bin. Different material, same quality of attention.",
      logged_by: "nanny",
      created_at: "2026-05-15T11:05:00+00:00",
    },
    {
      id: "ac-m15h",
      schedule_item_id: "m15h",
      child_id: CHILD_ID,
      completion_date: "2026-05-15",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 18,
      energy_level_actual: "medium",
      mood_before: "alert",
      mood_after: "satisfied, quiet",
      notes: "Best naming session yet — 11 objects, patient between each one. He used 'more' twice unprompted: once pointing at the window wanting to go back outside, once asking for more of the naming game itself. Cross-domain word use on day two.",
      logged_by: "nanny",
      created_at: "2026-05-15T15:22:00+00:00",
    },

    // ── May 16 ────────────────────────────────────────────────────────────────

    {
      id: "ac-m16d",
      schedule_item_id: "m16d",
      child_id: CHILD_ID,
      completion_date: "2026-05-16",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 65,
      energy_level_actual: "medium",
      mood_before: "curious",
      mood_after: "full, settled",
      notes: "Arrived 8 minutes early — he walked directly to the reading mat. Puppet show featured a dog. He pointed at it and held the point until I said 'dog.' He nodded. Completely serious. The whole room felt it.",
      logged_by: "nanny",
      created_at: "2026-05-16T11:10:00+00:00",
    },
    {
      id: "ac-m16e",
      schedule_item_id: "m16e",
      child_id: CHILD_ID,
      completion_date: "2026-05-16",
      status: "skipped",
      replaced_with: null,
      duration_actual_min: null,
      energy_level_actual: null,
      mood_before: "post-library calm",
      mood_after: null,
      notes: "He fell asleep in the carrier on the walk home from the library — 11:45am. Transferred him to the crib and he didn't stir. Sometimes the schedule skips itself. The post-library outdoor was not going to improve on this.",
      logged_by: "nanny",
      created_at: "2026-05-16T11:50:00+00:00",
    },
    {
      id: "ac-m16g",
      schedule_item_id: "m16g",
      child_id: CHILD_ID,
      completion_date: "2026-05-16",
      status: "completed",
      replaced_with: null,
      duration_actual_min: 110,
      energy_level_actual: "low",
      mood_before: "already asleep",
      mood_after: "rested, warm",
      notes: "Fell asleep in carrier at 11:45 — transferred perfectly at 11:52. Slept until 1:42pm. 110 minutes. Best nap of the month, overtaking May 13. Library Saturdays are consistently producing the longest sleep.",
      logged_by: "nanny",
      created_at: "2026-05-16T14:00:00+00:00",
    },

  ]);
}

async function seedVoiceNotes() {
  await upsert("voice_notes", [

    {
      id: "vn-01",
      child_id: CHILD_ID,
      target_type: "memory_event",
      target_id: "r2",
      duration_sec: 22,
      storage_url: "voice-notes/placeholder/vn-01.m4a",
      transcript: `He just said "more" — clear as anything, looking right at me. We're at the park. He came down the slide, I said "more?" and he just — said it back. I'm trying not to scream. You can hear the slide in the background. Okay. He wants to go again.`,
      author_type: "nanny",
      author_name: "Elena",
      created_at: "2026-05-14T09:51:00+00:00",
    },

    {
      id: "vn-02",
      child_id: CHILD_ID,
      target_type: "journal_entry",
      target_id: "j04",
      duration_sec: 48,
      storage_url: "voice-notes/placeholder/vn-02.m4a",
      transcript: `So he's been eyeing the staircase for weeks. Just standing at the bottom and looking. And today — I don't know what was different — he walked to the bottom and started climbing. Both hands on the rail. One step at a time. All the way to the top. I didn't say anything. He turned around at the top and looked at me and — there was just this look on his face. He knew exactly what he'd done. He came down on his bottom, which is correct. Then he turned around and climbed it again.`,
      author_type: "nanny",
      author_name: "Elena",
      created_at: "2026-05-13T15:58:00+00:00",
    },

    {
      id: "vn-03",
      child_id: CHILD_ID,
      target_type: "memory_event",
      target_id: "r10",
      duration_sec: 18,
      storage_url: "voice-notes/placeholder/vn-03.m4a",
      transcript: `Block tower record — six high. He placed the last one with both hands, this incredible concentration. Then he looked at me like — "are you witnessing this?" And then knocked it down on purpose. He really committed to the knockdown. It was art.`,
      author_type: "nanny",
      author_name: "Elena",
      created_at: "2026-05-12T11:05:00+00:00",
    },

    {
      id: "vn-04",
      child_id: CHILD_ID,
      target_type: "memory_event",
      target_id: "r19",
      duration_sec: 32,
      storage_url: "voice-notes/placeholder/vn-04.m4a",
      transcript: `Okay so we're at the splash pad and he did four seconds of looking at it and then — he ran. Like actually ran. Arms going. Ran directly into the biggest sprinkler. Got completely soaked. Blinked three times. Grinned. Then did it again. Sun hat is still a negotiation in progress. I have one hand on the hat and one on the camera. Stand by for updates.`,
      author_type: "nanny",
      author_name: "Elena",
      created_at: "2026-05-08T11:12:00+00:00",
    },

    {
      id: "vn-05",
      child_id: CHILD_ID,
      target_type: "standalone",
      target_id: null,
      duration_sec: 21,
      storage_url: "voice-notes/placeholder/vn-05.m4a",
      transcript: `Elena just texted about the sweet potato — six bites. Six! I'm in the car. We've been offering that for three weeks. Six bites, no face, no resistance. I'm going to steam some tonight and just put it on the plate like it's always been there. Okay. I need to drive. Goodnight.`,
      author_type: "parent",
      author_name: "Sofia",
      created_at: "2026-05-06T18:10:00+00:00",
    },

    {
      id: "vn-06",
      child_id: CHILD_ID,
      target_type: "journal_entry",
      target_id: "j08",
      duration_sec: 30,
      storage_url: "voice-notes/placeholder/vn-06.m4a",
      transcript: `I've been sitting here for ten minutes since reading Elena's handoff note about the wave. An unprompted social acknowledgement. He didn't need to be told. He just — decided to greet someone. He's building a social world of his own. I don't know what I thought it was going to feel like when these things started happening. It's like this. It feels exactly like this.`,
      author_type: "parent",
      author_name: "Sofia",
      created_at: "2026-05-11T21:05:00+00:00",
    },

  ]);
}

async function seedApprovalRequests() {
  await upsert("approval_requests", [

    {
      id: "apr-01",
      child_id: CHILD_ID,
      request_type: "schedule-shift",
      body: "Planning to let the sensory bin run past the usual 11am cutoff tomorrow if he's in a focus groove — would push lunch to 12:20 instead of 12:00. Worth protecting the concentration window when it opens. Just wanted to flag rather than decide unilaterally.",
      requested_by: "Elena",
      requested_by_type: "nanny",
      status: "approved",
      response_body: "Approved — completely trust your read on this. Let him stay in it.",
      responded_by: "Sofia",
      created_at: "2026-05-13T16:30:00+00:00",
      responded_at: "2026-05-13T17:00:00+00:00",
    },

    {
      id: "apr-02",
      child_id: CHILD_ID,
      request_type: "food-introduction",
      body: "Quick process question: do you want me to flag each new fruit introduction in advance, or can I lead on those and just note it in the daily log? I'm thinking mango again this week and want to know where the line is.",
      requested_by: "Elena",
      requested_by_type: "nanny",
      status: "approved",
      response_body: "Please lead on fruit — just note it in the log. No need to ask in advance. Allergies to watch list is in the profile. Anything outside of that, your judgment.",
      responded_by: "Sofia",
      created_at: "2026-05-11T17:30:00+00:00",
      responded_at: "2026-05-11T19:00:00+00:00",
    },

    {
      id: "apr-03",
      child_id: CHILD_ID,
      request_type: "milestone-confirm",
      body: "Flagging the staircase climb as an official gross motor milestone — all eleven stairs, unassisted, both hands on rail, May 13. I've documented it in the journal entry. Can you both confirm it from your end so it registers in his developmental record?",
      requested_by: "Elena",
      requested_by_type: "nanny",
      status: "approved",
      response_body: "Confirmed and marked. May 13. Thank you for the real-time text — stepping out of that presentation was the right call and I'd do it again.",
      responded_by: "Sofia",
      created_at: "2026-05-13T15:55:00+00:00",
      responded_at: "2026-05-13T17:15:00+00:00",
    },

    {
      id: "apr-04",
      child_id: CHILD_ID,
      request_type: "milestone-confirm",
      body: "Flagging 'more' as Mateo's first confirmed functional word. Used spontaneously, in context, back-to-back on the slide, May 14 at approximately 9:47am. Used again at snack (10:15) unprompted. Requesting milestone confirmation for his language record.",
      requested_by: "Elena",
      requested_by_type: "nanny",
      status: "approved",
      response_body: "'More' — May 14, 2026. Confirmed. 🌟 Thank you for everything today. Genuinely.",
      responded_by: "Sofia",
      created_at: "2026-05-14T10:35:00+00:00",
      responded_at: "2026-05-14T20:30:00+00:00",
    },

    {
      id: "apr-05",
      child_id: CHILD_ID,
      request_type: "schedule-shift",
      body: "Would love to be home by 3:30 on Thursday (May 14). Any chance we could shift the afternoon reading time to 4pm so I can be there for it? First time I've been able to make a weekday activity in a while.",
      requested_by: "Marco",
      requested_by_type: "parent",
      status: "approved",
      response_body: "Absolutely — I'll plan a quiet outdoor wind-down at 3:15 to keep him calm before you arrive. Reading at 4pm works perfectly. See you then.",
      responded_by: "Elena",
      created_at: "2026-05-13T20:00:00+00:00",
      responded_at: "2026-05-14T08:15:00+00:00",
    },

    {
      id: "apr-06",
      child_id: CHILD_ID,
      request_type: "activity-change",
      body: "Can we swap the May 16 post-library outdoor (bubble wands) for a walk to the little garden on Elm instead? He was completely absorbed by the flowers at the farmer's market — want to see if the connection carries over to a garden setting.",
      requested_by: "Sofia",
      requested_by_type: "parent",
      status: "approved",
      response_body: "Love this idea. The Elm garden is perfect — we'll arrive right in his language window and can name everything. I'll bring a few prompts. See you for pickup.",
      responded_by: "Elena",
      created_at: "2026-05-15T21:00:00+00:00",
      responded_at: "2026-05-16T07:45:00+00:00",
    },

  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 6 — AI Insights & Developmental Intelligence
// ═══════════════════════════════════════════════════════════════════════════════

async function seedAiInsights() {
  await upsert("ai_insights", [

    // ── Patterns ──────────────────────────────────────────────────────────────

    {
      id: "ai-01",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "pattern",
      title: "Morning walks are connected to longer afternoon naps",
      body: "Over the past two weeks, days that include a morning outdoor walk tend to produce nap durations that are 20–35 minutes longer than days without one. It's not a guarantee, but the pattern is consistent enough to notice. Protecting the outdoor morning window — even a short one — seems worth it.",
      confidence: "well-established",
      data_window_days: 14,
      tags: ["sleep", "outdoor", "nap", "pattern"],
      source_types: ["schedule_items", "journal_entries", "household_notes"],
      is_dismissed: false,
      is_saved: true,
      created_at: "2026-05-14T18:00:00+00:00",
    },

    {
      id: "ai-02",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "pattern",
      title: "Mondays work best with a softer start",
      body: "The two Mondays this month played out very differently: May 4 was overtired and fussier, May 11 was smooth and well-paced. The variable that seems to matter most is how much downtime he got over the weekend. A gentler Sunday pace and a slower Monday morning — a bit more holding, less structured activity early — tends to produce a much easier re-entry into the week.",
      confidence: "consistent",
      data_window_days: 10,
      tags: ["monday", "rhythm", "weekend", "mood"],
      source_types: ["journal_entries", "household_notes"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:01:00+00:00",
    },

    // ── Correlations ──────────────────────────────────────────────────────────

    {
      id: "ai-03",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "correlation",
      title: "Sensory play tends to settle him for what comes next",
      body: "On days with a meaningful sensory session — dried beans, water table, rice bin — the afternoon tends to be noticeably calmer. Not every time, but consistently enough to be worth planning around. It seems like the deep tactile engagement uses up something that would otherwise stay restless through the quieter parts of the day.",
      confidence: "consistent",
      data_window_days: 12,
      tags: ["sensory", "mood", "calm", "afternoon"],
      source_types: ["journal_entries", "schedule_items"],
      is_dismissed: false,
      is_saved: true,
      created_at: "2026-05-14T18:02:00+00:00",
    },

    {
      id: "ai-04",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "correlation",
      title: "Library mornings tend to be followed by stronger appetite at lunch",
      body: "Both Saturday library visits ended with Elena noting that he ate everything at lunch — more than on typical days. It could be timing, but it also fits with the idea that focused cognitive engagement uses energy in its own way. Library mornings seem to prime him for a good midday meal.",
      confidence: "emerging",
      data_window_days: 8,
      tags: ["library", "appetite", "meal", "learning"],
      source_types: ["journal_entries", "memory_events"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:03:00+00:00",
    },

    {
      id: "ai-05",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "correlation",
      title: "Playdates with Oliver are followed by more focused independent play",
      body: "After both Oliver visits, Mateo settled into noticeably longer independent play than on other afternoons — blocks, books, stacking rings. Social engagement seems to sharpen his concentration afterward rather than deplete it. The Tuesday rhythm of outdoor or sensory play in the morning and Oliver in the afternoon appears to be working well for him.",
      confidence: "emerging",
      data_window_days: 8,
      tags: ["social", "independent-play", "focus", "oliver"],
      source_types: ["journal_entries", "memory_events"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:04:00+00:00",
    },

    {
      id: "ai-06",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "correlation",
      title: "Physical and cognitive activity both drive stronger appetite",
      body: "High-output days — the splash pad, farmer's market, library — consistently produce better meal appetite. It's not only the outdoor ones; the library puppet show morning produced one of the best lunches of the month. Scheduling the main meal after a meaningful morning activity, rather than before, tends to mean less resistance at the table.",
      confidence: "consistent",
      data_window_days: 14,
      tags: ["feeding", "appetite", "activity", "meal-timing"],
      source_types: ["journal_entries", "memory_events", "schedule_items"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:05:00+00:00",
    },

    // ── Developmental observations ─────────────────────────────────────────────

    {
      id: "ai-07",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "developmental-observation",
      title: "Gross motor development has moved quickly this month",
      body: "In the past 14 days: confident on the short ramp, a running gait at the splash pad, and the full staircase climbed unassisted. These aren't separate moments — they're part of the same trajectory. Mateo seems to be in an active gross motor growth period right now, and access to climbing, running, and varied terrain is clearly fueling it.",
      confidence: "well-established",
      data_window_days: 14,
      tags: ["gross-motor", "milestone", "development", "movement"],
      source_types: ["journal_entries", "memory_events", "schedule_items"],
      is_dismissed: false,
      is_saved: true,
      created_at: "2026-05-14T18:06:00+00:00",
    },

    {
      id: "ai-08",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "developmental-observation",
      title: "Fine motor precision is building steadily across different materials",
      body: "Block towers have gone from 3 to 6 high. Ring stacking has progressed through all 7 sizes. He picked up chalk and held it with a finger grip on the second try. These aren't coincidental — fine motor skills tend to develop together, and working across different materials and resistance levels seems to be broadening the progress.",
      confidence: "consistent",
      data_window_days: 14,
      tags: ["fine-motor", "development", "precision", "hands"],
      source_types: ["journal_entries", "memory_events"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:07:00+00:00",
    },

    {
      id: "ai-09",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "developmental-observation",
      title: "Social awareness is developing in a clear, unhurried sequence",
      body: "May started with parallel play alongside Oliver and ended with unprompted sharing, eye contact during play, and a spontaneous wave to a stranger. That's a meaningful arc across two weeks. The library group moment on May 9 — following a crowd cue to point — fits the same picture. He's not just near other people anymore; he's starting to engage with them on purpose.",
      confidence: "consistent",
      data_window_days: 14,
      tags: ["social", "development", "play", "awareness", "peers"],
      source_types: ["journal_entries", "memory_events"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:08:00+00:00",
    },

    {
      id: "ai-10",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "developmental-observation",
      title: "Spatial memory is forming — familiar places are becoming known places",
      body: "Walking straight to the library reading mat on the second visit — a week after the first — without any prompting is a clear sign of spatial memory consolidating. He's also been reaching for his jacket before outings are mentioned, which fits the same picture. Familiar routines and places are starting to have a structure in his mind that he can anticipate and navigate.",
      confidence: "consistent",
      data_window_days: 14,
      tags: ["spatial-memory", "cognitive", "routine", "development"],
      source_types: ["journal_entries", "memory_events"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:09:00+00:00",
    },

    // ── Language ──────────────────────────────────────────────────────────────

    {
      id: "ai-11",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "language",
      title: "Language curiosity tends to peak in the late morning window",
      body: "Mateo's pointing-and-naming sessions — where he seeks out words for things — have clustered almost entirely between 10 and 11:30am. After lunch he tends to shift into quieter processing mode, which seems equally valuable but different. If there's a moment to do naming games, read together, or simply narrate what he's doing, the late morning is when he seems most ready to receive it.",
      confidence: "consistent",
      data_window_days: 10,
      tags: ["language", "morning", "timing", "naming"],
      source_types: ["journal_entries", "memory_events"],
      is_dismissed: false,
      is_saved: true,
      created_at: "2026-05-14T18:10:00+00:00",
    },

    {
      id: "ai-12",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "language",
      title: "Receptive language is running well ahead of expressive output — and that's how it works",
      body: "Mateo understands considerably more than he can yet say, and he knows it — you can see him reaching for words during the pointing games. The naming sessions, the waiting behavior, the careful watching of mouths: all signs of an active receptive vocabulary building up. Expressive words tend to arrive after a sustained intake period like this one. 'More' on May 14 is likely the first of several.",
      confidence: "well-established",
      data_window_days: 14,
      tags: ["language", "receptive", "expressive", "milestone", "vocabulary"],
      source_types: ["journal_entries", "memory_events"],
      is_dismissed: false,
      is_saved: true,
      created_at: "2026-05-14T18:11:00+00:00",
    },

    // ── Sleep ─────────────────────────────────────────────────────────────────

    {
      id: "ai-13",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "sleep",
      title: "Nap durations have been trending longer as the month progressed",
      body: "May 4 was a short 55-minute nap on an overtired day. By May 8 it had stretched to 100 minutes. May 13 came in at 105 minutes — his best of the month. The common thread on the longer days is a meaningful outdoor morning and the walk beforehand. As his physical activity increases, the sleep seems to be keeping pace with it.",
      confidence: "consistent",
      data_window_days: 14,
      tags: ["sleep", "nap", "duration", "outdoor", "trend"],
      source_types: ["journal_entries", "schedule_items"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:12:00+00:00",
    },

    {
      id: "ai-14",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "sleep",
      title: "A 12:30–1pm nap start tends to produce the most settled sleep",
      body: "Naps that begin closer to 12:45 or 1pm have been longer and smoother on average than those starting before 12:30 or after 1:15. It's a fairly narrow window that shifts with the day, but on mornings where lunch wraps around noon and there's a gentle 20-minute wind-down, the timing tends to align naturally. Earlier starts sometimes cut short; later ones can mean a tired, harder entry.",
      confidence: "emerging",
      data_window_days: 10,
      tags: ["sleep", "nap", "timing", "wind-down"],
      source_types: ["schedule_items", "household_notes"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:13:00+00:00",
    },

    // ── Feeding ───────────────────────────────────────────────────────────────

    {
      id: "ai-15",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "feeding",
      title: "He's accepting new foods more readily in firmer textures right now",
      body: "Sweet potato was rejected at the mash stage several times, then accepted on May 6 when offered firmer and cubed. Avocado followed a similar path — cautious at a smoother consistency, more willing when there was more structure to hold and bite. It may be worth leading with that approach for other introductions coming up. Less mashed, more defined.",
      confidence: "emerging",
      data_window_days: 14,
      tags: ["feeding", "texture", "food-introduction", "acceptance"],
      source_types: ["journal_entries", "household_notes"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:14:00+00:00",
    },

    // ── Recommendations ───────────────────────────────────────────────────────

    {
      id: "ai-16",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "recommendation",
      title: "The outdoor morning routine is producing real, consistent effects",
      body: "Fourteen days of morning walks have corresponded with calmer afternoons, longer naps, better appetite, and more focused play windows. It doesn't seem to matter a great deal whether it's 20 minutes or 45 — the outdoor exposure and forward movement appear to be the active ingredient. This is one of the most high-leverage parts of Mateo's day and seems worth protecting, even on busier mornings.",
      confidence: "well-established",
      data_window_days: 14,
      tags: ["outdoor", "morning", "recommendation", "nap", "mood"],
      source_types: ["journal_entries", "household_notes", "schedule_items"],
      is_dismissed: false,
      is_saved: true,
      created_at: "2026-05-14T18:15:00+00:00",
    },

    {
      id: "ai-17",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "recommendation",
      title: "The 10–11am window is a good time for language-rich play",
      body: "Naming games, pointing-and-labeling, reading together, and narrating what he's doing all tend to land well in the late morning before the nap lead-up. It doesn't need to be structured to work — following his pointing with good, clear names is enough. Physical or sensory play tends to suit the post-nap window better, after his language energy has had time to rest.",
      confidence: "consistent",
      data_window_days: 10,
      tags: ["language", "recommendation", "timing", "morning", "naming"],
      source_types: ["journal_entries", "household_notes"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:16:00+00:00",
    },

    {
      id: "ai-18",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "recommendation",
      title: "Lunch is the best window for introducing unfamiliar foods",
      body: "He's most curious and least depleted in the middle of the day. Evening meals, by contrast, often carry some tiredness into the experience — which tends to narrow his willingness to try something new. Introducing a new food at lunch, alongside something familiar he already likes, seems to be the lowest-friction approach. Dinner is a better moment for foods he's already accepted.",
      confidence: "emerging",
      data_window_days: 14,
      tags: ["feeding", "recommendation", "lunch", "food-introduction"],
      source_types: ["journal_entries", "household_notes"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:17:00+00:00",
    },

    {
      id: "ai-19",
      child_id: CHILD_ID,
      insight_date: "2026-05-14",
      insight_type: "recommendation",
      title: "Keeping a regular Oliver rhythm is worth prioritizing",
      body: "The two Tuesday playdates have shown quiet but meaningful progression: May 6 brought unprompted bucket sharing, May 12 brought direct eye contact and a block offering across the space. Peer consistency at this age matters — it's how early social learning and trust with other children takes root. Tuesdays as a regular touchpoint appear to be working.",
      confidence: "emerging",
      data_window_days: 10,
      tags: ["social", "oliver", "recommendation", "playdate", "peer"],
      source_types: ["journal_entries", "memory_events"],
      is_dismissed: false,
      is_saved: false,
      created_at: "2026-05-14T18:18:00+00:00",
    },

  ]);
}

async function seedExtendedAiSummaries() {
  await upsert("ai_summaries", [

    {
      id: "as14",
      child_id: CHILD_ID,
      summary_date: "2026-05-14",
      headline: "Two milestones before 11am",
      summary: "The morning park visit delivered more than expected. Mateo came down the big slide alone for the first time — no hesitation at the top — and then said 'more' clearly and intentionally when he wanted to go again. First clearly functional word, first solo slide descent, same morning. Elena sent the video immediately. The family has watched it several times.",
      highlights: JSON.stringify(["First word: 'more' 🗣️", "Solo slide descent 🛝", "Sensory bin focus — 12 min 🪣"]),
    },

    {
      id: "as15",
      child_id: CHILD_ID,
      summary_date: "2026-05-15",
      headline: "A quieter Friday — processing yesterday",
      summary: "The day after a milestone day tends to have its own quieter quality. Mateo was calm and inward, happy to set his own pace. The morning walk covered new ground — two unfamiliar streets and a construction site that held his attention for several minutes. Post-nap reading was relaxed. At afternoon snack, he said something approximating 'more' again, then looked quietly pleased with himself.",
      highlights: JSON.stringify(["New route on morning walk 🗺️", "Construction site curiosity 🚧", "'More' used again 🌱"]),
    },

    {
      id: "as16",
      child_id: CHILD_ID,
      summary_date: "2026-05-16",
      headline: "Marco at the park, Sofia at the library",
      summary: "A full Saturday divided between parents. Marco took the morning park shift — Mateo climbed the short ramp eight times in a row, pure repetition and quiet mastery. Sofia took the afternoon library visit; he went straight to the reading mat again without any prompting. She texted Marco a photo of him sitting there with his book. He texted back the Thursday slide video. A good day.",
      highlights: JSON.stringify(["Ramp × 8 — pure mastery 🔁", "Library reading mat — no prompting 📖", "Family Saturday ❤️"]),
    },

  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 5 — Grocery & Household Ops
// ═══════════════════════════════════════════════════════════════════════════════

const HH_ID = HOUSEHOLD_ID;

async function seedGroceryLists() {
  await upsert("grocery_lists", [
    {
      id: "gl-01",
      household_id: HH_ID,
      name: "Week of May 5 — Groceries",
      list_type: "groceries",
      week_of: "2026-05-05",
      created_by: "parent",
      is_archived: true,
      created_at: "2026-05-04T20:00:00+00:00",
    },
    {
      id: "gl-02",
      household_id: HH_ID,
      name: "Week of May 12 — Groceries",
      list_type: "groceries",
      week_of: "2026-05-12",
      created_by: "parent",
      is_archived: false,
      created_at: "2026-05-11T20:00:00+00:00",
    },
    {
      id: "gl-03",
      household_id: HH_ID,
      name: "Household Supplies — May",
      list_type: "household",
      week_of: null,
      created_by: "nanny",
      is_archived: false,
      created_at: "2026-05-01T09:00:00+00:00",
    },
    {
      id: "gl-04",
      household_id: HH_ID,
      name: "Baby Supplies — May",
      list_type: "baby",
      week_of: null,
      created_by: "parent",
      is_archived: false,
      created_at: "2026-05-01T09:05:00+00:00",
    },
    {
      id: "gl-05",
      household_id: HH_ID,
      name: "Pharmacy — May 13",
      list_type: "pharmacy",
      week_of: null,
      created_by: "parent",
      is_archived: false,
      created_at: "2026-05-13T08:00:00+00:00",
    },
  ]);
}

async function seedGroceryListItems() {
  await upsert("grocery_list_items", [

    // ── gl-01: Week of May 5 (all completed) ─────────────────────────────────

    {
      id: "gli-01-01",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "Whole milk",
      category: "dairy",
      quantity: "1 gallon",
      priority: "urgent",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-05T10:30:00+00:00",
      added_by: "parent",
      notes: "Always full-fat for Mateo",
      created_at: "2026-05-04T20:00:00+00:00",
    },
    {
      id: "gli-01-02",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "Greek yogurt pouches",
      category: "dairy",
      quantity: "× 6",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-05T10:31:00+00:00",
      added_by: "parent",
      notes: null,
      created_at: "2026-05-04T20:01:00+00:00",
    },
    {
      id: "gli-01-03",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "Frozen peas",
      category: "frozen",
      quantity: "1 bag",
      priority: "routine",
      is_recurring: false,
      completed: true,
      completed_by: "nanny",
      completed_at: "2026-05-05T10:32:00+00:00",
      added_by: "nanny",
      notes: "Steam until soft — he does better with slightly mushier texture",
      created_at: "2026-05-04T20:02:00+00:00",
    },
    {
      id: "gli-01-04",
      list_id: "gl-01",
      child_id: null,
      name: "Whole grain bread",
      category: "grains",
      quantity: "1 loaf",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-05T10:33:00+00:00",
      added_by: "parent",
      notes: null,
      created_at: "2026-05-04T20:03:00+00:00",
    },
    {
      id: "gli-01-05",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "String cheese sticks",
      category: "dairy",
      quantity: "× 12",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "nanny",
      completed_at: "2026-05-06T08:00:00+00:00",
      added_by: "nanny",
      notes: "Good for self-feeding practice — he can hold these well now",
      created_at: "2026-05-04T20:04:00+00:00",
    },
    {
      id: "gli-01-06",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "Happy Baby vanilla puffs",
      category: "baby",
      quantity: "2 containers",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "nanny",
      completed_at: "2026-05-06T08:01:00+00:00",
      added_by: "nanny",
      notes: null,
      created_at: "2026-05-04T20:05:00+00:00",
    },
    {
      id: "gli-01-07",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "Bananas",
      category: "produce",
      quantity: "1 bunch",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-06T08:02:00+00:00",
      added_by: "parent",
      notes: "Medium ripe — he won't touch them if they're too brown",
      created_at: "2026-05-04T20:06:00+00:00",
    },
    {
      id: "gli-01-08",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "Avocado",
      category: "produce",
      quantity: "× 2",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "nanny",
      completed_at: "2026-05-07T07:30:00+00:00",
      added_by: "nanny",
      notes: "Ready-to-eat ripeness ideally",
      created_at: "2026-05-05T08:00:00+00:00",
    },
    {
      id: "gli-01-09",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "Baby carrots",
      category: "produce",
      quantity: "1 bag",
      priority: "routine",
      is_recurring: false,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-07T07:31:00+00:00",
      added_by: "parent",
      notes: "Steam until very soft",
      created_at: "2026-05-05T08:01:00+00:00",
    },
    {
      id: "gli-01-10",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "Cheddar block",
      category: "dairy",
      quantity: "8 oz",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-07T07:32:00+00:00",
      added_by: "parent",
      notes: "Cut into small cubes for finger food",
      created_at: "2026-05-05T08:02:00+00:00",
    },
    {
      id: "gli-01-11",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "Sweet potato",
      category: "produce",
      quantity: "× 3",
      priority: "routine",
      is_recurring: false,
      completed: true,
      completed_by: "nanny",
      completed_at: "2026-05-07T07:33:00+00:00",
      added_by: "nanny",
      notes: "Introducing this week — will steam and cube",
      created_at: "2026-05-05T08:03:00+00:00",
    },
    {
      id: "gli-01-12",
      list_id: "gl-01",
      child_id: CHILD_ID,
      name: "Applesauce pouches",
      category: "baby",
      quantity: "× 6",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-07T07:34:00+00:00",
      added_by: "parent",
      notes: "No added sugar — check label",
      created_at: "2026-05-05T08:04:00+00:00",
    },

    // ── gl-02: Week of May 12 (current list, partially completed) ────────────

    {
      id: "gli-02-01",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Oatmeal (quick oats)",
      category: "grains",
      quantity: "1 canister",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-12T09:00:00+00:00",
      added_by: "parent",
      notes: null,
      created_at: "2026-05-11T20:00:00+00:00",
    },
    {
      id: "gli-02-02",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Mango",
      category: "produce",
      quantity: "× 2 ripe",
      priority: "routine",
      is_recurring: false,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-12T09:01:00+00:00",
      added_by: "parent",
      notes: "He went wild for mango last week",
      created_at: "2026-05-11T20:01:00+00:00",
    },
    {
      id: "gli-02-03",
      list_id: "gl-02",
      child_id: null,
      name: "Eggs",
      category: "protein",
      quantity: "× 12",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-12T09:02:00+00:00",
      added_by: "parent",
      notes: null,
      created_at: "2026-05-11T20:02:00+00:00",
    },
    {
      id: "gli-02-04",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Babybel cheese wheels",
      category: "dairy",
      quantity: "6-pack",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "nanny",
      completed_at: "2026-05-13T10:00:00+00:00",
      added_by: "nanny",
      notes: "Great for snack — he can hold and gnaw on these",
      created_at: "2026-05-11T20:03:00+00:00",
    },
    {
      id: "gli-02-05",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Happy Baby blueberry puffs",
      category: "baby",
      quantity: "2 containers",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "nanny",
      completed_at: "2026-05-13T10:01:00+00:00",
      added_by: "nanny",
      notes: null,
      created_at: "2026-05-11T20:04:00+00:00",
    },
    {
      id: "gli-02-06",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Applesauce pouches",
      category: "baby",
      quantity: "× 6",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "nanny",
      completed_at: "2026-05-13T10:02:00+00:00",
      added_by: "nanny",
      notes: null,
      created_at: "2026-05-11T20:05:00+00:00",
    },
    {
      id: "gli-02-07",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Avocado",
      category: "produce",
      quantity: "× 3",
      priority: "routine",
      is_recurring: true,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "nanny",
      notes: "Slightly firm is fine — will ripen by mid-week",
      created_at: "2026-05-11T20:06:00+00:00",
    },
    {
      id: "gli-02-08",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Bananas",
      category: "produce",
      quantity: "1 bunch",
      priority: "routine",
      is_recurring: true,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: null,
      created_at: "2026-05-11T20:07:00+00:00",
    },
    {
      id: "gli-02-09",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Rice cakes (unsalted)",
      category: "snacks",
      quantity: "1 pack",
      priority: "routine",
      is_recurring: true,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "nanny",
      notes: "Plain only — he likes the mini size",
      created_at: "2026-05-11T20:08:00+00:00",
    },
    {
      id: "gli-02-10",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Full-fat plain yogurt",
      category: "dairy",
      quantity: "32 oz tub",
      priority: "urgent",
      is_recurring: true,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: "Running low — he has this every morning almost",
      created_at: "2026-05-11T20:09:00+00:00",
    },
    {
      id: "gli-02-11",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Blueberries",
      category: "produce",
      quantity: "1 pint",
      priority: "routine",
      is_recurring: true,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: "Halve before serving",
      created_at: "2026-05-11T20:10:00+00:00",
    },
    {
      id: "gli-02-12",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Sweet potato",
      category: "produce",
      quantity: "× 2",
      priority: "routine",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "nanny",
      notes: "He accepted it last week — keeping it in rotation",
      created_at: "2026-05-11T20:11:00+00:00",
    },
    {
      id: "gli-02-13",
      list_id: "gl-02",
      child_id: CHILD_ID,
      name: "Whole milk",
      category: "dairy",
      quantity: "1 gallon",
      priority: "urgent",
      is_recurring: true,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: "Down to the last half gallon — get Thursday at latest",
      created_at: "2026-05-12T18:00:00+00:00",
    },
    {
      id: "gli-02-14",
      list_id: "gl-02",
      child_id: null,
      name: "Baby spinach",
      category: "produce",
      quantity: "5 oz bag",
      priority: "whenever",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: "For smoothies and egg scrambles",
      created_at: "2026-05-11T20:12:00+00:00",
    },

    // ── gl-03: Household Supplies — May ──────────────────────────────────────

    {
      id: "gli-03-01",
      list_id: "gl-03",
      child_id: null,
      name: "Backup batteries (AA) for white noise machine",
      category: "household",
      quantity: "4-pack",
      priority: "routine",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "nanny",
      notes: "Machine is running but noticed batteries are getting low",
      created_at: "2026-05-14T08:20:00+00:00",
    },
    {
      id: "gli-03-02",
      list_id: "gl-03",
      child_id: null,
      name: "Laundry detergent (fragrance-free)",
      category: "household",
      quantity: "large",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-05T11:00:00+00:00",
      added_by: "parent",
      notes: "Sensitive skin formula only — Mateo reacts to fragranced detergents",
      created_at: "2026-05-01T09:00:00+00:00",
    },
    {
      id: "gli-03-03",
      list_id: "gl-03",
      child_id: CHILD_ID,
      name: "Baby wipes",
      category: "baby",
      quantity: "× 3 packs",
      priority: "urgent",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-06T09:00:00+00:00",
      added_by: "nanny",
      notes: "Unscented — last pack in the changing station",
      created_at: "2026-05-05T08:00:00+00:00",
    },
    {
      id: "gli-03-04",
      list_id: "gl-03",
      child_id: CHILD_ID,
      name: "Baby sunscreen SPF 50",
      category: "baby",
      quantity: "1 tube",
      priority: "urgent",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "nanny",
      notes: "Old tube expired — need before outdoor season kicks in. Mineral only if possible.",
      created_at: "2026-05-08T14:00:00+00:00",
    },
    {
      id: "gli-03-05",
      list_id: "gl-03",
      child_id: null,
      name: "Blackout curtain clips",
      category: "household",
      quantity: "× 4",
      priority: "whenever",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "nanny",
      notes: "Current ones are slipping on one side of the nursery curtain",
      created_at: "2026-05-07T09:00:00+00:00",
    },
    {
      id: "gli-03-06",
      list_id: "gl-03",
      child_id: null,
      name: "Dish soap",
      category: "household",
      quantity: "refill",
      priority: "routine",
      is_recurring: true,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: null,
      created_at: "2026-05-11T20:00:00+00:00",
    },
    {
      id: "gli-03-07",
      list_id: "gl-03",
      child_id: null,
      name: "Paper towels",
      category: "household",
      quantity: "× 4 rolls",
      priority: "routine",
      is_recurring: true,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: null,
      created_at: "2026-05-11T20:01:00+00:00",
    },
    {
      id: "gli-03-08",
      list_id: "gl-03",
      child_id: null,
      name: "Hand soap refill (kitchen)",
      category: "household",
      quantity: "1 bottle",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-05T11:05:00+00:00",
      added_by: "nanny",
      notes: null,
      created_at: "2026-05-04T17:00:00+00:00",
    },
    {
      id: "gli-03-09",
      list_id: "gl-03",
      child_id: CHILD_ID,
      name: "Stain spray for baby clothes",
      category: "household",
      quantity: "1 bottle",
      priority: "routine",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "nanny",
      notes: "Mango and avocado don't come out without pre-treating",
      created_at: "2026-05-07T09:01:00+00:00",
    },
    {
      id: "gli-03-10",
      list_id: "gl-03",
      child_id: null,
      name: "Gallon zip-lock bags",
      category: "household",
      quantity: "1 box",
      priority: "routine",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: "For prepping and freezing purees",
      created_at: "2026-05-11T20:02:00+00:00",
    },

    // ── gl-04: Baby Supplies — May ────────────────────────────────────────────

    {
      id: "gli-04-01",
      list_id: "gl-04",
      child_id: CHILD_ID,
      name: "Diapers size 5",
      category: "baby",
      quantity: "× 2 boxes",
      priority: "urgent",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-03T11:00:00+00:00",
      added_by: "parent",
      notes: "He's solidly in size 5 now",
      created_at: "2026-05-01T09:05:00+00:00",
    },
    {
      id: "gli-04-02",
      list_id: "gl-04",
      child_id: CHILD_ID,
      name: "Baby Mum-Mum rice crackers",
      category: "baby",
      quantity: "× 2 boxes",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "nanny",
      completed_at: "2026-05-05T10:00:00+00:00",
      added_by: "nanny",
      notes: "Good transitional snack for park days",
      created_at: "2026-05-04T09:00:00+00:00",
    },
    {
      id: "gli-04-03",
      list_id: "gl-04",
      child_id: CHILD_ID,
      name: "Happy Baby puffs (mixed variety)",
      category: "baby",
      quantity: "4 containers",
      priority: "routine",
      is_recurring: true,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "nanny",
      notes: "Getting through these faster — he's snacking more between meals",
      created_at: "2026-05-11T20:00:00+00:00",
    },
    {
      id: "gli-04-04",
      list_id: "gl-04",
      child_id: CHILD_ID,
      name: "Water table toy set refill",
      category: "baby",
      quantity: null,
      priority: "whenever",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "nanny",
      notes: "The small cups and scoops are going missing — worth getting replacements before summer",
      created_at: "2026-05-08T14:05:00+00:00",
    },
    {
      id: "gli-04-05",
      list_id: "gl-04",
      child_id: CHILD_ID,
      name: "Sippy cup replacement straws",
      category: "baby",
      quantity: "1 set",
      priority: "routine",
      is_recurring: false,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-07T10:00:00+00:00",
      added_by: "nanny",
      notes: "Current ones are showing mold in the seams — replace monthly",
      created_at: "2026-05-06T09:00:00+00:00",
    },
    {
      id: "gli-04-06",
      list_id: "gl-04",
      child_id: CHILD_ID,
      name: "Sleep sack (18–24 month size)",
      category: "baby",
      quantity: "× 1",
      priority: "whenever",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: "Current ones are getting snug — transitioning up a size before summer",
      created_at: "2026-05-01T09:06:00+00:00",
    },
    {
      id: "gli-04-07",
      list_id: "gl-04",
      child_id: CHILD_ID,
      name: "New board book (any Sandra Boynton)",
      category: "baby",
      quantity: "× 1",
      priority: "whenever",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: "He's wearing out Moo Baa La La La — happy to rotate in something new",
      created_at: "2026-05-03T20:00:00+00:00",
    },

    // ── gl-05: Pharmacy — May 13 ──────────────────────────────────────────────

    {
      id: "gli-05-01",
      list_id: "gl-05",
      child_id: CHILD_ID,
      name: "Infant acetaminophen",
      category: "pharmacy",
      quantity: "1 bottle",
      priority: "routine",
      is_recurring: false,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-13T12:00:00+00:00",
      added_by: "parent",
      notes: "Keep one in the diaper bag and one at home",
      created_at: "2026-05-13T08:00:00+00:00",
    },
    {
      id: "gli-05-02",
      list_id: "gl-05",
      child_id: CHILD_ID,
      name: "Baby saline drops",
      category: "pharmacy",
      quantity: "1 bottle",
      priority: "routine",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "parent",
      notes: null,
      created_at: "2026-05-13T08:01:00+00:00",
    },
    {
      id: "gli-05-03",
      list_id: "gl-05",
      child_id: null,
      name: "Band-aids (assorted small)",
      category: "pharmacy",
      quantity: "1 box",
      priority: "routine",
      is_recurring: false,
      completed: false,
      completed_by: null,
      completed_at: null,
      added_by: "nanny",
      notes: "He's climbing stairs now — let's be prepared",
      created_at: "2026-05-13T09:00:00+00:00",
    },
    {
      id: "gli-05-04",
      list_id: "gl-05",
      child_id: CHILD_ID,
      name: "Vitamin D drops",
      category: "pharmacy",
      quantity: "1 bottle",
      priority: "routine",
      is_recurring: true,
      completed: true,
      completed_by: "parent",
      completed_at: "2026-05-13T12:01:00+00:00",
      added_by: "parent",
      notes: "Per pediatrician — 400 IU daily",
      created_at: "2026-05-13T08:02:00+00:00",
    },

  ]);
}

async function seedHouseholdNotes() {
  await upsert("household_notes", [

    // ── May 14 ────────────────────────────────────────────────────────────────

    {
      id: "hn-01",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "supply-low",
      body: "Sunscreen in the cabinet under the bathroom sink is past its expiration date — noticed the date is 05/2025. Added baby sunscreen to the supplies list. Will need it before outdoor season really picks up.",
      created_by: "nanny",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-14T08:15:00+00:00",
    },
    {
      id: "hn-02",
      household_id: HH_ID,
      child_id: null,
      note_type: "supply-low",
      body: "White noise machine is working fine but checked the battery indicator this morning — it's in the low range. Added backup AAs to the household list. No urgency but worth getting before it dies mid-nap.",
      created_by: "nanny",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-14T08:20:00+00:00",
    },
    {
      id: "hn-03",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "handoff",
      body: "He said 'more' today — first real functional word. Full details in the journal entry. Worth noting here in case you want to reinforce it at dinner and bedtime. Use it in context: 'do you want more?' and wait for him to respond before giving him the thing.",
      created_by: "nanny",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-14T10:30:00+00:00",
    },

    // ── May 13 ────────────────────────────────────────────────────────────────

    {
      id: "hn-04",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "handoff",
      body: "Stairs milestone today — climbed all eleven unassisted. He's going to want to do this constantly now. Safe to let him practice with you nearby. He's coming down on his bottom which is correct — don't redirect that.",
      created_by: "nanny",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-13T16:05:00+00:00",
    },
    {
      id: "hn-05",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "reminder",
      body: "Nap today was 1h 45min — his longest this month. Long nap sometimes means a later bedtime window. You might have an extra 15–20 min before he's ready tonight. Don't rush the wind-down.",
      created_by: "nanny",
      is_resolved: true,
      resolved_at: "2026-05-13T21:00:00+00:00",
      created_at: "2026-05-13T14:20:00+00:00",
    },

    // ── May 12 ────────────────────────────────────────────────────────────────

    {
      id: "hn-06",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "routine-update",
      body: "Oliver playdate observation: he's starting to engage more directly — made eye contact and offered a block today, unprompted. Parallel play is shifting. If Oliver comes again, I'd suggest keeping the environment lower-stimulus so there's more space for interaction.",
      created_by: "nanny",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-12T17:05:00+00:00",
    },
    {
      id: "hn-07",
      household_id: HH_ID,
      child_id: null,
      note_type: "reminder",
      body: "Milk is getting low — down to under half a gallon. Added it as urgent to the May 12 grocery list. Please grab before Thursday if possible.",
      created_by: "parent",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-12T18:00:00+00:00",
    },

    // ── May 11 ────────────────────────────────────────────────────────────────

    {
      id: "hn-08",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "routine-update",
      body: "Nap window today was 12:30–2:15 — nearly two hours. I walked him for 45 min beforehand and I think that made the difference. Planning to test this again tomorrow. Will note any patterns.",
      created_by: "nanny",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-11T14:30:00+00:00",
    },
    {
      id: "hn-09",
      household_id: HH_ID,
      child_id: null,
      note_type: "schedule-change",
      body: "Marco may be home by 4pm on Thursday. Just flagging in case it changes the afternoon activity window or Elena's pickup timing — didn't want it to be a surprise.",
      created_by: "parent",
      is_resolved: true,
      resolved_at: "2026-05-14T17:00:00+00:00",
      created_at: "2026-05-11T09:00:00+00:00",
    },

    // ── May 9 ─────────────────────────────────────────────────────────────────

    {
      id: "hn-10",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "routine-update",
      body: "Library on Saturdays is working really well — he remembered the reading mat this week without any prompting. Would recommend keeping this as a weekly rhythm. It takes about 40 min total and he always eats better after.",
      created_by: "nanny",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-09T13:10:00+00:00",
    },

    // ── May 8 ─────────────────────────────────────────────────────────────────

    {
      id: "hn-11",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "supply-low",
      body: "Baby sunscreen from last summer is expired (05/2025 on the tube). Tossed it. Added to the household supplies list — need a new one before outdoor season. Mineral-based preferred if there's a choice.",
      created_by: "nanny",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-08T14:00:00+00:00",
    },

    // ── May 7 ─────────────────────────────────────────────────────────────────

    {
      id: "hn-12",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "supply-low",
      body: "Sensory bin supplies (dried lentils, rice) are getting low after today's session. Very easy to restock — just a bag of each from the grocery store. Nothing urgent but good to grab next shop.",
      created_by: "nanny",
      is_resolved: true,
      resolved_at: "2026-05-12T10:00:00+00:00",
      created_at: "2026-05-07T17:00:00+00:00",
    },

    // ── May 6 ─────────────────────────────────────────────────────────────────

    {
      id: "hn-13",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "handoff",
      body: "Sweet potato worked at lunch today — 6 bites, no resistance. I steamed it a bit firmer than the previous attempts (less mashed). Worth trying at dinner this week with the same preparation. He seems to prefer texture over smooth right now.",
      created_by: "nanny",
      is_resolved: true,
      resolved_at: "2026-05-07T20:00:00+00:00",
      created_at: "2026-05-06T17:30:00+00:00",
    },

    // ── May 5 ─────────────────────────────────────────────────────────────────

    {
      id: "hn-14",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "reminder",
      body: "Elena — can you check if we're running low on the Happy Baby puffs? He seemed hungrier than usual after lunch the last couple of days. Might need more snack volume in the afternoon.",
      created_by: "parent",
      is_resolved: true,
      resolved_at: "2026-05-06T09:00:00+00:00",
      created_at: "2026-05-05T10:00:00+00:00",
    },

    // ── May 4 ─────────────────────────────────────────────────────────────────

    {
      id: "hn-15",
      household_id: HH_ID,
      child_id: CHILD_ID,
      note_type: "routine-update",
      body: "Tried moving the afternoon snack slightly earlier today — 2:45 instead of 3:00. Seemed to help with mood going into the 3pm window. Will test again tomorrow to see if it holds.",
      created_by: "nanny",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-04T15:00:00+00:00",
    },

    // ── May 1 ─────────────────────────────────────────────────────────────────

    {
      id: "hn-16",
      household_id: HH_ID,
      child_id: null,
      note_type: "reminder",
      body: "Starting May — let's try to keep produce stocked through mid-week. Last two weeks we've been low on avocado and blueberries by Wednesday. Planning a Thursday shop each week should solve it.",
      created_by: "parent",
      is_resolved: false,
      resolved_at: null,
      created_at: "2026-05-01T09:00:00+00:00",
    },

  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 4 — Journal & Memory
// ═══════════════════════════════════════════════════════════════════════════════

async function seedJournalEntries() {
  await upsert("journal_entries", [

    // ── May 14 (Thursday — today) ────────────────────────────────────────────

    {
      id: "j01",
      child_id: CHILD_ID,
      entry_date: "2026-05-14",
      author_type: "nanny",
      author_name: "Elena",
      title: "He said it. Clear as anything.",
      body: `This morning at the park, Mateo reached the top of the big slide — the one he's been eyeing for two weeks — and came down alone for the first time. No hesitation at the top. Just a look at me to check I was watching, and then he went.

I said "more?" when he landed. And he looked right at me and said it back. Not a sound, not a sound-adjacent thing. The word "more." Clear and intentional and pointed right at the slide.

I texted Sofia immediately. I know she was probably in a meeting. I texted anyway.

He went down four more times in a row. Each time I said "more?" and each time he said it back. By the fourth time he was saying it before I did.

I've been with him for nearly seven months. I've been waiting for this — not anxiously, just with that particular kind of patience that comes from watching a child approach something in their own time. Today was the day. He was ready. He just needed a slide and the right moment.`,
      mood_emoji: "🌟",
      tags: ["milestone", "language", "outdoor", "slide"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/baby1/400/600", caption: "First solo slide — the look of pure pride at the bottom" },
      ]),
      is_favorite: true,
      created_at: "2026-05-14T10:22:00+00:00",
    },

    {
      id: "j02",
      child_id: CHILD_ID,
      entry_date: "2026-05-14",
      author_type: "parent",
      author_name: "Sofia",
      title: "The word we've been waiting for",
      body: `Elena texted at 9:47 this morning. I was in a budget review and my phone buzzed and I saw the notification and my whole body changed. I excused myself from the conference room.

"He said 'more.' Real word. First functional word. Slide milestone too — solo descent. Video coming."

I stood in the hallway for a minute. Eighteen months. All the pointing and babbling and near-misses. And then, on a Thursday morning at the park, it clicks.

Marco cried a little when I told him at dinner. He tried to hide it and then stopped trying.

Mateo doesn't know what he did today. He just wanted more slide. But we'll tell him someday. We'll tell him about the text, and the conference room hallway, and the video I watched five times on mute so I wouldn't cry at my desk.

He was so pleased with himself. You can see it in the video. He's already forgotten. He's onto the next thing. That's how it works, apparently.`,
      mood_emoji: "💛",
      tags: ["milestone", "language", "parent-reflection"],
      photos: JSON.stringify([]),
      is_favorite: true,
      created_at: "2026-05-14T20:15:00+00:00",
    },

    {
      id: "j03",
      child_id: CHILD_ID,
      entry_date: "2026-05-14",
      author_type: "parent",
      author_name: "Marco",
      title: "I watched the slide video three times at my desk",
      body: `Sofia forwarded Elena's video at 10:03am. My first meeting of the day was at 10:15. I watched it three times before I went in.

He's so serious on the way up. Grip the rails, one foot then the other, full concentration. Then he gets to the top and looks for Elena. Makes sure she's there. Satisfied, he looks at the slide — and goes.

The face on the way down is the best part. Something between determination and joy. He's not scared. He's doing it.

Then "more." You have to watch closely. He's looking right at her and he says it and you can see Elena's reaction — this barely-controlled excitement she gets when something new happens. I've watched enough of her videos to know that face. She's very good at her job.

I told my colleague about it over lunch. He has a 4-year-old. He said "you'll forget these days faster than you think." I don't believe him. But I took a screenshot just in case.`,
      mood_emoji: "🙌",
      tags: ["milestone", "parent-reflection", "video"],
      photos: JSON.stringify([]),
      is_favorite: false,
      created_at: "2026-05-14T20:45:00+00:00",
    },

    // ── May 13 (Wednesday) ───────────────────────────────────────────────────

    {
      id: "j04",
      child_id: CHILD_ID,
      entry_date: "2026-05-13",
      author_type: "nanny",
      author_name: "Elena",
      title: "Eleven stairs and a moment that changed the day",
      body: `He's been studying the staircase for weeks. Standing at the bottom, looking up. Reaching for the first step, touching it, walking away. Taking his time.

Today he climbed it. All eleven stairs, unassisted, both hands on the railing, one deliberate step at a time. He got to the top and turned around to look at me. He knew. He absolutely knew.

I didn't say anything for a second. I just met his eyes and nodded slowly. And he made a sound — not a word, not exactly a sound either — something more than both. A small expression of something enormous. Satisfaction. The physical sensation of having done a hard thing.

He came back down on his bottom, which is correct form for 18 months and also very endearing. Then he turned around and immediately climbed back up.

Water table in the morning was good, but this was the day. He slept 1 hour 45 minutes in the afternoon — the longest nap this month. I think the staircase used everything he had.

Texted Sofia right after. Didn't want her to find out at dinner. A moment like that deserves a text.`,
      mood_emoji: "🏔️",
      tags: ["milestone", "gross-motor", "stairs", "nap"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/water5/400/500", caption: "Water table before the big climb — already in an adventurous mood" },
      ]),
      is_favorite: true,
      created_at: "2026-05-13T16:00:00+00:00",
    },

    {
      id: "j05",
      child_id: CHILD_ID,
      entry_date: "2026-05-13",
      author_type: "parent",
      author_name: "Sofia",
      title: "She texted me right in the middle of a meeting",
      body: `It was 1:55pm. I was presenting Q2 projections. My phone buzzed. I glanced down and saw: "He climbed the full stairs today. Unassisted."

I kept presenting. I finished the slide. I said "let's take a five-minute break" and went into the hallway and read it properly.

Elena always knows when something is worth interrupting the day for. She's never wrong about these. If she texts, it happened, and it was real.

I thought about him at the bottom of those stairs all these weeks — just looking, just thinking. He never seemed frustrated by it. He was just waiting until he was ready. I want to be more like that.

When I got home he walked up the first three stairs to show me and then got distracted by the cat next door through the window. Marco and I tried not to laugh. He's already moved on. The stairs are his now. That chapter is closed.`,
      mood_emoji: "🥹",
      tags: ["milestone", "parent-reflection", "gross-motor"],
      photos: JSON.stringify([]),
      is_favorite: false,
      created_at: "2026-05-13T20:30:00+00:00",
    },

    // ── May 12 (Tuesday) ─────────────────────────────────────────────────────

    {
      id: "j06",
      child_id: CHILD_ID,
      entry_date: "2026-05-12",
      author_type: "nanny",
      author_name: "Elena",
      title: "Farmer's market, a six-block tower, and Oliver",
      body: `Tuesday is always a full day. Farmer's market in the morning — Mateo does this thing where he walks very slowly and touches everything he's allowed to touch and considers everything he's not. He stood at the berry stand for two full minutes. The vendor offered him a blueberry. He held it for a while before eating it. He's a deliberate child.

Before lunch he built a six-block tower. I counted. He stacked five, paused, placed the sixth with both hands and maximum concentration, then looked at me with an expression that said: witness this. Then he knocked it down. The knockdown was equally deliberate.

Oliver came in the afternoon. Still very much parallel play — they exist near each other, interested in what the other is doing, not yet ready to fully engage. But today Mateo handed Oliver a block. Not after prompting, not as a reflex — he looked at Oliver, looked at the block, and extended his arm. Oliver took it. Mateo turned back to his own pile.

It was less than three seconds. I wrote it down immediately.`,
      mood_emoji: "🏗️",
      tags: ["sensory", "fine-motor", "play", "social", "outdoor"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/market6/400/500", caption: "Farmer's market — studying the berry stand with complete seriousness" },
        { url: "https://picsum.photos/seed/playdate17/400/500", caption: "Oliver playdate — parallel play quietly becoming something more" },
      ]),
      is_favorite: false,
      created_at: "2026-05-12T17:00:00+00:00",
    },

    // ── May 11 (Monday) ──────────────────────────────────────────────────────

    {
      id: "j07",
      child_id: CHILD_ID,
      entry_date: "2026-05-11",
      author_type: "nanny",
      author_name: "Elena",
      title: "A quiet Monday, then one unprompted wave",
      body: `After the weekend, Mondays can go either way. This one came in gently — slower breakfast, easy start, no rushing. He wanted to be held a bit in the morning, which I'm always happy to give. Sometimes they need that landing pad after two days of family intensity.

Long walk mid-morning. He found puddles — of course he found puddles — and tested each one with scientific thoroughness. Wet left foot first, then right. Looked up each time to confirm I'd seen. A whole program.

Then the mail carrier came up the front walk. Mateo stopped, watched him approach, and raised his hand. Not a prompted wave. Not "say bye-bye." A social acknowledgment — recognition of another person, a willingness to greet them. The mail carrier was delighted. Mateo had already turned back to the puddle.

An unprompted social gesture is a language milestone, technically. But what it felt like was: he knows he's in a world with other people in it. He wants to acknowledge them. That's not nothing.

Easy nap, calm afternoon, smooth bedtime. A real Monday.`,
      mood_emoji: "👋",
      tags: ["social", "outdoor", "language", "milestone", "nap"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/walk_puddle/400/500", caption: "Afternoon puddle walk — left foot first, every time, without exception" },
      ]),
      is_favorite: false,
      created_at: "2026-05-11T17:15:00+00:00",
    },

    {
      id: "j08",
      child_id: CHILD_ID,
      entry_date: "2026-05-11",
      author_type: "parent",
      author_name: "Sofia",
      title: "He waved. All by himself.",
      body: `Elena mentioned it casually at pickup: "Oh, he waved to the mail carrier today, totally unprompted." Casual in the way she reports things that are actually significant — which I've learned means: pay attention to this one.

I thought about it on the drive home. An unprompted social gesture. He didn't wave because I said "say bye-bye." He waved because he looked at a person, recognized they were present and real and departing, and his body and mind together decided: acknowledge this.

That's not a small thing. That's the beginning of him existing in the social world as an agent, not just a recipient of other people's attention.

He was asleep by 7:05. I sat in the hallway for a while after. Marco came and found me there — which says something about us. We both do this. The hallway sitting after bedtime. We never discussed it as a ritual. It just is.

Bedtime is the moment when you step back and the day settles and you realize: this is going fast. Not in a sad way. Just in a real way.`,
      mood_emoji: "🌙",
      tags: ["social", "milestone", "language", "parent-reflection"],
      photos: JSON.stringify([]),
      is_favorite: false,
      created_at: "2026-05-11T21:00:00+00:00",
    },

    // ── May 10 (Sunday) ──────────────────────────────────────────────────────

    {
      id: "j09",
      child_id: CHILD_ID,
      entry_date: "2026-05-10",
      author_type: "parent",
      author_name: "Sofia",
      title: "Sunday pancakes, Grandma, and nine minutes to sleep",
      body: `Marco made pancakes. Mateo ate a quarter of one and then discovered maple syrup was a thing that existed in the world, and his entire morning changed. There's a photo. His nose. Syrup on his nose and he doesn't know and he looks like the happiest person alive.

Grandma came at 1pm. He heard the door before we opened it — footsteps, her voice, something — and he was already moving toward it. He ran to her the moment she appeared. She cried immediately. We let them have their moment.

Marco put him down for bed tonight for the first time by himself. I lingered near the door, irrationally nervous. Nine minutes later he came out, closed the door carefully, showed me the monitor. Mateo was asleep. Marco then texted me a photo of the monitor from three feet away, which is the funniest thing he has ever done.

He's a good dad. He's getting better at believing it.

Good Sunday. The kind you try to remember, and I think actually will.`,
      mood_emoji: "🥞",
      tags: ["family", "meal", "social", "grandma", "bedtime"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/pancake_fam/400/500", caption: "Sunday pancakes — the maple syrup incident, fully in progress" },
      ]),
      is_favorite: true,
      created_at: "2026-05-10T20:00:00+00:00",
    },

    // ── May 9 (Saturday — Library) ───────────────────────────────────────────

    {
      id: "j10",
      child_id: CHILD_ID,
      entry_date: "2026-05-09",
      author_type: "nanny",
      author_name: "Elena",
      title: "The puppet show stopped him completely",
      body: `Library story time has a different energy on the weekend — the room is fuller, the children are closer in age to Mateo, and today's librarian had a puppet. A simple fabric cat. Nothing spectacular.

Mateo saw it and went still.

I want to be precise because it matters developmentally: he didn't just pause. He stopped moving entirely, stopped reaching, stopped the constant low-level exploration he normally maintains. He sat. He watched. For eight minutes by my watch he didn't look away.

The puppet told a story about a mouse who found a piece of cheese. He doesn't follow full narratives yet. But he was following something — tone, movement, the call-and-response with the other children.

When the librarian asked "where's the cheese?" and the children pointed, Mateo pointed too. First time I've seen him follow a group cue. The whole room was his model and he used it.

He clapped at the song. On time. Completely unprompted.

He ate everything at lunch after. I always know when something significant has happened because he gets hungry.`,
      mood_emoji: "🎭",
      tags: ["learning", "social", "library", "focus", "milestone"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/library15/400/500", caption: "Library story time — eight minutes of complete, motionless attention" },
      ]),
      is_favorite: false,
      created_at: "2026-05-09T13:00:00+00:00",
    },

    // ── May 8 (Friday — Splash Pad) ──────────────────────────────────────────

    {
      id: "j11",
      child_id: CHILD_ID,
      entry_date: "2026-05-08",
      author_type: "nanny",
      author_name: "Elena",
      title: "He ran straight into the sprinklers",
      body: `The splash pad opened for the season today. I had no strong expectations — water can go either way. Some toddlers love it immediately. Others need ten minutes of perimeter assessment.

Mateo did four seconds of perimeter assessment and then ran. Not toddled. Ran. Arms pumping, full extension, the uneven urgent joy of a child who has discovered they can move faster than a walk. His first real running gait, actually.

He ran directly into the largest sprinkler arc. It hit him full in the face. He stopped. Blinked three times. Grinned.

Then he did it again.

The sun hat took about four minutes to negotiate. He rejected it, I set it aside, he reconsidered, put it on his own head at a slight angle. I never mentioned it again. He wore it for the rest of the time. He'd reached his own conclusion: the hat was correct after all. This is how he operates — he needs to decide things for himself.

He ate a full lunch and was asleep by 12:30. One hundred minutes. I folded laundry and the house was very peaceful.`,
      mood_emoji: "💦",
      tags: ["outdoor", "gross-motor", "milestone", "sensory", "nap"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/splashpad/400/500", caption: "Splash pad debut — the look, right after the first sprinkler hit" },
      ]),
      is_favorite: true,
      created_at: "2026-05-08T13:45:00+00:00",
    },

    {
      id: "j12",
      child_id: CHILD_ID,
      entry_date: "2026-05-08",
      author_type: "parent",
      author_name: "Marco",
      title: "Elena sent the video from the splash pad",
      body: `Twelve seconds of video. Mateo runs into frame from the left, hits the sprinkler, stops, blinks, grins. Then the camera pans because Elena is also managing a beach bag and a sun hat negotiation.

Twelve seconds. I watched it six times.

There's something about watching your kid discover joy at full speed — the way he ran, arms going, not worried about falling. He's in a body he's still figuring out and he just decided to push it as fast as it would go.

Sofia and I keep saying how fast it goes. We've been saying that since he was six weeks old. But it keeps being true in a new way. Last month he didn't run. This month he does. Next month, something else we haven't seen yet.

I screenshotted the frame where he's mid-blink, soaked, grinning. That one is going on the wall. Not negotiable.`,
      mood_emoji: "🏃",
      tags: ["outdoor", "gross-motor", "parent-reflection"],
      photos: JSON.stringify([]),
      is_favorite: false,
      created_at: "2026-05-08T19:30:00+00:00",
    },

    // ── May 7 (Thursday) ─────────────────────────────────────────────────────

    {
      id: "j13",
      child_id: CHILD_ID,
      entry_date: "2026-05-07",
      author_type: "nanny",
      author_name: "Elena",
      title: "Eighteen minutes in the bean bin, then eight things named",
      body: `Set up the sensory bin this morning with dried beans — a new material for him. First contact was cautious: one hand in, close it, pull it out, examine the hand. Then both hands. Then scooping started. He figured out pouring about six minutes in and we were settled.

Eighteen minutes of unbroken independent play. For 18 months, that's a long time. He wasn't bored, wasn't looking for attention, wasn't doing anything except learning how a substance behaves when you move it. This is what Montessori calls the absorbent mind at work — not playing, exactly. Investigating.

The afternoon was the most focused language session I've seen with him. He walked around the living room pointing at things: lamp, plant, book, dog photo on the shelf, the rug, the window, the clock, his own shoe. Each time he pointed, he looked at me and waited. Not urgently — with patience. He wanted the word, not the attention.

Eight objects in a row. He's not repeating them back yet. He's filing them. The retrieval will come.`,
      mood_emoji: "🫘",
      tags: ["sensory", "fine-motor", "language", "montessori", "focus"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/sensorybin/400/500", caption: "Bean bin — deep investigation mode, eighteen unbroken minutes" },
        { url: "https://picsum.photos/seed/rings_stack/400/500", caption: "Stacking rings after — still in his focus groove from the morning" },
      ]),
      is_favorite: false,
      created_at: "2026-05-07T16:30:00+00:00",
    },

    // ── May 6 (Wednesday — Oliver) ───────────────────────────────────────────

    {
      id: "j14",
      child_id: CHILD_ID,
      entry_date: "2026-05-06",
      author_type: "nanny",
      author_name: "Elena",
      title: "Six bites of sweet potato and a shared sandbox bucket",
      body: `Sweet potato has been on the "keep offering" list for three weeks. He rejected it mashed, rejected it puréed, and last week regarded a small cube of it with philosophical indifference.

Today I offered it at lunch alongside his usual avocado and cheese. He ate one bite, paused, ate another. Six bites total before moving to the avocado. Zero resistance. Different preparation — slightly firmer — but I think it was mostly timing. His palate is opening. I texted Sofia.

Oliver came in the afternoon. Sandbox. Mateo had the green bucket. Oliver wanted it. At this age, the green bucket normally becomes a territorial crisis. Instead: Mateo looked at Oliver, looked at the bucket, held it out. Oliver took it. Mateo picked up a different one and kept going.

I sat there for a moment pretending to look at something in my bag so I could process what I'd just witnessed. That is the most explicitly social thing he has done. Not reflexive, not modeled after an adult. Just: I see what you want, here.

Three seconds. Enormous.`,
      mood_emoji: "🍠",
      tags: ["meal", "feeding", "social", "play", "sharing"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/sandbox12/400/500", caption: "Oliver playdate — right before the bucket was offered without any prompting" },
      ]),
      is_favorite: false,
      created_at: "2026-05-06T17:00:00+00:00",
    },

    // ── May 5 (Tuesday) ──────────────────────────────────────────────────────

    {
      id: "j15",
      child_id: CHILD_ID,
      entry_date: "2026-05-05",
      author_type: "nanny",
      author_name: "Elena",
      title: "A garbage truck and a piece of chalk",
      body: `The garbage truck does its route past the house on Tuesday mornings. I've started timing our walk around it, because what happens is this: the truck appears at the corner and Mateo stops. He watches the whole thing — the hydraulics, the lifting, the compaction cycle. Three minutes, minimum. He has questions he can't express yet, but you can see them forming.

He's not frightened — he stands a little forward, toward it, in concentrated observation. He is filing this truck away very carefully. I think it will be a word he says in about three weeks.

Sidewalk chalk on the patio after lunch. He's seen chalk before but hadn't fully engaged. Today he picked up the blue piece, gripped it correctly on the second try — finger grip, not a full fist — and made a mark. A line. He looked at it and made another.

I drew a circle and said "circle." He looked at mine, looked at his line. Different things. He seemed genuinely interested in that distinction. Fine motor and early representation working together at the same time — a solid Tuesday.`,
      mood_emoji: "🖍️",
      tags: ["fine-motor", "outdoor", "language", "chalk"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/chalk22/400/500", caption: "First chalk marks — blue, intentional, correct grip on the second attempt" },
      ]),
      is_favorite: false,
      created_at: "2026-05-05T15:45:00+00:00",
    },

    // ── May 4 (Monday) ───────────────────────────────────────────────────────

    {
      id: "j16",
      child_id: CHILD_ID,
      entry_date: "2026-05-04",
      author_type: "nanny",
      author_name: "Elena",
      title: "Not every day is a highlight reel — and that's part of it",
      body: `He came through the door a little different this morning. Not sick — temperature fine, no symptoms — just quieter, more sensitive at the edges. Overtired from an active weekend, I suspected. I've seen this before.

Breakfast was harder than usual. He didn't want the oatmeal, then changed his mind about the oatmeal, then dropped the spoon. I stayed calm and kept the tone soft and we got through it eventually.

Nap was short — 55 minutes. He woke unsettled, which is a version of him I know how to handle. I held him for a few minutes, kept the room quiet, didn't rush back to activity. Then blocks and books on the floor, just the two of us, no agenda. He found his groove in about twenty minutes. Forty minutes of quiet independent play after that.

At 3:30 I took him for a short walk. Ten minutes in, he was transformed. There is something about forward movement and fresh air that simply works on him. He came home a different child. Easy dinner, good bedtime.

Some days are like this. It's part of the work. He handled it as well as an 18-month-old can. So did we.`,
      mood_emoji: "🌿",
      tags: ["reset", "nap", "outdoor", "play", "honest"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/blocks_quiet/400/500", caption: "Blocks and books — finding his groove again on a harder Monday afternoon" },
      ]),
      is_favorite: false,
      created_at: "2026-05-04T17:00:00+00:00",
    },

    // ── May 3 (Sunday) ───────────────────────────────────────────────────────

    {
      id: "j17",
      child_id: CHILD_ID,
      entry_date: "2026-05-03",
      author_type: "parent",
      author_name: "Marco",
      title: "Sunday park mornings are becoming ours",
      body: `Sofia slept in — she needed it. I loaded Mateo up at 9:45 with a snack bag and enormous confidence in myself, which lasted until I realized I'd forgotten his water bottle and had to go back inside.

The park was quiet. Just us, two older kids, and a man doing Tai Chi near the trees. Mateo studied the Tai Chi man for a while with complete seriousness, then turned his attention to the climbing structure.

He's not ready for the big slide yet — that's coming. But he did the short ramp six times, which he's very confident about now. Down, walk back around, up the ramp, down. His own circuit. I stood back and let him do it without narrating every step. I'm learning: he doesn't need a play-by-play. He needs someone to be present while he works.

Low energy after we got back. We let him set the pace — didn't push activities, didn't try to fill the quiet. He sat with his books. Sofia came and read with him for over an hour. Six books in a row. He chose every one.

Nothing dramatic. Just good. I'm glad we're building Sundays like this.`,
      mood_emoji: "🌳",
      tags: ["outdoor", "gross-motor", "family", "park"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/park_marco/400/500", caption: "Sunday park tradition — studying the Tai Chi man with genuine intensity" },
      ]),
      is_favorite: false,
      created_at: "2026-05-03T19:00:00+00:00",
    },

    {
      id: "j18",
      child_id: CHILD_ID,
      entry_date: "2026-05-03",
      author_type: "parent",
      author_name: "Sofia",
      title: "Six books in a row — he picked every single one",
      body: `Marco had the morning. I had the afternoon.

We ended up on the reading rug with a stack of books and nowhere to be, and he just... kept going. One book, then he reached for another. I didn't redirect or suggest — he was driving. Six books in a row. The Very Hungry Caterpillar, then two Sandra Boynton, then Brown Bear twice, then the blue counting book he's been obsessed with lately.

He turns pages now with real intention. Not randomly flipping — looking at the page, moving on when he's ready. For the counting book he pointed at the numbers before I said them. I don't know how much he actually understands. But he knows the shape of the ritual. He knows what we do here.

Reading together has become our thing. His and mine. I think he knows that. Or maybe I'm projecting. Either way, I'm not stopping.

Marco put him down later. A good Sunday.`,
      mood_emoji: "📚",
      tags: ["learning", "reading", "books", "family", "parent-reflection"],
      photos: JSON.stringify([]),
      is_favorite: false,
      created_at: "2026-05-03T16:30:00+00:00",
    },

    // ── May 2 (Saturday — Library) ───────────────────────────────────────────

    {
      id: "j19",
      child_id: CHILD_ID,
      entry_date: "2026-05-02",
      author_type: "nanny",
      author_name: "Elena",
      title: "He walked straight to the reading mat — didn't need me to show him",
      body: `Second Saturday library this month. I was curious whether last week had settled into anything real — one-time moment or beginning of something.

He walked through the library doors and paused. Scanned left, then right. Then walked directly to the reading mat in the far corner. Not the one nearest the entrance. The correct one. He sat down.

Spatial memory. He was here once and now this place has a structure in his mind. That's not something you teach — it emerges when a child is paying real attention. He had been paying real attention.

He pulled a book from the lower shelf, sat back on the mat, opened it. He can't read. He can barely identify pictures consistently yet. But he knows what books are for and what this mat is for and where to find them. He is building a map of his world.

I sat nearby and let him lead. We stayed 40 minutes. Four books. For the last one he turned pages and narrated in his own language — not babble, not quite words. Something more purposeful. Telling me the story as he understood it.

I've been doing this work for nine years. These are the moments I stay for.`,
      mood_emoji: "📖",
      tags: ["library", "learning", "language", "spatial-memory", "books"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/library_books/400/600", caption: "Second library Saturday — went straight to the reading mat without any prompt" },
      ]),
      is_favorite: true,
      created_at: "2026-05-02T11:30:00+00:00",
    },

    // ── May 1 (Friday) ───────────────────────────────────────────────────────

    {
      id: "j20",
      child_id: CHILD_ID,
      entry_date: "2026-05-01",
      author_type: "nanny",
      author_name: "Elena",
      title: "Birds, a head shake, and the outdoor rhythm locking in",
      body: `May 1st — our sixth month together. I've been doing morning walks with Mateo for two weeks straight and the difference is measurable: better sleep, better appetite, calmer afternoons. Sofia tracks these things. She calls it "the data." The data is clear.

This morning he noticed birds. Not the way he's glanced at them before — actually noticed. He stopped walking, pointed, looked at me. I said "bird." He looked at the bird, then back at me, then at the bird again. Filed it.

He pointed at six different birds before we reached the end of the block. Same ritual each time: point, meet eyes, wait, receive word. He's running an intake process. Systematic. He's going to say this word soon.

After lunch he said no to something for the first time with a deliberate head shake. Not crying, not turning away. A physical gesture that meant: no. I didn't make a big moment of it. Self-advocacy is important. He's starting to develop it.

Six months in. I still look forward to arriving at this house in the morning. That matters.`,
      mood_emoji: "🐦",
      tags: ["outdoor", "language", "birds", "milestone", "morning-walk"],
      photos: JSON.stringify([
        { url: "https://picsum.photos/seed/morning8/400/600", caption: "May 1 morning walk — the bird-pointing moment was just around this corner" },
      ]),
      is_favorite: false,
      created_at: "2026-05-01T14:30:00+00:00",
    },

    {
      id: "j21",
      child_id: CHILD_ID,
      entry_date: "2026-05-01",
      author_type: "parent",
      author_name: "Sofia",
      title: "The outdoor rhythm is working — I can see it from here",
      body: `I pick him up at 5:30 most days and I've started noticing a pattern: on days Elena has done the morning walk, he's different at pickup. Easier in the eyes. Less compressed. Like he's been able to discharge something physical and mental that would otherwise sit in him all afternoon.

She's walked him every single morning for two weeks. Whatever the weather — last Thursday it drizzled and she did a short one anyway and sent me a photo. "It's good for them to be in different conditions," she said.

I believe her. Everything bears it out.

May is starting well. He's moving more intentionally, noticing more, eating better, sleeping longer. Elena calls it a "sensitive period for movement." Montessori language for: his body is doing something right now that needs room and space.

We're trying to give him room. Some days that's easier than others. But we're trying.

First day of May. I want to write more of this down. The days go fast, and I keep meaning to, and then they go.`,
      mood_emoji: "🌸",
      tags: ["outdoor", "parent-reflection", "montessori", "growth"],
      photos: JSON.stringify([]),
      is_favorite: false,
      created_at: "2026-05-01T21:00:00+00:00",
    },

  ]);
}

// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function upsert(table: string, rows: Record<string, unknown>[], conflict = "id") {
  const { error } = await db.from(table).upsert(rows, { onConflict: conflict });
  if (error) {
    console.error(`✗ ${table}:`, error.message);
  } else {
    console.log(`✓ ${table} (${rows.length} rows)`);
  }
}

run().catch(console.error);
