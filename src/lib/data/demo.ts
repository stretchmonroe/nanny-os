// ── Family ───────────────────────────────────────────────────────────────────

export const child = {
  name: "Mateo",
  fullName: "Mateo Rivera",
  age: "18 months",
  birthDate: "November 14, 2024",
  emoji: "🧒",
  focus: "Language & Communication",
  mood: "😄",
  moodLabel: "Happy",
}

export const family = {
  parents: ["Sofia Rivera", "Marco Rivera"],
  nanny: "Elena Chen",
}

// ── Today's Schedule (May 14, 2026 — Thursday) ──────────────────────────────

export const schedule = [
  { id: "1", time: "07:30", title: "Breakfast",       type: "meal"     as const, done: true,  loggedBy: "nanny"  as const, notes: "Scrambled eggs with cheddar + banana — cleared the plate"       },
  { id: "2", time: "08:45", title: "Morning Park",    type: "outdoor"  as const, done: true,  loggedBy: "nanny"  as const, notes: "45 min — first time down the big slide solo"                     },
  { id: "3", time: "10:00", title: "Morning Snack",   type: "meal"     as const, done: true,  loggedBy: "nanny"  as const, notes: "Rice cakes + mango — said 'more' for the first time! 🌟"        },
  { id: "4", time: "10:30", title: "Sensory Bin Play",type: "play"     as const, done: false, active: true, loggedBy: "nanny" as const, notes: "Rice bin with cups, scoops, and small safari animals" },
  { id: "5", time: "12:00", title: "Lunch",           type: "meal"     as const, done: false, notes: "Avocado toast + blueberries + cheese stick"                      },
  { id: "6", time: "12:45", title: "Nap",             type: "nap"      as const, done: false, notes: "Target 90 min — blackout curtains + white noise on"              },
  { id: "7", time: "14:30", title: "Afternoon Snack", type: "meal"     as const, done: false, notes: "Yogurt with soft berries"                                        },
  { id: "8", time: "15:00", title: "Reading Time",    type: "learning" as const, done: false, notes: "Brown Bear + new Pete the Cat book"                              },
]

// ── Moments Carousel (home screen) ──────────────────────────────────────────

export const moments = [
  { id: "1", type: "photo" as const, content: "First time down the big slide by himself — pure pride on his face",                       time: "9:47 am",  imageUrl: "https://picsum.photos/seed/baby1/400/600",    createdBy: "nanny"  },
  { id: "2", type: "note"  as const, content: "Said 'more' clearly for the first time during snack! 🌟 First functional word — this is huge.", time: "10:15 am", createdBy: "nanny"  },
  { id: "3", type: "photo" as const, content: "12 straight minutes on stacking rings — new personal focus record",                        time: "11:20 am", imageUrl: "https://picsum.photos/seed/toddler2/400/600",  createdBy: "nanny"  },
  { id: "4", type: "note"  as const, content: "High energy at the park this morning — did 3 full laps before even touching the swings. 🔥", time: "9:15 am",  createdBy: "nanny"  },
  { id: "5", type: "photo" as const, content: "Pre-sensory bin cuddle — the calm before the rice storm",                                  time: "10:55 am", imageUrl: "https://picsum.photos/seed/cuddle3/400/600",   createdBy: "nanny"  },
  { id: "6", type: "note"  as const, content: "Sleep has been incredible this week — out within 8 minutes every single night.",           time: "Yesterday", createdBy: "parent" },
]

// ── Grocery List — current week ───────────────────────────────────────────────

export const groceryItems = [
  { id: "g1",  name: "Oatmeal (quick oats)",        completed: true  },
  { id: "g2",  name: "Mango (2 ripe)",               completed: true  },
  { id: "g3",  name: "Eggs × 12",                    completed: true  },
  { id: "g4",  name: "Babybel cheese wheels",        completed: true  },
  { id: "g5",  name: "Blueberry puffs (Happy Baby)", completed: true  },
  { id: "g6",  name: "Applesauce pouches",           completed: true  },
  { id: "g7",  name: "Avocado (× 3)",               completed: false },
  { id: "g8",  name: "Banana bunch",                completed: false },
  { id: "g9",  name: "Rice cakes (unsalted)",        completed: false },
  { id: "g10", name: "Full-fat plain yogurt",        completed: false },
  { id: "g11", name: "Blueberries (pint)",           completed: false },
  { id: "g12", name: "Sweet potato (× 2)",           completed: false },
  { id: "g13", name: "Whole milk (1 gal)",           completed: false },
  { id: "g14", name: "Baby spinach",                 completed: false },
]

// ── Grocery List — last week (all completed) ──────────────────────────────────

export const pastGroceryItems = [
  { id: "pg1",  name: "Whole milk (1 gal)",             completed: true },
  { id: "pg2",  name: "Greek yogurt pouches × 6",       completed: true },
  { id: "pg3",  name: "Frozen peas (for steaming)",      completed: true },
  { id: "pg4",  name: "Whole grain bread",               completed: true },
  { id: "pg5",  name: "String cheese sticks × 12",       completed: true },
  { id: "pg6",  name: "Vanilla puffs (Happy Baby)",      completed: true },
  { id: "pg7",  name: "Bananas (bunch)",                 completed: true },
  { id: "pg8",  name: "Avocado × 2",                     completed: true },
  { id: "pg9",  name: "Baby carrots (for steaming)",      completed: true },
  { id: "pg10", name: "Cheddar block (for cubes)",        completed: true },
  { id: "pg11", name: "Sweet potato × 3",                completed: true },
  { id: "pg12", name: "Applesauce pouches × 6",           completed: true },
]

// ── AI Suggestion (today) ────────────────────────────────────────────────────

export const aiSuggestion = {
  title: "Wind down before lunch",
  body: "Mateo's been running high energy all morning — park, snack milestone, sensory bin. A brief quiet activity before lunch will set up his best nap of the week.",
  activity: "Sensory Bin with Rice & Safari Animals",
  duration: "20–30 min",
  developmentalNote: "Filling and emptying containers builds the bilateral hand coordination he'll need for self-feeding — right on the edge of this milestone at 18 months.",
  developmentalFocus: "Fine Motor Skills",
  developmentalReason: "At 18 months, children are refining bilateral hand use and cause-and-effect understanding through repetitive object manipulation. Fill-and-dump play directly supports the fine motor precision that feeds into self-feeding and early tool use — patterns that typically consolidate in this window.",
  guidanceSource: "CDC 15–18 month milestones" as const,
  ageRange: "15–24 months",
  flagForApproval: false,
}

// ── Focus Areas ───────────────────────────────────────────────────────────────

export const focusAreas = [
  { id: "language",     label: "Language",     emoji: "🗣️" },
  { id: "movement",     label: "Movement",     emoji: "🏃" },
  { id: "sensory",      label: "Sensory",      emoji: "🫧" },
  { id: "creativity",   label: "Creativity",   emoji: "🎨" },
  { id: "independence", label: "Independence", emoji: "🏠" },
] as const

export type FocusArea = (typeof focusAreas)[number]["id"]

// ── Planned Activities ────────────────────────────────────────────────────────

export type MontessoriArea = "language" | "sensory" | "movement" | "practical-life" | "creativity"

export interface PlannedActivity {
  id: string
  title: string
  area: MontessoriArea
  description: string
  duration: string
  materials: string[]
  status: "pending" | "active" | "done" | "skipped"
  guidanceSource?: string
  alternativeTitle?: string
  alternativeDescription?: string
}

export const dailyActivities: PlannedActivity[] = [
  {
    id: "act1",
    title: "Object naming walk",
    area: "language",
    description: "Point to 10 things on your outdoor walk and pause each time. Let Mateo observe and touch when safe — narrate everything.",
    duration: "15–20 min",
    materials: [],
    status: "done",
    guidanceSource: "CDC 15–18 month milestones",
    alternativeTitle: "Indoor pointing game",
    alternativeDescription: "Point to objects around the house and name them. Pause and wait — let him point back.",
  },
  {
    id: "act2",
    title: "Pouring water station",
    area: "practical-life",
    description: "Two small containers at the water table or sink. Support self-directed pouring — resist correcting the spills.",
    duration: "20–30 min",
    materials: ["2 containers", "small cup", "towel nearby"],
    status: "active",
    guidanceSource: "AAP early childhood guidance",
    alternativeTitle: "Dry pouring with beans",
    alternativeDescription: "Same setup with dried beans instead of water — less mess, same fine motor benefit.",
  },
  {
    id: "act3",
    title: "Sorting by color",
    area: "sensory",
    description: "3 bowls, 3 colors of blocks or balls. Demonstrate once then step back and let him explore the idea on his own.",
    duration: "15–20 min",
    materials: ["3 small bowls", "colored blocks or balls"],
    status: "pending",
    guidanceSource: "CDC 18–24 month milestones",
    alternativeTitle: "Shape sorter",
    alternativeDescription: "Classic shape sorter with verbal encouragement — name each shape as he handles it.",
  },
]

// ── Pattern Insights ─────────────────────────────────────────────────────────

export type PatternCategory = "sleep" | "mood" | "engagement" | "energy" | "language" | "social"
export type PatternConfidence = "emerging" | "consistent"

export interface PatternInsight {
  id: string
  headline: string
  detail: string
  emoji: string
  category: PatternCategory
  confidence: PatternConfidence
  suggestion?: string
}

export const demoPatterns: PatternInsight[] = [
  {
    id: "p1",
    headline: "Outdoor mornings improve naps",
    detail: "On days Mateo has outdoor time before lunch, his nap tends to start within minutes and run longer.",
    emoji: "🌿",
    category: "sleep",
    confidence: "consistent",
    suggestion: "Keep morning outdoor time before nap prep when the schedule allows.",
  },
  {
    id: "p2",
    headline: "Language blooms after lunch",
    detail: "Pointing, naming games, and new words almost always surface in the post-lunch quiet window.",
    emoji: "💬",
    category: "language",
    confidence: "emerging",
    suggestion: "Books and naming walks hit differently right after lunch — that window is golden.",
  },
  {
    id: "p3",
    headline: "Sensory play steadies afternoon mood",
    detail: "Afternoons that include sensory activity tend to flow more smoothly toward dinnertime.",
    emoji: "✨",
    category: "mood",
    confidence: "emerging",
  },
]

// ── Insights & Patterns ──────────────────────────────────────────────────────

export const todayInsights = [
  "The 'more' milestone is significant — intentional functional communication is accelerating. Expect 2–4 new words in the coming weeks.",
  "Language exposure was especially strong during this morning's park walk — narrating objects and actions counts more than structured teaching at this age.",
  "Outdoor mornings this week have consistently produced the longest and deepest afternoon naps of the month.",
]

export const weeklyPatterns = {
  headline: "Language is taking off",
  observations: [
    "Two new communicative milestones this week: 'bye bye' Monday, 'more' today. Intentional communication is accelerating fast.",
    "Outdoor mornings → longer naps: the pattern has held all week. Worth protecting the morning schedule.",
    "Focus window is measurably lengthening — 12 min on stacking rings today, 8 min on puppet show Saturday. Attention is building.",
  ],
  trend: "positive" as const,
}

export const careNotes = [
  { icon: "💤", label: "Sleep",     note: "Naps averaging 95 min this week — best streak since February. Outdoor mornings are the clearest driver." },
  { icon: "🍽️", label: "Nutrition", note: "Appetite strong and expanding. Avocado accepted Tuesday, sweet potato last week, both now regulars." },
  { icon: "🌱", label: "Growth",    note: "Three communication milestones in 5 days: wave, clap-on-cue, 'more'. Language is the story right now." },
]

// ── Type Config ──────────────────────────────────────────────────────────────

export const typeConfig = {
  meal:     { label: "Meal",     color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",     dot: "bg-orange-400"  },
  outdoor:  { label: "Outdoor",  color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",                 dot: "bg-sky-400"     },
  play:     { label: "Play",     color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", dot: "bg-emerald-400" },
  nap:      { label: "Nap",      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",     dot: "bg-indigo-400"  },
  learning: { label: "Learning", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",     dot: "bg-violet-400"  },
}

// ── Memory / Journal page data ───────────────────────────────────────────────

export const aiJournalSummary = {
  headline: "A morning full of firsts",
  summary:
    "Mateo had an exceptional morning — first solo slide, a new word at snack, and 12 minutes of pure focused play with the stacking rings. Two weeks of outdoor mornings, consistent routines, and daily connection have built toward a day like today.",
  highlights: ["Said 'more' for the first time 🌟", "Big slide, solo 🛝", "12-min focus record 🧩", "Stairs milestone yesterday 🏔️"],
}

export type JournalMomentType = "photo" | "note" | "milestone" | "audio"
export type ActivityCategory  = "meal" | "outdoor" | "play" | "nap" | "learning"

export interface MomentReaction {
  emoji: string
  authors: ("nanny" | "parent")[]
}

export interface MomentReply {
  id: string
  author: "nanny" | "parent"
  content: string
  time: string
}

export interface JournalMoment {
  id: string
  type: JournalMomentType
  content: string
  time: string
  imageUrl?: string
  audioUrl?: string
  duration?: number
  category: ActivityCategory
  createdBy?: "nanny" | "parent"
  reactions?: MomentReaction[]
  replies?: MomentReply[]
}

export interface JournalDay {
  day: string
  date: string
  isToday: boolean
  moments: JournalMoment[]
}

// ── Weekly Journal (7 days: May 8–14) ───────────────────────────────────────

export const weeklyMoments: JournalDay[] = [
  {
    day: "Thursday", date: "Today · May 14", isToday: true,
    moments: [
      { id: "t1", type: "photo",     content: "First time down the big slide by himself — pure pride on that face",                time: "9:47 am",  imageUrl: "https://picsum.photos/seed/baby1/400/600",      category: "outdoor",  createdBy: "nanny"  },
      { id: "t2", type: "milestone", content: "Said 'more' clearly during snack — unprompted, first functional word! 🌟",           time: "10:15 am", category: "learning", createdBy: "nanny",
        reactions: [
          { emoji: "❤️", authors: ["nanny", "parent"] },
          { emoji: "🥹", authors: ["parent"] },
        ],
        replies: [
          { id: "r_t2_1", author: "parent" as const, content: "Oh my heart 🥹 This is the one we've been waiting for", time: "10:18 am" },
          { id: "r_t2_2", author: "nanny"  as const, content: "He said it three more times after snack. Lit up every single time 💛", time: "10:24 am" },
        ],
      },
      { id: "t3", type: "photo",     content: "12 straight minutes on stacking rings — new personal focus record",                  time: "11:20 am", imageUrl: "https://picsum.photos/seed/toddler2/400/500",    category: "play",     createdBy: "nanny"  },
      { id: "t3b", type: "photo",   content: "Sensory bin discovery — buried his whole forearm and couldn't stop grinning",           time: "11:50 am", imageUrl: "https://picsum.photos/seed/sensory3/400/400",    category: "play",     createdBy: "nanny"  },
      { id: "t_a1", type: "audio",   content: "He kept saying 'more' on repeat — I had to capture it before the moment passed", duration: 16, time: "10:22 am", category: "learning", createdBy: "nanny" as const },
      { id: "t4", type: "note",      content: "Cuddly and calm before sensory bin. Very sweet mood all morning.",                   time: "10:55 am", category: "play",     createdBy: "nanny",
        reactions: [{ emoji: "❤️", authors: ["parent"] }],
        replies: [
          { id: "r_t4_1", author: "parent" as const, content: "These calm moments are everything. Thank you for always catching them 🙏", time: "11:35 am" },
        ],
      },
    ],
  },
  {
    day: "Wednesday", date: "May 13", isToday: false,
    moments: [
      { id: "w1", type: "photo",     content: "Water table in the backyard — completely soaked and absolutely ecstatic",            time: "10:30 am", imageUrl: "https://picsum.photos/seed/water5/400/500",      category: "outdoor",  createdBy: "nanny"  },
      { id: "w2", type: "milestone", content: "Climbed the full staircase unassisted for the first time — so proud at the top 🏔️", time: "3:45 pm",  category: "learning", createdBy: "nanny"  },
      { id: "w_a1", type: "audio",  content: "The little triumph sound he made at the top — you could hear it in his whole body", duration: 13, time: "3:51 pm",  category: "learning", createdBy: "nanny" as const, imageUrl: "https://picsum.photos/seed/stairs_top/400/500" },
      { id: "w3", type: "note",      content: "Best nap of the month — 1hr 45min. Woke up glowing.",                               time: "2:15 pm",  category: "nap",      createdBy: "nanny"  },
      { id: "w4", type: "photo",     content: "Brown Bear for the fourth time today — he never gets bored of it 📖",               time: "4:00 pm",  imageUrl: "https://picsum.photos/seed/book7/400/500",       category: "learning", createdBy: "nanny"  },
      { id: "w4b", type: "photo",   content: "Puddle jumping in wellies after the water table — completely unstoppable",             time: "4:30 pm",  imageUrl: "https://picsum.photos/seed/wellies/400/500",     category: "outdoor",  createdBy: "nanny"  },
    ],
  },
  {
    day: "Tuesday", date: "May 12", isToday: false,
    moments: [
      { id: "tu1", type: "photo",     content: "Farmer's market morning — curious about every texture and smell",                  time: "9:15 am",  imageUrl: "https://picsum.photos/seed/market6/400/500",     category: "outdoor",  createdBy: "nanny"  },
      { id: "tu2", type: "milestone", content: "Stacked 6 blocks before the big dramatic knockdown — new personal best 🏗️",       time: "11:00 am", category: "play",     createdBy: "nanny"  },
      { id: "tu3", type: "note",      content: "Tried avocado again — 3 bites without making the face. Real progress.",            time: "12:30 pm", category: "meal",     createdBy: "nanny"  },
      { id: "tu4", type: "photo",     content: "Oliver playdate — he held that truck for 20 minutes straight",                     time: "3:30 pm",  imageUrl: "https://picsum.photos/seed/playdate17/400/500",  category: "play",     createdBy: "nanny"  },
    ],
  },
  {
    day: "Monday", date: "May 11", isToday: false,
    moments: [
      { id: "mo1", type: "photo",     content: "Morning light and warm oatmeal — the best little sleepy face",                    time: "8:30 am",  imageUrl: "https://picsum.photos/seed/morning8/400/500",    category: "meal",     createdBy: "parent" },
      { id: "mo2", type: "milestone", content: "First social wave — 'bye bye' to the mailman, completely unprompted 👋",           time: "11:00 am", category: "learning", createdBy: "nanny"  },
      { id: "mo3", type: "note",      content: "Such a calm Monday. Long outdoor walk, perfect nap, easy bedtime. Some days just flow.", time: "7:30 pm", category: "outdoor", createdBy: "parent" },
    ],
  },
  {
    day: "Sunday", date: "May 10", isToday: false,
    moments: [
      { id: "su1", type: "photo", content: "Family pancake morning — maple syrup on his nose, absolute happiness",                time: "8:45 am",  imageUrl: "https://picsum.photos/seed/pancake_fam/400/500", category: "meal",  createdBy: "parent" },
      { id: "su2", type: "note",  content: "Grandma came for the afternoon — ran to her the second she walked in. That recognition gets us every time.", time: "2:30 pm", category: "play", createdBy: "parent" },
      { id: "su3", type: "note",  content: "Marco did bedtime solo for the first time. Asleep in 9 minutes. He texted Sofia a photo of the monitor. So proud.", time: "7:15 pm", category: "nap", createdBy: "parent" },
    ],
  },
  {
    day: "Saturday", date: "May 9", isToday: false,
    moments: [
      { id: "sa1", type: "photo",     content: "Saturday library story time — mesmerized by the puppet show for 8 full minutes",  time: "10:00 am", imageUrl: "https://picsum.photos/seed/library15/400/500",   category: "learning", createdBy: "nanny"  },
      { id: "sa2", type: "milestone", content: "Clapped along to the song at library — first time clapping on cue! Elena nearly cried 👏", time: "10:45 am", category: "learning", createdBy: "nanny"  },
      { id: "sa_a1", type: "audio", content: "The giggle when the puppets appeared — completely uncontrolled, pure joy", duration: 21, time: "10:28 am", category: "learning", createdBy: "nanny" as const },
      { id: "sa3", type: "note",      content: "Post-library energy was high. Great appetite at lunch — ate absolutely everything.", time: "12:00 pm", category: "meal",     createdBy: "nanny"  },
    ],
  },
  {
    day: "Friday", date: "May 8", isToday: false,
    moments: [
      { id: "fr1", type: "photo",     content: "First splash pad visit of the season — couldn't stop laughing",                  time: "11:00 am", imageUrl: "https://picsum.photos/seed/splashpad/400/500",   category: "outdoor",  createdBy: "nanny"  },
      { id: "fr2", type: "milestone", content: "Ran — actually ran — directly towards the sprinklers. First real running gait! 🏃", time: "11:30 am", category: "outdoor",  createdBy: "nanny"  },
      { id: "fr3", type: "note",      content: "Refused the sun hat for exactly 4 minutes then fully accepted it. Character development.", time: "11:15 am", category: "outdoor",  createdBy: "nanny"  },
    ],
  },
]

// ── Favorite Memories ────────────────────────────────────────────────────────

export const favoriteMemories = [
  { id: "f1", type: "photo"     as const, content: "First steps — three wobbles and a fall right into our arms",                           date: "March 15, 2026",    imageUrl: "https://picsum.photos/seed/firststeps/600/800",   isFeatured: true,  createdBy: "parent" as const },
  { id: "f2", type: "photo"     as const, content: "Six months old and already obsessed with the dog",                                      date: "May 14, 2025",      imageUrl: "https://picsum.photos/seed/sixmonths/400/400",     isFeatured: false, createdBy: "parent" as const },
  { id: "f3", type: "milestone" as const, content: "First word: 'Dada' — at 11 months, unprompted, in the kitchen on a Sunday morning",     date: "December 20, 2025", isFeatured: false, createdBy: "parent" as const },
  { id: "f4", type: "photo"     as const, content: "Beach trip — first time feeling sand between little toes",                               date: "January 8, 2026",   imageUrl: "https://picsum.photos/seed/beachbaby/400/500",     isFeatured: false, createdBy: "parent" as const },
  { id: "f5", type: "photo"     as const, content: "The look on his face when he first saw the Christmas tree lights",                       date: "December 25, 2025", imageUrl: "https://picsum.photos/seed/xmasbaby/400/500",     isFeatured: false, createdBy: "parent" as const },
  { id: "f6", type: "milestone" as const, content: "First full night of sleep — 8 hours straight. We cried more than he did.",              date: "October 12, 2025",  isFeatured: false, createdBy: "parent" as const },
  { id: "f7", type: "photo"     as const, content: "First solid food — rice cereal face was somewhere between disgusted and delighted",      date: "April 14, 2025",    imageUrl: "https://picsum.photos/seed/firstfood/400/400",     isFeatured: false, createdBy: "parent" as const },
  { id: "f8", type: "photo"     as const, content: "First bath with rubber ducks — splashed for 35 minutes, pure heaven",                   date: "September 2, 2025", imageUrl: "https://picsum.photos/seed/bathducks/400/400",     isFeatured: false, createdBy: "parent" as const },
  { id: "f9", type: "milestone" as const, content: "Said 'Mama' for the first time — January 6th, right after waking up from a nap",       date: "January 6, 2026",   isFeatured: false, createdBy: "parent" as const },
]

// ── Recent Memories (full 2-week history, newest first) ──────────────────────

export interface MemoryEvent {
  id: string
  type: "photo" | "note" | "milestone" | "audio"
  content: string
  category: ActivityCategory
  date: string
  time: string
  imageUrl?: string
  audioUrl?: string
  duration?: number
  createdBy: "nanny" | "parent"
  isFavorite?: boolean
}

export const recentMemories: MemoryEvent[] = [
  // ── May 14 · Thursday (Today) ────────────────────────────────────────────
  { id: "r_a1", type: "audio",   content: "He kept saying 'more' on repeat — I had to capture it before the moment passed", duration: 16, category: "learning", date: "Today",  time: "10:22 am", createdBy: "nanny" as const },
  { id: "r1",  type: "photo",     content: "First time down the big slide by himself — pure pride on his face",                                                     category: "outdoor",  date: "Today",  time: "9:47 am",  imageUrl: "https://picsum.photos/seed/baby1/400/600",        createdBy: "nanny"  },
  { id: "r2",  type: "milestone", content: "Said 'more' clearly — first functional word! 🌟",                                                                       category: "learning", date: "Today",  time: "10:15 am", createdBy: "nanny",  isFavorite: true  },
  { id: "r3",  type: "photo",     content: "12 minutes on stacking rings — serious focus face the whole time",                                                       category: "play",     date: "Today",  time: "11:20 am", imageUrl: "https://picsum.photos/seed/toddler2/400/600",      createdBy: "nanny"  },
  { id: "r4",  type: "note",      content: "Cuddly and calm before sensory bin. Very sweet mood all morning.",                                                       category: "play",     date: "Today",  time: "10:55 am", createdBy: "nanny"  },

  // ── May 13 · Wednesday ───────────────────────────────────────────────────
  { id: "r_a2", type: "audio",   content: "The triumph sound at the top — you could hear it in his whole body", duration: 13, category: "learning", date: "May 13", time: "3:51 pm",  createdBy: "nanny" as const, imageUrl: "https://picsum.photos/seed/stairs_top/400/500" },
  { id: "r5",  type: "milestone", content: "Climbed the full staircase unassisted for the first time 🏔️",                                                           category: "learning", date: "May 13", time: "3:45 pm",  createdBy: "nanny",  isFavorite: true  },
  { id: "r6",  type: "photo",     content: "Water table in the backyard — completely soaked, zero regrets",                                                          category: "outdoor",  date: "May 13", time: "10:30 am", imageUrl: "https://picsum.photos/seed/water5/400/500",       createdBy: "nanny"  },
  { id: "r7",  type: "note",      content: "1hr 45min nap — best sleep of the month. Woke up glowing and immediately happy.",                                        category: "nap",      date: "May 13", time: "2:15 pm",  createdBy: "nanny"  },
  { id: "r8",  type: "photo",     content: "Brown Bear for the fourth time today — he never gets bored of it 📖",                                                    category: "learning", date: "May 13", time: "4:00 pm",  imageUrl: "https://picsum.photos/seed/book7/400/500",        createdBy: "nanny"  },
  { id: "r9",  type: "note",      content: "Elena texted Sofia mid-nap: 'He climbed the full stairs today. He knew it was a big deal.' Sofia screenshot it immediately.", category: "learning", date: "May 13", time: "1:55 pm", createdBy: "parent" },

  // ── May 12 · Tuesday ─────────────────────────────────────────────────────
  { id: "r10", type: "photo",     content: "Farmer's market morning — curious about every texture and smell",                                                        category: "outdoor",  date: "May 12", time: "9:15 am",  imageUrl: "https://picsum.photos/seed/market6/400/500",      createdBy: "nanny"  },
  { id: "r11", type: "milestone", content: "Stacked 6 blocks before the dramatic knockdown — new personal best 🏗️",                                                 category: "play",     date: "May 12", time: "11:00 am", createdBy: "nanny"  },
  { id: "r12", type: "note",      content: "Tried avocado again — 3 bites without making the face. Real progress on texture acceptance.",                            category: "meal",     date: "May 12", time: "12:30 pm", createdBy: "nanny"  },
  { id: "r13", type: "photo",     content: "Oliver playdate — Oliver gave him a truck and he carried it for 20 solid minutes",                                       category: "play",     date: "May 12", time: "3:30 pm",  imageUrl: "https://picsum.photos/seed/playdate17/400/500",   createdBy: "nanny"  },
  { id: "r13b", type: "photo",   content: "Building towers side by side — same obsession, finally playing next to each other",                                        category: "play",     date: "May 12", time: "3:55 pm",  imageUrl: "https://picsum.photos/seed/blocks2/400/400",      createdBy: "nanny"  },
  { id: "r14", type: "note",      content: "Starting to acknowledge Oliver directly — made eye contact and offered him a block. Not just parallel play anymore.",    category: "play",     date: "May 12", time: "4:15 pm",  createdBy: "nanny"  },

  // ── May 11 · Monday ──────────────────────────────────────────────────────
  { id: "r15", type: "milestone", content: "First social wave — 'bye bye' to the mailman, completely unprompted 👋",                                                 category: "learning", date: "May 11", time: "11:00 am", createdBy: "nanny"  },
  { id: "r16", type: "photo",     content: "Morning light and warm oatmeal — the best little sleepy face",                                                           category: "meal",     date: "May 11", time: "8:30 am",  imageUrl: "https://picsum.photos/seed/morning8/400/500",     createdBy: "parent" },
  { id: "r17", type: "note",      content: "Such a calm Monday. Long outdoor walk, perfect nap, easy bedtime. Some days just flow.",                                 category: "outdoor",  date: "May 11", time: "7:30 pm",  createdBy: "parent" },
  { id: "r18", type: "photo",     content: "Afternoon walk — found every puddle on the block and tested each one thoroughly",                                        category: "outdoor",  date: "May 11", time: "3:00 pm",  imageUrl: "https://picsum.photos/seed/walk_puddle/400/500",  createdBy: "nanny"  },

  // ── May 10 · Sunday (family day) ─────────────────────────────────────────
  { id: "r19", type: "photo", content: "Family pancake morning — maple syrup on his nose, pure happiness",                                                           category: "meal",     date: "May 10", time: "8:45 am",  imageUrl: "https://picsum.photos/seed/pancake_fam/400/500",  createdBy: "parent" },
  { id: "r20", type: "note",  content: "Grandma came for the afternoon — ran to her the second she walked in. That recognition gets us every time.",                 category: "play",     date: "May 10", time: "2:30 pm",  createdBy: "parent" },
  { id: "r21", type: "note",  content: "Marco did bedtime solo for the first time. Asleep in 9 minutes. He texted me a photo of the monitor. He was so proud. — Sofia", category: "nap", date: "May 10", time: "7:15 pm", createdBy: "parent" },

  // ── May 9 · Saturday (library) ────────────────────────────────────────────
  { id: "r22", type: "photo",     content: "Saturday library story time — puppet show stopped him in his tracks for 8 full minutes",                                 category: "learning", date: "May 9",  time: "10:00 am", imageUrl: "https://picsum.photos/seed/library15/400/500",    createdBy: "nanny"  },
  { id: "r23", type: "milestone", content: "First time clapping on cue during the library song 👏",                                                                  category: "learning", date: "May 9",  time: "10:45 am", createdBy: "nanny"  },
  { id: "r24", type: "note",      content: "Post-library energy was high — ate absolutely everything at lunch, then crashed for 90 minutes.",                        category: "meal",     date: "May 9",  time: "12:00 pm", createdBy: "nanny"  },

  // ── May 8 · Friday (splash pad) ──────────────────────────────────────────
  { id: "r25", type: "photo",     content: "Splash pad debut — couldn't stop laughing at the sprinklers",                                                            category: "outdoor",  date: "May 8",  time: "11:00 am", imageUrl: "https://picsum.photos/seed/splashpad/400/500",    createdBy: "nanny",  isFavorite: true },
  { id: "r26", type: "milestone", content: "First real running gait — ran directly into the sprinklers 🏃",                                                          category: "outdoor",  date: "May 8",  time: "11:30 am", createdBy: "nanny"  },
  { id: "r27", type: "note",      content: "Refused the sun hat for exactly 4 minutes then fully accepted it. Character development.",                               category: "outdoor",  date: "May 8",  time: "11:15 am", createdBy: "nanny"  },

  // ── May 7 · Thursday ─────────────────────────────────────────────────────
  { id: "r28", type: "photo",     content: "Sensory bin with dried beans — nearly 18 minutes of deep focus",                                                         category: "play",     date: "May 7",  time: "11:00 am", imageUrl: "https://picsum.photos/seed/sensorybin/400/500",   createdBy: "nanny"  },
  { id: "r29", type: "note",      content: "Huge language day — pointed at 8 different objects in a row, each time waiting for Elena to name them.",                 category: "learning", date: "May 7",  time: "2:00 pm",  createdBy: "nanny"  },
  { id: "r30", type: "photo",     content: "Afternoon stacking rings — worked through all 7 sizes, found a real groove",                                             category: "play",     date: "May 7",  time: "3:30 pm",  imageUrl: "https://picsum.photos/seed/rings_stack/400/500",  createdBy: "nanny"  },

  // ── May 6 · Wednesday ────────────────────────────────────────────────────
  { id: "r31", type: "photo",     content: "Oliver playdate — handed him the sandbox bucket without any prompting at all",                                           category: "play",     date: "May 6",  time: "2:30 pm",  imageUrl: "https://picsum.photos/seed/sandbox12/400/500",    createdBy: "nanny"  },
  { id: "r32", type: "note",      content: "Sweet potato for the first time — 6 bites! Zero resistance. Different texture than he usually accepts. A new favourite forming.", category: "meal", date: "May 6", time: "12:15 pm", createdBy: "nanny" },
  { id: "r33", type: "note",      content: "Spotted a dog on the walk home — stopped cold, pointed, looked at Elena. The naming game is clicking.",                  category: "outdoor",  date: "May 6",  time: "4:45 pm",  createdBy: "nanny"  },

  // ── May 5 · Tuesday ──────────────────────────────────────────────────────
  { id: "r34", type: "photo",     content: "First sidewalk chalk scribbles on the patio — held it correctly on the second try",                                      category: "outdoor",  date: "May 5",  time: "10:30 am", imageUrl: "https://picsum.photos/seed/chalk22/400/500",      createdBy: "nanny"  },
  { id: "r35", type: "milestone", content: "First intentional chalk scribble — correct grip, deliberate arm movement 🖍️",                                            category: "play",     date: "May 5",  time: "10:45 am", createdBy: "nanny"  },
  { id: "r36", type: "note",      content: "Garbage truck on the morning walk: stood completely still watching it for 3 full minutes. Total wonder. Total seriousness.", category: "outdoor", date: "May 5", time: "9:30 am", createdBy: "nanny" },

  // ── May 4 · Monday (harder day) ──────────────────────────────────────────
  { id: "r37", type: "note",  content: "Overtired Monday — fussier than usual at breakfast, short 55-min nap, lower appetite. Needed a reset after an active weekend.", category: "meal",    date: "May 4",  time: "8:30 am",  createdBy: "nanny"  },
  { id: "r38", type: "photo", content: "Even on tough days he finds his thing — blocks and books for 40 quiet minutes",                                              category: "play",     date: "May 4",  time: "2:30 pm",  imageUrl: "https://picsum.photos/seed/blocks_quiet/400/500", createdBy: "nanny"  },
  { id: "r39", type: "note",  content: "Short walk at 3:30 fully reset his mood. Came home a different kid. Good reminder: fresh air solves a lot.",                category: "outdoor",  date: "May 4",  time: "4:00 pm",  createdBy: "nanny"  },

  // ── May 3 · Sunday ───────────────────────────────────────────────────────
  { id: "r40", type: "photo", content: "Park morning with Marco — the Saturday dad tradition is forming nicely",                                                     category: "outdoor",  date: "May 3",  time: "10:00 am", imageUrl: "https://picsum.photos/seed/park_marco/400/500",   createdBy: "parent" },
  { id: "r41", type: "note",  content: "Low-energy Sunday — not sick, just quieter. Sometimes toddlers need a rest day. We let him set the pace.",                  category: "nap",      date: "May 3",  time: "2:00 pm",  createdBy: "parent" },
  { id: "r42", type: "note",  content: "Sofia and Mateo did 6 books in a row this afternoon. He chose every one. Reading is becoming their ritual.",                 category: "learning", date: "May 3",  time: "4:00 pm",  createdBy: "parent" },

  // ── May 2 · Saturday (library) ────────────────────────────────────────────
  { id: "r43", type: "photo",     content: "Saturday library — walked in, grabbed a book, walked it straight to the reading mat himself",                            category: "learning", date: "May 2",  time: "10:15 am", imageUrl: "https://picsum.photos/seed/library_books/400/600", createdBy: "nanny" },
  { id: "r44", type: "note",      content: "Always picks the blue cup. Every single time. Preferences are real and he defends them.",                                category: "play",     date: "May 2",  time: "3:00 pm",  createdBy: "nanny"  },
  { id: "r45", type: "milestone", content: "Walked into library and went directly to the reading mat without any prompting — spatial memory forming 🗺️",             category: "learning", date: "May 2",  time: "10:00 am", createdBy: "nanny"  },
  { id: "r46", type: "note",      content: "Started reaching for his jacket at 8:30 before Elena mentioned going out — recognizing the daily routine.",               category: "learning", date: "May 2",  time: "8:35 am",  createdBy: "nanny"  },

  // ── May 1 · Friday ───────────────────────────────────────────────────────
  { id: "r47", type: "photo",     content: "May 1st morning walk — stopped and pointed at birds in a tree for the first time",                                       category: "outdoor",  date: "May 1",  time: "9:00 am",  imageUrl: "https://picsum.photos/seed/birds_walk/400/600",   createdBy: "parent" },
  { id: "r48", type: "note",      content: "Two weeks of consistent outdoor mornings is paying off. Calmer afternoons, more predictable sleep, better appetite.",    category: "outdoor",  date: "May 1",  time: "8:00 pm",  createdBy: "parent" },
  { id: "r49", type: "milestone", content: "First clear head-shake 'no' — deliberate, not just crying. A real communication leap 🙅",                                category: "learning", date: "May 1",  time: "1:30 pm",  createdBy: "nanny"  },
]

// ── Together: Suggestions & Approvals ────────────────────────────────────────

export type SuggestionType   = "activity" | "food" | "schedule"
export type SuggestionStatus = "pending"  | "approved" | "rejected"

export interface SuggestionReply {
  id: string
  suggestion_id: string
  author: "nanny" | "parent"
  content: string
  created_at: string
}

export interface Suggestion {
  id: string
  type: SuggestionType
  title: string
  description: string
  reason: string
  created_by: "nanny" | "parent"
  status: SuggestionStatus
  response_note?: string
  child_id: string
  created_at: string
  // Workflow trail
  scheduledDay?:   string                    // "Today" | "Tomorrow" | weekday name
  outcomeRating?:  "great" | "noted"
  outcomeNote?:    string
  researchBacked?: boolean                   // came from Sprout research
}

export const demoSuggestions: Suggestion[] = [
  {
    id: "s1",
    type: "food",
    title: "Hummus with veggie sticks",
    description: "Mateo's been really into dipping things lately. Hummus with cucumber and carrot sticks for afternoon snack could be a lovely new ritual.",
    reason: "Introduces chickpeas as a protein source and builds fine motor skills through self-directed dipping and grasping.",
    created_by: "nanny",
    status: "pending",
    child_id: "default",
    created_at: "2026-05-16T10:30:00Z",
  },
  {
    id: "s2",
    type: "activity",
    title: "Sensory water play before lunch",
    description: "A small tub of water with cups and spoons set up in the backyard. About 20 minutes before the 11am nap prep — calm, contained, and he loves it.",
    reason: "Water play is deeply calming and supports cause-and-effect understanding at 18 months. The scooping motion also builds bilateral hand coordination.",
    created_by: "nanny",
    status: "approved",
    response_note: "Love this! Let's make it a Tuesday ritual. 💛",
    child_id: "default",
    created_at: "2026-05-15T09:00:00Z",
  },
  {
    id: "s3",
    type: "schedule",
    title: "Shift nap to 12:30",
    description: "Mateo's been showing tired cues around 12:15 lately instead of 1pm. Moving his nap window 30 minutes earlier might smooth out the fussiness we've been seeing.",
    reason: "Better alignment with his natural sleep rhythm means a better quality nap and a happier afternoon for both of us.",
    created_by: "nanny",
    status: "pending",
    child_id: "default",
    created_at: "2026-05-16T08:00:00Z",
  },
]

export const demoSuggestionReplies: SuggestionReply[] = [
  { id: "sr1", suggestion_id: "s2", author: "parent", content: "Can we try it this Thursday?", created_at: "2026-05-15T14:00:00Z" },
  { id: "sr2", suggestion_id: "s2", author: "nanny",  content: "Absolutely, I'll set everything up after morning snack!", created_at: "2026-05-15T14:15:00Z" },
]

// ── Daily Summaries (May 1–13) ────────────────────────────────────────────────

export interface DailySummary {
  date: string
  dateLabel: string
  headline: string
  summary: string
  highlights: string[]
}

export const dailySummaries: DailySummary[] = [
  {
    date: "2026-05-13", dateLabel: "Yesterday", headline: "A breakthrough day",
    summary: "Mateo climbed the full staircase unassisted and knew exactly how big that was. Water table in the morning, the longest nap of the month in the afternoon, and a calm reading session to close the day. Elena called it one of the best days in weeks.",
    highlights: ["Stairs milestone 🏔️", "1h 45min nap record 💤", "Water table 💦"],
  },
  {
    date: "2026-05-12", dateLabel: "Tuesday", headline: "Market morning + Oliver",
    summary: "Farmer's market set a great tone — lots of sensory input and vendor interaction. A 6-block tower record before lunch, then Oliver came over for parallel play in the afternoon. Elena noted he's starting to acknowledge other kids more directly — not just existing alongside them.",
    highlights: ["6-block tower record 🏗️", "Oliver playdate 👦", "Tried avocado 🥑"],
  },
  {
    date: "2026-05-11", dateLabel: "Monday", headline: "Gentle start, big wave",
    summary: "A calmer Monday after an active weekend. The highlight: an unprompted 'bye bye' wave to the mail carrier — first time he's used a gesture socially without any prompting at all. Long outdoor walk, excellent nap, and Sofia noted bedtime was unusually smooth.",
    highlights: ["First social wave 👋", "Long outdoor walk 🌳", "Easy bedtime 🌙"],
  },
  {
    date: "2026-05-10", dateLabel: "Sunday", headline: "A Rivera family Sunday",
    summary: "A full family day — pancake breakfast together, Marco took the morning at the park while Sofia rested. Grandma came for the afternoon and Mateo ran to her the moment she arrived. Marco put him down for bed solo for the first time and it took 9 minutes. Small victories that feel big.",
    highlights: ["Grandma visit 👵", "Marco solo bedtime 🌙", "Family pancakes 🥞"],
  },
  {
    date: "2026-05-09", dateLabel: "Saturday", headline: "Library magic",
    summary: "Saturday library story time and the puppet show stopped Mateo completely in his tracks. Elena reported he didn't move for 8 full minutes — remarkable for 18 months. Clapped along to the song unprompted for the first time. Strong appetite all afternoon.",
    highlights: ["Puppet show focus 🎭", "First clapping on cue 👏", "Great appetite 🍽️"],
  },
  {
    date: "2026-05-08", dateLabel: "Friday", headline: "Splash pad debut",
    summary: "The splash pad opened for the season and Mateo ran — genuinely ran — directly into the sprinklers. First time showing a real running gait. Refused the sun hat briefly then accepted it. High energy burned off by noon, then a 100-minute nap.",
    highlights: ["First real run 🏃", "Splash pad debut 💦", "100-min nap 💤"],
  },
  {
    date: "2026-05-07", dateLabel: "Thursday", headline: "Beans, pointing, and patience",
    summary: "Deep sensory play in the morning with a bin of dried beans — Elena noted nearly 18 minutes of independent play, which is exceptional at this age. The afternoon was pure language: Mateo pointed at 8 different objects one after another, each time waiting for Elena to name them.",
    highlights: ["18-min sensory focus 🫘", "8-object pointing game 🗣️", "Stacking rings mastered 🔵"],
  },
  {
    date: "2026-05-06", dateLabel: "Wednesday", headline: "Sweet potato and a very shared bucket",
    summary: "The morning was a solid park run. Lunch brought the sweet potato breakthrough — 6 bites of a food he'd been rejecting for three weeks. The Oliver playdate was the real highlight: he handed Oliver the sandbox bucket without any prompting. First real sharing gesture Elena has observed.",
    highlights: ["Sweet potato milestone 🍠", "First unprompted sharing 🪣", "Oliver playdate 👦"],
  },
  {
    date: "2026-05-05", dateLabel: "Tuesday", headline: "Chalk marks and garbage trucks",
    summary: "Mateo discovered sidewalk chalk on the patio and held it correctly on his second try — the first intentional scribble Elena has seen. Earlier on the morning walk, a garbage truck stopped him for three full minutes. He stood completely still, watching it with perfect seriousness.",
    highlights: ["First chalk scribble 🖍️", "Garbage truck fixation 🚛", "Correct crayon grip ✏️"],
  },
  {
    date: "2026-05-04", dateLabel: "Monday", headline: "A reset day — and that's okay",
    summary: "Mateo was overtired from an active weekend and the day reflected it — fussier at breakfast, a short 55-minute nap, lower appetite. But the afternoon redeemed itself: 40 minutes of blocks and books unprompted, then a short walk that reset his mood entirely. Not every day is a milestone day.",
    highlights: ["Blocks + books 40min 🧱", "Reset walk worked 🌿", "Good bedtime after all 🌙"],
  },
  {
    date: "2026-05-03", dateLabel: "Sunday", headline: "A quiet Sunday with the family",
    summary: "Marco and Mateo had the morning together at the park while Sofia rested. A lower-energy day overall — no big milestones, and that was fine. Sofia did extended reading in the afternoon: six books in a row, Mateo chose each one and sat through every page. The reading ritual is deepening.",
    highlights: ["Marco park morning 🏃", "6-book reading session 📚", "Sofia + Mateo time ❤️"],
  },
  {
    date: "2026-05-02", dateLabel: "Saturday", headline: "He knew exactly where the reading mat was",
    summary: "Saturday library and this time Mateo walked in, scanned the room, and went directly to the reading mat — no prompting. Elena noted it felt like a real spatial memory forming. He grabbed a book from the shelf himself. Post-library afternoon was calm, full of book-driven play at home.",
    highlights: ["Spatial memory at library 🗺️", "Grabbed book independently 📖", "Blue cup preference set 🔵"],
  },
  {
    date: "2026-05-01", dateLabel: "Friday", headline: "May begins — the outdoor rhythm is holding",
    summary: "First day of May and the morning walk felt settled — like a real ritual now. Mateo noticed birds for the first time, pointing and looking back at Elena to name them. By evening, Sofia noted that two weeks of consistent outdoor mornings has produced calmer afternoons and more predictable sleep.",
    highlights: ["Noticed birds for first time 🐦", "Outdoor rhythm locked in 🌳", "First clear 'no' shake 🙅"],
  },
]
