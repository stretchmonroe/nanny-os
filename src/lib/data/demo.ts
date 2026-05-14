// ── Family ───────────────────────────────────────────────────────────────────

export const child = {
  name: "Mateo",
  fullName: "Mateo Rivera",
  age: "18 months",
  birthDate: "November 14, 2024",
  emoji: "🧒",
  focus: "Fine Motor Skills",
  mood: "😄",
  moodLabel: "Happy",
}

export const family = {
  parents: ["Sofia Rivera", "Marco Rivera"],
  nanny: "Elena Chen",
}

// ── Today's Schedule (May 14, 2026) ─────────────────────────────────────────

export const schedule = [
  {
    id: "1",
    time: "07:30",
    title: "Breakfast",
    type: "meal" as const,
    done: true,
    notes: "Scrambled eggs with cheddar + banana — cleared the plate",
  },
  {
    id: "2",
    time: "08:45",
    title: "Morning Park",
    type: "outdoor" as const,
    done: true,
    notes: "45 min — first time down the big slide solo",
  },
  {
    id: "3",
    time: "10:00",
    title: "Morning Snack",
    type: "meal" as const,
    done: true,
    notes: "Rice cakes + mango — said 'more' for the first time! 🌟",
  },
  {
    id: "4",
    time: "10:30",
    title: "Sensory Bin Play",
    type: "play" as const,
    done: false,
    active: true,
    notes: "Rice bin with cups, scoops, and small safari animals",
  },
  {
    id: "5",
    time: "12:00",
    title: "Lunch",
    type: "meal" as const,
    done: false,
    notes: "Avocado toast + blueberries + cheese stick",
  },
  {
    id: "6",
    time: "12:45",
    title: "Nap",
    type: "nap" as const,
    done: false,
    notes: "Target 90 min — blackout curtains + white noise on",
  },
  {
    id: "7",
    time: "14:30",
    title: "Afternoon Snack",
    type: "meal" as const,
    done: false,
    notes: "Yogurt with soft berries",
  },
  {
    id: "8",
    time: "15:00",
    title: "Reading Time",
    type: "learning" as const,
    done: false,
    notes: "Brown Bear + new Pete the Cat book",
  },
]

// ── Moments Carousel (home screen) ──────────────────────────────────────────

export const moments = [
  {
    id: "1",
    type: "photo" as const,
    content: "First time down the big slide by himself — pure pride on his face",
    time: "9:47 am",
    imageUrl: "https://picsum.photos/seed/baby1/400/600",
    createdBy: "nanny",
  },
  {
    id: "2",
    type: "note" as const,
    content: "Said 'more' clearly for the first time during snack! 🌟 First functional word — this is huge.",
    time: "10:15 am",
    createdBy: "nanny",
  },
  {
    id: "3",
    type: "photo" as const,
    content: "12 straight minutes on stacking rings — new personal focus record",
    time: "11:20 am",
    imageUrl: "https://picsum.photos/seed/toddler2/400/600",
    createdBy: "nanny",
  },
  {
    id: "4",
    type: "note" as const,
    content: "High energy at the park this morning — did 3 full laps before even touching the swings. 🔥",
    time: "9:15 am",
    createdBy: "nanny",
  },
  {
    id: "5",
    type: "photo" as const,
    content: "Pre-sensory bin cuddle session — the calm before the rice storm",
    time: "10:55 am",
    imageUrl: "https://picsum.photos/seed/cuddle3/400/600",
    createdBy: "nanny",
  },
  {
    id: "6",
    type: "note" as const,
    content: "Sleep has been incredible this week — out within 8 minutes every single night.",
    time: "Yesterday",
    createdBy: "parent",
  },
]

// ── Grocery List ─────────────────────────────────────────────────────────────

export const groceryItems = [
  { id: "g1",  name: "Oatmeal (quick oats)",        completed: true  },
  { id: "g2",  name: "Mango (2 ripe)",               completed: true  },
  { id: "g3",  name: "Eggs × 12",                    completed: true  },
  { id: "g4",  name: "Babybel cheese wheels",         completed: true  },
  { id: "g5",  name: "Blueberry puffs (Happy Baby)", completed: true  },
  { id: "g6",  name: "Applesauce pouches",            completed: true  },
  { id: "g7",  name: "Avocado (× 3)",                completed: false },
  { id: "g8",  name: "Banana bunch",                 completed: false },
  { id: "g9",  name: "Rice cakes (unsalted)",         completed: false },
  { id: "g10", name: "Full-fat plain yogurt",         completed: false },
  { id: "g11", name: "Blueberries (pint)",            completed: false },
  { id: "g12", name: "Sweet potato (× 2)",            completed: false },
  { id: "g13", name: "Whole milk (1 gal)",            completed: false },
  { id: "g14", name: "Baby spinach",                  completed: false },
]

// ── AI Suggestion (today) ────────────────────────────────────────────────────

export const aiSuggestion = {
  title: "Wind down before lunch",
  body: "Mateo's been running high energy all morning — park, snack milestone, sensory bin. A brief quiet activity before lunch will set up his best nap of the week.",
  activity: "Sensory Bin with Rice & Safari Animals",
  duration: "20–30 min",
  developmentalNote: "Filling and emptying containers builds the bilateral hand coordination he'll need for self-feeding — right on the edge of this milestone at 18 months.",
  developmentalFocus: "Fine Motor Skills",
}

// ── Insights & Patterns ──────────────────────────────────────────────────────

export const todayInsights = [
  "Language exposure was especially strong during this morning's park walk — naming objects and narrating counts more than it seems.",
  "The 'more' milestone is significant — intentional communication is accelerating fast.",
  "Outdoor mornings this week have consistently produced calmer, longer afternoon naps.",
]

export const weeklyPatterns = {
  headline: "A week of breakthroughs",
  observations: [
    "Outdoor mornings are producing the longest naps of the month — pattern is holding all week.",
    "Language is accelerating: 'more' today follows last week's 'bye bye' wave milestone.",
    "Focus window is lengthening — stacking rings held his attention for 12 straight minutes today.",
  ],
  trend: "positive" as const,
}

export const careNotes = [
  { icon: "💤", label: "Sleep",     note: "Naps averaging 95 min this week — best streak since January." },
  { icon: "🍽️", label: "Nutrition", note: "Appetite strong all week. Starting to accept new textures more easily — avocado progress on Tuesday." },
  { icon: "🌱", label: "Growth",    note: "Two new functional words this week: 'more' and 'bye.' Pointing is precise and intentional now." },
]

// ── Type Config ──────────────────────────────────────────────────────────────

export const typeConfig = {
  meal:     { label: "Meal",     color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",     dot: "bg-orange-400" },
  outdoor:  { label: "Outdoor",  color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",                 dot: "bg-sky-400"    },
  play:     { label: "Play",     color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", dot: "bg-emerald-400" },
  nap:      { label: "Nap",      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",     dot: "bg-indigo-400" },
  learning: { label: "Learning", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",     dot: "bg-violet-400" },
}

// ── Memory / Journal page data ───────────────────────────────────────────────

export const aiJournalSummary = {
  headline: "A morning full of firsts",
  summary:
    "Mateo had an exceptional morning — his first solo slide, a new word at snack, and 12 minutes of pure focused play with the stacking rings. Days like today are the ones to keep.",
  highlights: ["Said 'more' for the first time 🌟", "Big slide, solo 🛝", "12-min focus record 🧩", "Stairs milestone yesterday 🏔️"],
}

export type JournalMomentType = "photo" | "note" | "milestone"
export type ActivityCategory = "meal" | "outdoor" | "play" | "nap" | "learning"

export interface JournalMoment {
  id: string
  type: JournalMomentType
  content: string
  time: string
  imageUrl?: string
  category: ActivityCategory
}

export interface JournalDay {
  day: string
  date: string
  isToday: boolean
  moments: JournalMoment[]
}

// ── Weekly Journal (6 days: May 8–14) ───────────────────────────────────────

export const weeklyMoments: JournalDay[] = [
  {
    day: "Thursday",
    date: "Today · May 14",
    isToday: true,
    moments: [
      {
        id: "t1",
        type: "photo",
        content: "First time down the big slide by himself — pure pride on that face",
        time: "9:47 am",
        imageUrl: "https://picsum.photos/seed/baby1/400/600",
        category: "outdoor",
      },
      {
        id: "t2",
        type: "milestone",
        content: "Said 'more' clearly during snack — unprompted, first functional word! 🌟",
        time: "10:15 am",
        category: "learning",
      },
      {
        id: "t3",
        type: "photo",
        content: "12 straight minutes on stacking rings — new personal focus record",
        time: "11:20 am",
        imageUrl: "https://picsum.photos/seed/toddler2/400/500",
        category: "play",
      },
      {
        id: "t4",
        type: "note",
        content: "Cuddly and calm before sensory bin. Very sweet mood all morning.",
        time: "10:55 am",
        category: "play",
      },
    ],
  },
  {
    day: "Wednesday",
    date: "May 13",
    isToday: false,
    moments: [
      {
        id: "w1",
        type: "photo",
        content: "Water table in the backyard — completely soaked and absolutely ecstatic",
        time: "10:30 am",
        imageUrl: "https://picsum.photos/seed/water5/400/500",
        category: "outdoor",
      },
      {
        id: "w2",
        type: "milestone",
        content: "Climbed the full staircase unassisted for the first time — looked so proud at the top 🏔️",
        time: "3:45 pm",
        category: "learning",
      },
      {
        id: "w3",
        type: "note",
        content: "Best nap of the month — 1hr 45min. Woke up glowing and in the best mood.",
        time: "2:15 pm",
        category: "nap",
      },
      {
        id: "w4",
        type: "photo",
        content: "Brown Bear for the fourth time today — he never gets bored of it 📖",
        time: "4:00 pm",
        imageUrl: "https://picsum.photos/seed/book7/400/500",
        category: "learning",
      },
    ],
  },
  {
    day: "Tuesday",
    date: "May 12",
    isToday: false,
    moments: [
      {
        id: "tu1",
        type: "photo",
        content: "Farmer's market morning — so curious about every texture and smell",
        time: "9:15 am",
        imageUrl: "https://picsum.photos/seed/market6/400/500",
        category: "outdoor",
      },
      {
        id: "tu2",
        type: "milestone",
        content: "Stacked 6 blocks before the big dramatic knockdown — new personal best 🏗️",
        time: "11:00 am",
        category: "play",
      },
      {
        id: "tu3",
        type: "note",
        content: "Tried avocado again — ate 3 bites without making the face. Real progress.",
        time: "12:30 pm",
        category: "meal",
      },
      {
        id: "tu4",
        type: "photo",
        content: "Oliver playdate — sweet parallel play all afternoon",
        time: "3:30 pm",
        imageUrl: "https://picsum.photos/seed/playdate17/400/500",
        category: "play",
      },
    ],
  },
  {
    day: "Monday",
    date: "May 11",
    isToday: false,
    moments: [
      {
        id: "mo1",
        type: "photo",
        content: "Morning light and warm oatmeal — the best little sleepy face",
        time: "8:30 am",
        imageUrl: "https://picsum.photos/seed/morning8/400/500",
        category: "meal",
      },
      {
        id: "mo2",
        type: "milestone",
        content: "First social wave — 'bye bye' to the mailman, completely unprompted 👋",
        time: "11:00 am",
        category: "learning",
      },
      {
        id: "mo3",
        type: "note",
        content: "Such a calm Monday. Long outdoor walk, perfect nap, easy bedtime. Some days just flow.",
        time: "7:30 pm",
        category: "outdoor",
      },
    ],
  },
  {
    day: "Friday",
    date: "May 9",
    isToday: false,
    moments: [
      {
        id: "fr1",
        type: "photo",
        content: "Library story time — completely mesmerized by the puppet show",
        time: "10:00 am",
        imageUrl: "https://picsum.photos/seed/library15/400/500",
        category: "learning",
      },
      {
        id: "fr2",
        type: "milestone",
        content: "Clapped along to the song at library — first time clapping on cue! Elena nearly cried 👏",
        time: "10:45 am",
        category: "learning",
      },
      {
        id: "fr3",
        type: "note",
        content: "Post-library energy was high. Great appetite at lunch — ate absolutely everything.",
        time: "12:00 pm",
        category: "meal",
      },
    ],
  },
  {
    day: "Thursday",
    date: "May 8",
    isToday: false,
    moments: [
      {
        id: "th1",
        type: "photo",
        content: "First splash pad visit of the season — couldn't stop laughing",
        time: "11:00 am",
        imageUrl: "https://picsum.photos/seed/splashpad/400/500",
        category: "outdoor",
      },
      {
        id: "th2",
        type: "milestone",
        content: "Ran — actually ran — directly towards the sprinklers. First real running gait! 🏃",
        time: "11:30 am",
        category: "outdoor",
      },
      {
        id: "th3",
        type: "note",
        content: "Refused the sun hat for exactly 4 minutes then fully accepted it. Character development.",
        time: "11:15 am",
        category: "outdoor",
      },
    ],
  },
]

// ── Favorite Memories ────────────────────────────────────────────────────────

export const favoriteMemories = [
  {
    id: "f1",
    type: "photo" as const,
    content: "First steps — three wobbles and a fall right into our arms",
    date: "March 15, 2026",
    imageUrl: "https://picsum.photos/seed/firststeps/600/800",
    isFeatured: true,
  },
  {
    id: "f2",
    type: "photo" as const,
    content: "Six months old and already obsessed with the dog",
    date: "May 14, 2025",
    imageUrl: "https://picsum.photos/seed/sixmonths/400/400",
    isFeatured: false,
  },
  {
    id: "f3",
    type: "milestone" as const,
    content: "First word: 'Dada' — at 11 months, unprompted, in the kitchen on a Sunday morning",
    date: "December 20, 2025",
    isFeatured: false,
  },
  {
    id: "f4",
    type: "photo" as const,
    content: "Beach trip — first time feeling sand between little toes",
    date: "January 8, 2026",
    imageUrl: "https://picsum.photos/seed/beachbaby/400/500",
    isFeatured: false,
  },
  {
    id: "f5",
    type: "photo" as const,
    content: "The look on his face when he first saw the Christmas tree lights",
    date: "December 25, 2025",
    imageUrl: "https://picsum.photos/seed/xmasbaby/400/500",
    isFeatured: false,
  },
  {
    id: "f6",
    type: "milestone" as const,
    content: "First full night of sleep — 8 hours straight. We cried more than he did.",
    date: "October 12, 2025",
    isFeatured: false,
  },
]

// ── Recent Memories (full 2-week history, newest first) ──────────────────────

export interface MemoryEvent {
  id: string
  type: "photo" | "note" | "milestone"
  content: string
  category: ActivityCategory
  date: string
  time: string
  imageUrl?: string
  createdBy: "nanny" | "parent"
  isFavorite?: boolean
}

export const recentMemories: MemoryEvent[] = [
  // May 14 — Today
  { id: "r1",  type: "photo",     content: "First time down the big slide by himself — pure pride",            category: "outdoor",  date: "Today",   time: "9:47 am",  imageUrl: "https://picsum.photos/seed/baby1/400/600",      createdBy: "nanny" },
  { id: "r2",  type: "milestone", content: "Said 'more' clearly — first functional word! 🌟",                  category: "learning", date: "Today",   time: "10:15 am", createdBy: "nanny" },
  { id: "r3",  type: "photo",     content: "12 minutes on stacking rings — serious focus face on",              category: "play",     date: "Today",   time: "11:20 am", imageUrl: "https://picsum.photos/seed/toddler2/400/600",    createdBy: "nanny" },
  // May 13
  { id: "r4",  type: "milestone", content: "Climbed the full staircase unassisted for the first time 🏔️",     category: "learning", date: "May 13",  time: "3:45 pm",  createdBy: "nanny",  isFavorite: true },
  { id: "r5",  type: "photo",     content: "Water table in the backyard — completely soaked, zero regrets",    category: "outdoor",  date: "May 13",  time: "10:30 am", imageUrl: "https://picsum.photos/seed/water5/400/500",     createdBy: "nanny" },
  { id: "r6",  type: "note",      content: "1hr 45min nap — best sleep of the month. Woke up glowing.",        category: "nap",      date: "May 13",  time: "2:15 pm",  createdBy: "nanny" },
  // May 12
  { id: "r7",  type: "photo",     content: "Farmer's market morning — so curious about everything",            category: "outdoor",  date: "May 12",  time: "9:15 am",  imageUrl: "https://picsum.photos/seed/market6/400/500",    createdBy: "nanny" },
  { id: "r8",  type: "milestone", content: "Stacked 6 blocks — new personal record 🏗️",                       category: "play",     date: "May 12",  time: "11:00 am", createdBy: "nanny" },
  { id: "r9",  type: "photo",     content: "Oliver playdate — sweet side-by-side play",                        category: "play",     date: "May 12",  time: "3:30 pm",  imageUrl: "https://picsum.photos/seed/playdate17/400/500", createdBy: "nanny" },
  // May 11
  { id: "r10", type: "milestone", content: "First social wave — 'bye bye' to the mailman, unprompted 👋",      category: "learning", date: "May 11",  time: "11:00 am", createdBy: "nanny" },
  { id: "r11", type: "photo",     content: "Morning light + warm oatmeal — best sleepy face",                  category: "meal",     date: "May 11",  time: "8:30 am",  imageUrl: "https://picsum.photos/seed/morning8/400/500",   createdBy: "parent" },
  { id: "r12", type: "note",      content: "Such a calm Monday. Long walk, perfect nap, easy bedtime. Some days just flow.", category: "outdoor", date: "May 11", time: "7:30 pm", createdBy: "parent" },
  // May 9 — Library Friday
  { id: "r13", type: "photo",     content: "Library story time — mesmerized by the puppet show",               category: "learning", date: "May 9",   time: "10:00 am", imageUrl: "https://picsum.photos/seed/library15/400/500",  createdBy: "nanny" },
  { id: "r14", type: "milestone", content: "First time clapping on cue during the library song 👏",            category: "learning", date: "May 9",   time: "10:45 am", createdBy: "nanny" },
  { id: "r15", type: "note",      content: "Post-library energy was incredible. Ate everything at lunch.",     category: "meal",     date: "May 9",   time: "12:00 pm", createdBy: "nanny" },
  // May 8 — Splash Pad
  { id: "r16", type: "photo",     content: "Splash pad debut — couldn't stop laughing at the sprinklers",     category: "outdoor",  date: "May 8",   time: "11:00 am", imageUrl: "https://picsum.photos/seed/splashpad/400/500",  createdBy: "nanny", isFavorite: true },
  { id: "r17", type: "milestone", content: "First real running gait — ran directly into the sprinklers 🏃",   category: "outdoor",  date: "May 8",   time: "11:30 am", createdBy: "nanny" },
  // May 7
  { id: "r18", type: "photo",     content: "Sensory bin with dried beans — deep concentration mode",          category: "play",     date: "May 7",   time: "11:00 am", imageUrl: "https://picsum.photos/seed/sensorybin/400/500", createdBy: "nanny" },
  { id: "r19", type: "note",      content: "Huge language day — pointed at 8 different objects and waited for their names.", category: "learning", date: "May 7", time: "2:00 pm", createdBy: "nanny" },
  // May 6 — Oliver Tuesday
  { id: "r20", type: "photo",     content: "Oliver playdate — shared the sandbox bucket without prompting",   category: "play",     date: "May 6",   time: "2:30 pm",  imageUrl: "https://picsum.photos/seed/sandbox12/400/500",  createdBy: "nanny" },
  { id: "r21", type: "note",      content: "Sweet potato for the first time — 6 bites! New favourite.",       category: "meal",     date: "May 6",   time: "12:15 pm", createdBy: "nanny" },
  // May 5
  { id: "r22", type: "photo",     content: "First sidewalk chalk scribbles on the patio",                     category: "outdoor",  date: "May 5",   time: "10:30 am", imageUrl: "https://picsum.photos/seed/chalk22/400/500",    createdBy: "nanny" },
  { id: "r23", type: "milestone", content: "First intentional scribble with sidewalk chalk — held it correctly 🖍️", category: "play", date: "May 5", time: "10:45 am", createdBy: "nanny" },
  // May 2 — Library Friday
  { id: "r24", type: "photo",     content: "Friday library — grabbed a book and walked it to the reading mat himself", category: "learning", date: "May 2", time: "10:15 am", imageUrl: "https://picsum.photos/seed/library15/400/600", createdBy: "nanny" },
  { id: "r25", type: "note",      content: "Starting to show real preferences — always picks the blue cup. Every single time.", category: "play", date: "May 2", time: "3:00 pm", createdBy: "nanny" },
  // May 1
  { id: "r26", type: "photo",     content: "May 1st morning walk — noticed the birds for the first time",     category: "outdoor",  date: "May 1",   time: "9:00 am",  imageUrl: "https://picsum.photos/seed/morning8/400/600",   createdBy: "parent" },
  { id: "r27", type: "note",      content: "Two weeks of consistent outdoor morning walks is paying off. Calmer afternoons, better sleep.", category: "outdoor", date: "May 1", time: "8:00 pm", createdBy: "parent" },
]

// ── Daily Summaries (past 5 days) ────────────────────────────────────────────

export interface DailySummary {
  date: string
  dateLabel: string
  headline: string
  summary: string
  highlights: string[]
}

export const dailySummaries: DailySummary[] = [
  {
    date: "2026-05-13",
    dateLabel: "Yesterday",
    headline: "A breakthrough day",
    summary: "Mateo climbed the full staircase unassisted and knew exactly how big that was. Water table in the morning, the longest nap of the month in the afternoon, and a calm reading session to close the day. Elena called it one of the best days in weeks.",
    highlights: ["Stairs milestone 🏔️", "1h 45min nap record 💤", "Water table 💦"],
  },
  {
    date: "2026-05-12",
    dateLabel: "Tuesday",
    headline: "Market morning + Oliver",
    summary: "Farmer's market set a great tone — lots of sensory input and vendor interaction. A 6-block tower record before lunch, then Oliver came over for parallel play in the afternoon. Elena noted he's starting to acknowledge other kids more directly.",
    highlights: ["6-block tower record 🏗️", "Oliver playdate 👦", "Tried avocado 🥑"],
  },
  {
    date: "2026-05-11",
    dateLabel: "Monday",
    headline: "Gentle start, big wave",
    summary: "A calmer Monday after the weekend. The highlight: an unprompted 'bye bye' wave to the mail carrier — first time he's used a gesture socially without any prompting. Long outdoor walk, excellent nap, and Sofia noted bedtime was unusually smooth.",
    highlights: ["First social wave 👋", "Long outdoor walk 🌳", "Easy bedtime 🌙"],
  },
  {
    date: "2026-05-09",
    dateLabel: "Friday",
    headline: "Library magic",
    summary: "Friday library day and the puppet show stopped Mateo completely in his tracks. Elena reported he didn't move for 8 full minutes — remarkable for 18 months. Clapped along to the song unprompted for the first time. Strong appetite all day.",
    highlights: ["Puppet show focus 🎭", "First clapping on cue 👏", "Great appetite 🍽️"],
  },
  {
    date: "2026-05-08",
    dateLabel: "Thursday",
    headline: "Splash pad debut",
    summary: "The splash pad opened for the season and Mateo ran — genuinely ran — directly into the sprinklers. First time showing a real running gait. Refused the sun hat briefly then accepted it. High energy burned off by noon, then a 100-minute nap.",
    highlights: ["First real run 🏃", "Splash pad debut 💦", "100-min nap 💤"],
  },
]
