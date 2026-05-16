import type { TimeWindow } from "./activities";

export type EnergyLevel = "very-high" | "high" | "moderate" | "settling" | "gentle";

export interface AdaptiveProfile {
  childName: string;
  personalitySummary: string;
  energyRhythm: Partial<Record<TimeWindow, EnergyLevel>>;
  engagementHighlights: string[];
  currentStrengths: string[];
  growthEdges: string[];
  recommendationHints: string[];
  lastUpdated: string;
}

const storageKey = (name: string) =>
  `nannyos_adaptive_${name.toLowerCase().replace(/\s+/g, "_")}`;

const STALE_MS = 12 * 60 * 60 * 1000; // 12 hours

export function loadAdaptiveProfile(childName: string): AdaptiveProfile | null {
  try {
    const raw = localStorage.getItem(storageKey(childName));
    return raw ? (JSON.parse(raw) as AdaptiveProfile) : null;
  } catch {
    return null;
  }
}

export function saveAdaptiveProfile(profile: AdaptiveProfile): void {
  try {
    localStorage.setItem(storageKey(profile.childName), JSON.stringify(profile));
  } catch {
    // storage unavailable — degrade silently
  }
}

export function isAdaptiveProfileStale(profile: AdaptiveProfile): boolean {
  try {
    return Date.now() - new Date(profile.lastUpdated).getTime() > STALE_MS;
  } catch {
    return true;
  }
}

// Fallback for Mateo demo — always feels authentic since it's derived from real demo data
export const demoAdaptiveProfile: AdaptiveProfile = {
  childName: "Mateo",
  personalitySummary:
    "Mateo is a curious, high-energy explorer with a gift for deep focus once he finds his groove. He comes alive during outdoor adventures and sensory play, and his language is clearly on the move — new words and gestures appear almost daily. Outdoor mornings reliably set the tone for his best naps and most settled afternoons.",
  energyRhythm: {
    "morning-energy":      "very-high",
    "mid-morning-focus":   "high",
    "after-lunch-calm":    "settling",
    "afternoon-adventure": "high",
    "evening-wind-down":   "gentle",
  },
  engagementHighlights: [
    "Sustained sensory play for 12–18 minutes — exceptional at 18 months",
    "Language surges most visibly during outdoor walks and the post-lunch quiet window",
    "Reliable second wind in the afternoon — high-energy again by 3pm",
  ],
  currentStrengths: [
    "Deep focus on hands-on tasks: stacking, pouring, sorting",
    "Openness to new foods is growing — avocado and sweet potato both accepted this week",
    "Social recognition is blooming — runs to familiar adults, beginning to acknowledge peers",
  ],
  growthEdges: [
    "Transitions between activities — a brief settling ritual helps a lot",
  ],
  recommendationHints: [
    "Prioritize outdoor activity in morning windows to set up strong naps",
    "Language-rich activities (books, naming walks) work best right after lunch",
    "Sensory play in the afternoon stabilizes mood heading toward dinner",
  ],
  lastUpdated: new Date().toISOString(),
};
