export type StepType = "text-input" | "single-select" | "multi-select";

export interface Option {
  id: string;
  emoji: string;
  label: string;
  description?: string;
}

export interface Step {
  id: string;
  field: string;
  type: StepType;
  message: (profile: Partial<ChildProfile>) => string;
  followUp?: string;
  placeholder?: string;
  options?: Option[];
  minSelect?: number;
  maxSelect?: number;
}

export interface ChildProfile {
  name: string;
  age: string;
  sleepPattern: string;
  activityLevel: string;
  languageDevelopment: string;
  favoriteActivities: string[];
  sensorySensitivities: string[];
  environmentPreference: string;
  developmentalFocus: string[];
  montessoriInterest: string;
}

export const ONBOARDING_STEPS: Step[] = [
  {
    id: "name",
    field: "name",
    type: "text-input",
    message: () =>
      "Hi there! I'm Sprout 🌱\n\nI'm here to help create a magical, personalized experience for your little one.\n\nFirst — what's your child's name?",
    placeholder: "Their name…",
  },
  {
    id: "age",
    field: "age",
    type: "single-select",
    message: (p) => `Love that name! 💛\n\nHow old is ${p.name}?`,
    options: [
      { id: "0-1", emoji: "🌱", label: "Under 1 year" },
      { id: "1-2", emoji: "🐣", label: "1 – 2 years" },
      { id: "2-3", emoji: "🌟", label: "2 – 3 years" },
      { id: "3-4", emoji: "🦋", label: "3 – 4 years" },
      { id: "4-5", emoji: "🚀", label: "4 – 5 years" },
      { id: "5+", emoji: "🌈", label: "5 years +" },
    ],
  },
  {
    id: "sleepPattern",
    field: "sleepPattern",
    type: "single-select",
    message: (p) =>
      `Got it! ${p.name} sounds wonderful 🌙\n\nHow does ${p.name} sleep?`,
    followUp: "Sleep shapes so much of a child's day — we'll build around it.",
    options: [
      { id: "great-sleeper", emoji: "😴", label: "Great sleeper", description: "Goes down easily, sleeps through" },
      { id: "light-sleeper", emoji: "🌛", label: "Light sleeper", description: "Wakes often, sensitive to sound" },
      { id: "short-napper", emoji: "⏱️", label: "Short napper", description: "Catnaps, hard to get long sleep" },
      { id: "night-owl", emoji: "🦉", label: "Night owl", description: "Fights bedtime, stays up late" },
      { id: "early-bird", emoji: "🐦", label: "Early bird", description: "Up at dawn, tired by evening" },
    ],
  },
  {
    id: "activityLevel",
    field: "activityLevel",
    type: "single-select",
    message: (p) => `Now let's talk energy ⚡\n\nHow would you describe ${p.name}'s activity level?`,
    options: [
      { id: "high-energy", emoji: "🌪️", label: "Super active", description: "Always on the move" },
      { id: "moderate", emoji: "🎭", label: "Mix of both", description: "Active spurts, then calm" },
      { id: "calm", emoji: "🌸", label: "Calm & focused", description: "Prefers quiet, steady play" },
    ],
  },
  {
    id: "languageDevelopment",
    field: "languageDevelopment",
    type: "single-select",
    message: (p) => `Let's talk about how ${p.name} expresses themselves 💬`,
    followUp: "No right or wrong here — every child unfolds at their own pace.",
    options: [
      { id: "babbling", emoji: "🗣️", label: "Babbling & sounds", description: "Experimenting with noises" },
      { id: "first-words", emoji: "✨", label: "First words", description: "A handful of clear words" },
      { id: "short-phrases", emoji: "💭", label: "Short phrases", description: "2–3 word combinations" },
      { id: "full-sentences", emoji: "📖", label: "Full sentences", description: "Talking in complete thoughts" },
      { id: "storyteller", emoji: "📚", label: "Little storyteller", description: "Loves to narrate everything" },
    ],
  },
  {
    id: "favoriteActivities",
    field: "favoriteActivities",
    type: "multi-select",
    message: (p) => `What makes ${p.name}'s eyes light up? 🌟\n\nPick everything that feels like them ↓`,
    minSelect: 1,
    maxSelect: 6,
    options: [
      { id: "arts-crafts", emoji: "🎨", label: "Arts & crafts" },
      { id: "building-blocks", emoji: "🧱", label: "Building & blocks" },
      { id: "music-dance", emoji: "🎵", label: "Music & dancing" },
      { id: "pretend-play", emoji: "🎭", label: "Pretend play" },
      { id: "books-stories", emoji: "📚", label: "Books & stories" },
      { id: "outdoor-play", emoji: "🌿", label: "Outdoor adventures" },
      { id: "puzzles", emoji: "🧩", label: "Puzzles & sorting" },
      { id: "water-play", emoji: "💧", label: "Water & sand play" },
      { id: "animals", emoji: "🐾", label: "Animals & nature" },
      { id: "cooking", emoji: "🍳", label: "Helping in kitchen" },
    ],
  },
  {
    id: "sensorySensitivities",
    field: "sensorySensitivities",
    type: "multi-select",
    message: (p) =>
      `Does ${p.name} have any sensory sensitivities? 🌿\n\nThis helps us suggest activities that feel just right.`,
    followUp: "Pick any that apply — or skip if nothing stands out.",
    minSelect: 0,
    maxSelect: 5,
    options: [
      { id: "noise-sensitive", emoji: "🔇", label: "Sensitive to loud sounds" },
      { id: "texture-sensitive", emoji: "🤲", label: "Picky about textures" },
      { id: "light-sensitive", emoji: "💡", label: "Bothered by bright lights" },
      { id: "crowd-sensitive", emoji: "👥", label: "Overwhelmed in crowds" },
      { id: "food-texture", emoji: "🍽️", label: "Food texture preferences" },
      { id: "none", emoji: "✅", label: "No noticeable sensitivities" },
    ],
  },
  {
    id: "environmentPreference",
    field: "environmentPreference",
    type: "single-select",
    message: (p) => `Where does ${p.name} thrive most? 🏡`,
    options: [
      { id: "indoor", emoji: "🏠", label: "Mostly indoors", description: "Cozy corners & home base" },
      { id: "outdoor", emoji: "🌳", label: "Mostly outdoors", description: "Fresh air & open spaces" },
      { id: "both", emoji: "🌤️", label: "Loves both equally", description: "Happy wherever they go" },
    ],
  },
  {
    id: "developmentalFocus",
    field: "developmentalFocus",
    type: "multi-select",
    message: (p) =>
      `What would you love to nurture in ${p.name} right now? 🌱\n\nPick what matters most to you.`,
    minSelect: 1,
    maxSelect: 4,
    options: [
      { id: "creativity", emoji: "🎨", label: "Creativity & imagination" },
      { id: "social-skills", emoji: "🤝", label: "Social & emotional skills" },
      { id: "language", emoji: "💬", label: "Language & communication" },
      { id: "motor-skills", emoji: "🏃", label: "Movement & coordination" },
      { id: "focus", emoji: "🔍", label: "Focus & concentration" },
      { id: "independence", emoji: "⭐", label: "Independence & confidence" },
      { id: "curiosity", emoji: "🔬", label: "Curiosity & exploration" },
      { id: "calm", emoji: "🧘", label: "Calm & self-regulation" },
    ],
  },
  {
    id: "montessoriInterest",
    field: "montessoriInterest",
    type: "single-select",
    message: () =>
      `Last one! Are you interested in Montessori-inspired activities? 🌿\n\nThink child-led exploration, real-life tasks, and hands-on learning.`,
    options: [
      { id: "yes-love-it", emoji: "💚", label: "Yes, love it!", description: "Big into Montessori philosophy" },
      { id: "curious", emoji: "🌱", label: "Curious to try", description: "Open to exploring it" },
      { id: "mix", emoji: "🎭", label: "Mix of approaches", description: "Not tied to one method" },
      { id: "not-for-us", emoji: "💫", label: "Not really our style", description: "Prefer other approaches" },
    ],
  },
];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;
