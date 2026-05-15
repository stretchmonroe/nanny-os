export type TimeWindow =
  | "morning-energy"
  | "mid-morning-focus"
  | "after-lunch-calm"
  | "afternoon-adventure"
  | "evening-wind-down";

export type ActivityCategory =
  | "sensory"
  | "motor"
  | "language"
  | "creative"
  | "outdoor"
  | "quiet";

export interface Activity {
  id: string;
  timeWindow: TimeWindow;
  emoji: string;
  title: string;
  duration: string;
  purpose: string;
  materials: string[];
  category: ActivityCategory;
  isMontessori: boolean;
}

export const TIME_WINDOW_ORDER: TimeWindow[] = [
  "morning-energy",
  "mid-morning-focus",
  "after-lunch-calm",
  "afternoon-adventure",
  "evening-wind-down",
];

export const TIME_WINDOW_META: Record<
  TimeWindow,
  { label: string; emoji: string; description: string }
> = {
  "morning-energy": {
    label: "Morning Energy",
    emoji: "🌅",
    description: "When energy is high",
  },
  "mid-morning-focus": {
    label: "Mid-Morning Focus",
    emoji: "☀️",
    description: "When they're ready to concentrate",
  },
  "after-lunch-calm": {
    label: "After-Lunch Calm",
    emoji: "🌿",
    description: "When the pace slows down",
  },
  "afternoon-adventure": {
    label: "Afternoon Adventure",
    emoji: "🎯",
    description: "When a second wind arrives",
  },
  "evening-wind-down": {
    label: "Evening Wind-Down",
    emoji: "🌙",
    description: "When it's time to get gentle",
  },
};

export const CATEGORY_COLORS: Record<
  ActivityCategory,
  { bg: string; text: string }
> = {
  sensory:  { bg: "#F0E8FF", text: "#7C3AED" },
  motor:    { bg: "#E8F5FF", text: "#0369A1" },
  language: { bg: "#FFF0E8", text: "#FF7B54" },
  creative: { bg: "#FFF8E8", text: "#D97706" },
  outdoor:  { bg: "#E8F9F4", text: "#059669" },
  quiet:    { bg: "#F0F4FF", text: "#4F46E5" },
};
