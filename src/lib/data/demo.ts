export const child = {
  name: "Mateo",
  age: "18 months",
  emoji: "🧒",
  focus: "Fine Motor Skills",
  mood: "😄",
  moodLabel: "Happy",
}

export const schedule = [
  {
    id: "1",
    time: "08:00",
    title: "Wake up & Breakfast",
    type: "meal" as const,
    done: true,
    notes: "Oatmeal + mango slices — ate well",
  },
  {
    id: "2",
    time: "09:30",
    title: "Morning Park Walk",
    type: "outdoor" as const,
    done: true,
    notes: "45 min — loved the swings, very chatty",
  },
  {
    id: "3",
    time: "11:00",
    title: "Sensory Bin Play",
    type: "play" as const,
    done: false,
    active: true,
    notes: "Rice bin with cups and scoops",
  },
  {
    id: "4",
    time: "12:30",
    title: "Lunch",
    type: "meal" as const,
    done: false,
    notes: "Avocado toast + banana slices",
  },
  {
    id: "5",
    time: "13:00",
    title: "Nap",
    type: "nap" as const,
    done: false,
    notes: "Target 90 min, blackout curtains on",
  },
  {
    id: "6",
    time: "15:30",
    title: "Reading Time",
    type: "learning" as const,
    done: false,
    notes: "Brown Bear, Brown Bear",
  },
]

export const moments = [
  {
    id: "1",
    type: "photo" as const,
    content: "First time going down the big slide! So proud of himself 🎉",
    time: "9:47 am",
    imageUrl: "https://picsum.photos/seed/baby1/400/600",
    createdBy: "nanny",
  },
  {
    id: "2",
    type: "note" as const,
    content: "Said \"more\" clearly for the first time during snack! 🌟 This is huge.",
    time: "10:15 am",
    createdBy: "nanny",
  },
  {
    id: "3",
    type: "photo" as const,
    content: "So focused on stacking rings — full 12 minutes of concentration",
    time: "11:20 am",
    imageUrl: "https://picsum.photos/seed/toddler2/400/600",
    createdBy: "nanny",
  },
  {
    id: "4",
    type: "note" as const,
    content: "Great energy after the park. Did 3 full laps around the sandbox before settling in. Energy level: 🔥",
    time: "10:45 am",
    createdBy: "parent",
  },
  {
    id: "5",
    type: "photo" as const,
    content: "Cuddle time before sensory play — the calm before the storm 😄",
    time: "10:55 am",
    imageUrl: "https://picsum.photos/seed/cuddle3/400/600",
    createdBy: "nanny",
  },
  {
    id: "6",
    type: "note" as const,
    content: "Sleeping patterns have been great this week. Usually out within 8 minutes of lying down.",
    time: "Yesterday",
    createdBy: "parent",
  },
]

export const groceryItems = [
  { id: "g1", name: "Oatmeal (quick oats)", completed: true },
  { id: "g2", name: "Mango (2 ripe)", completed: true },
  { id: "g3", name: "Avocado (x3)", completed: false },
  { id: "g4", name: "Banana bunch", completed: false },
  { id: "g5", name: "Rice cakes (unsalted)", completed: false },
  { id: "g6", name: "Full-fat yogurt", completed: false },
]

export const aiSuggestion = {
  title: "Time for something calming",
  body: "Mateo's been physically active since 8am. A sensory bin before lunch helps him transition into rest mode and builds fine motor skills — his focus area today.",
  activity: "Sensory Bin with Rice & Cups",
  duration: "20–30 min",
  developmentalNote: "Pouring and scooping builds the hand strength he'll need for drawing and self-feeding — both coming fast at 18 months.",
  developmentalFocus: "Fine Motor Skills",
}

export const todayInsights = [
  "Language exposure was especially strong during this morning's park walk — naming objects and narrating the walk counts more than it seems.",
  "Mateo's focus window is running earlier than usual today. The morning sensory play is well-timed.",
  "Outdoor time this week has consistently led to calmer, longer afternoons.",
]

export const weeklyPatterns = {
  headline: "A strong week with clear patterns",
  observations: [
    "Outdoor mornings consistently led to calmer, longer afternoons this week.",
    "Nap timing shifted 30 minutes earlier — and mood has been steadier for it.",
    "Vocabulary is expanding: two new words, more intentional pointing and gesturing.",
  ],
  trend: "positive" as const,
}

export const careNotes = [
  { icon: "💤", label: "Sleep", note: "Naps consistently around 1pm, averaging 85 minutes this week." },
  { icon: "🍽️", label: "Nutrition", note: "Strong appetite all week. Starting to accept new textures more easily." },
  { icon: "🌱", label: "Growth", note: "Vocabulary expanding fast — two clear new words since Monday." },
]

export const typeConfig = {
  meal:     { label: "Meal",     color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",  dot: "bg-orange-400" },
  outdoor:  { label: "Outdoor",  color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",              dot: "bg-sky-400"    },
  play:     { label: "Play",     color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", dot: "bg-emerald-400" },
  nap:      { label: "Nap",      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",  dot: "bg-indigo-400" },
  learning: { label: "Learning", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",  dot: "bg-violet-400" },
}

// ── Memory / Journal page data ─────────────────────────────────────────────

export const aiJournalSummary = {
  headline: "A morning full of firsts",
  summary:
    "Mateo had an exceptional morning — his first solo slide, a new word at snack, and 12 minutes of pure focused play. Days like this are the ones to keep.",
  highlights: ["Said 'more' for the first time 🌟", "Big slide, solo 🎢", "12 min focus session 🧩"],
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

export const weeklyMoments: JournalDay[] = [
  {
    day: "Thursday",
    date: "Today",
    isToday: true,
    moments: [
      {
        id: "t1",
        type: "photo",
        content: "First time down the big slide by himself — pure pride on his face",
        time: "9:47 am",
        imageUrl: "https://picsum.photos/seed/baby1/400/600",
        category: "outdoor",
      },
      {
        id: "t2",
        type: "milestone",
        content: "Said 'more' clearly for the first time during snack. This is huge. 🌟",
        time: "10:15 am",
        category: "learning",
      },
      {
        id: "t3",
        type: "photo",
        content: "Focused on stacking rings for 12 straight minutes",
        time: "11:20 am",
        imageUrl: "https://picsum.photos/seed/toddler2/400/500",
        category: "play",
      },
      {
        id: "t4",
        type: "note",
        content: "Cuddle time before sensory play — so calm and content. The calm before the (rice bin) storm.",
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
        content: "Water table in the backyard — absolutely soaked and loving every second",
        time: "10:30 am",
        imageUrl: "https://picsum.photos/seed/water5/400/500",
        category: "outdoor",
      },
      {
        id: "w2",
        type: "note",
        content: "Nap was 1h 45min — best sleep all week. Woke up glowing.",
        time: "2:15 pm",
        category: "nap",
      },
      {
        id: "w3",
        type: "photo",
        content: "Reading 'Brown Bear' for the fourth time today 📖",
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
        type: "milestone",
        content: "Stacked 6 blocks before the big dramatic knockdown. New personal best 🏗️",
        time: "11:00 am",
        category: "play",
      },
      {
        id: "tu2",
        type: "photo",
        content: "Farmer's market morning — so many new textures and smells",
        time: "9:15 am",
        imageUrl: "https://picsum.photos/seed/market6/400/500",
        category: "outdoor",
      },
      {
        id: "tu3",
        type: "note",
        content: "Tried avocado again — actually ate 3 bites. Progress is progress.",
        time: "12:30 pm",
        category: "meal",
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
        content: "Morning light, warm oatmeal, and the best little face",
        time: "8:30 am",
        imageUrl: "https://picsum.photos/seed/morning8/400/500",
        category: "meal",
      },
      {
        id: "mo2",
        type: "note",
        content: "Such a calm Monday. Long outdoor walk, perfect nap, easy bedtime. Some days just flow.",
        time: "7:30 pm",
        category: "outdoor",
      },
    ],
  },
]

export const favoriteMemories = [
  {
    id: "f1",
    type: "photo" as const,
    content: "First steps — three wobbles and a fall right into our arms",
    date: "March 15",
    imageUrl: "https://picsum.photos/seed/firststeps/600/800",
    isFeatured: true,
  },
  {
    id: "f2",
    type: "photo" as const,
    content: "Six months old and already obsessed with the dog",
    date: "November 3",
    imageUrl: "https://picsum.photos/seed/sixmonths/400/400",
    isFeatured: false,
  },
  {
    id: "f3",
    type: "milestone" as const,
    content: "First word: 'Dada' — at 11 months, unprompted, in the kitchen",
    date: "December 20",
    isFeatured: false,
  },
  {
    id: "f4",
    type: "photo" as const,
    content: "Beach trip — first time feeling sand between little toes",
    date: "January 8",
    imageUrl: "https://picsum.photos/seed/beachbaby/400/500",
    isFeatured: false,
  },
  {
    id: "f5",
    type: "photo" as const,
    content: "The look on his face when he first saw the Christmas tree lights",
    date: "December 25",
    imageUrl: "https://picsum.photos/seed/xmasbaby/400/500",
    isFeatured: false,
  },
  {
    id: "f6",
    type: "milestone" as const,
    content: "First full night of sleep. We cried more than he did.",
    date: "October 12",
    isFeatured: false,
  },
]
