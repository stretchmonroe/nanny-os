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
}

export const typeConfig = {
  meal:     { label: "Meal",     color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",  dot: "bg-orange-400" },
  outdoor:  { label: "Outdoor",  color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",              dot: "bg-sky-400"    },
  play:     { label: "Play",     color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", dot: "bg-emerald-400" },
  nap:      { label: "Nap",      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",  dot: "bg-indigo-400" },
  learning: { label: "Learning", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",  dot: "bg-violet-400" },
}
