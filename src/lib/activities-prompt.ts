import type { ChildProfile } from "./onboarding-flow";
import type { TimeWindow } from "./activities";
import type { AdaptiveProfile } from "./adaptive-profile";

export function buildActivitiesPrompt(profile: ChildProfile, adaptive?: AdaptiveProfile | null): string {
  const hasSensory =
    profile.sensorySensitivities.filter((s) => s !== "none").length > 0;
  const montessoriOk = profile.montessoriInterest !== "not-for-us";
  const preferOutdoor =
    profile.environmentPreference === "outdoor" ||
    profile.environmentPreference === "both";

  const adaptiveSection = adaptive?.recommendationHints?.length
    ? `\nLearned preferences (from activity history — prioritize these):\n${adaptive.recommendationHints.map(h => `- ${h}`).join("\n")}\n`
    : "";

  return `You are a warm, playful child development guide. Generate a full day of 5 developmentally appropriate activities for a child with the following profile.

Child profile:
- Name: ${profile.name}
- Age range: ${profile.age} years
- Sleep pattern: ${profile.sleepPattern}
- Energy level: ${profile.activityLevel}
- Language stage: ${profile.languageDevelopment}
- Loves: ${profile.favoriteActivities.join(", ")}
- Sensory notes: ${hasSensory ? profile.sensorySensitivities.join(", ") : "no notable sensitivities"}
- Environment: ${profile.environmentPreference}
- Developmental focus: ${profile.developmentalFocus.join(", ")}
- Montessori interest: ${profile.montessoriInterest}
${adaptiveSection}
Generate exactly 5 activities, one per time window in this exact order:
1. morning-energy (active, stimulating, high-energy)
2. mid-morning-focus (concentration, learning, calm exploration)
3. after-lunch-calm (quiet, restful, sensory or gentle)
4. afternoon-adventure (creative, active, adventurous — second wind)
5. evening-wind-down (gentle, calming, winding down toward sleep)

Rules:
- Match intensity to each window — morning is highest energy, evening is gentlest
- Avoid anything conflicting with sensory sensitivities${hasSensory ? ` (${profile.sensorySensitivities.join(", ")})` : ""}
- Prefer ${preferOutdoor ? "outdoor or adaptable indoor/outdoor" : "indoor"} activities
- ${montessoriOk ? "Include Montessori-inspired activities where natural (real-life tasks, child-led, practical life skills, hands-on exploration)" : "Use play-based, fun language — avoid Montessori framing"}
- Write purpose in warm, supportive prose — never clinical, never like a daycare checklist
- Describe timing as "when energy is high" or "as the morning gets going" — never clock times
- Age-appropriate for ${profile.age} years
- Inspiration (use freely, don't copy verbatim): naming walks, sensory bins, fine motor trays, object permanence games, reading nooks, sensory bottles, nature sorting, playdough, water pouring, block stacking, simple puzzles, music and movement, felt boards, shadow puppets, bath-time wind-down, treasure basket exploration, leaf rubbing, threading beads, rice pouring, bubble chasing

Return ONLY valid JSON — no markdown, no code fences, no explanation. Use this exact shape:
{
  "activities": [
    {
      "id": "morning-energy",
      "timeWindow": "morning-energy",
      "emoji": "🌞",
      "title": "Short evocative activity name",
      "duration": "15–20 min",
      "purpose": "One or two warm sentences explaining developmental value.",
      "materials": ["item one", "item two", "item three"],
      "category": "sensory",
      "isMontessori": false
    }
  ]
}

Valid category values: sensory, motor, language, creative, outdoor, quiet
The activities array must have exactly 5 items in the window order listed above.`;
}

export function buildSwapPrompt(
  profile: ChildProfile,
  windowToSwap: TimeWindow,
  adaptive?: AdaptiveProfile | null
): string {
  const hasSensory =
    profile.sensorySensitivities.filter((s) => s !== "none").length > 0;
  const montessoriOk = profile.montessoriInterest !== "not-for-us";
  const preferOutdoor =
    profile.environmentPreference === "outdoor" ||
    profile.environmentPreference === "both";

  const windowContext: Record<TimeWindow, string> = {
    "morning-energy":
      "high energy, active, stimulating — right after wake-up when energy is naturally high",
    "mid-morning-focus":
      "calm concentration, learning, gentle exploration — attention is peaking",
    "after-lunch-calm":
      "quiet, restful, sensory or slow — body is digesting, pace slows",
    "afternoon-adventure":
      "creative, active, or adventurous — second wind of the day",
    "evening-wind-down":
      "very gentle, calming, low-stimulation — preparing the body and mind for rest",
  };

  const adaptiveHints = adaptive?.recommendationHints?.length
    ? `\nLearned preferences:\n${adaptive.recommendationHints.map(h => `- ${h}`).join("\n")}\n`
    : "";

  return `You are a warm child development guide. Suggest one fresh activity for the "${windowToSwap}" time window for this child. Make it different and creative — not the typical first suggestion.

Child profile:
- Name: ${profile.name}
- Age range: ${profile.age} years
- Energy level: ${profile.activityLevel}
- Language stage: ${profile.languageDevelopment}
- Loves: ${profile.favoriteActivities.join(", ")}
- Sensory notes: ${hasSensory ? profile.sensorySensitivities.join(", ") : "none"}
- Environment: ${profile.environmentPreference}
- Developmental focus: ${profile.developmentalFocus.join(", ")}
${adaptiveHints}
Time window: ${windowContext[windowToSwap]}

Rules:
- Must fit the energy level of "${windowToSwap}": ${windowContext[windowToSwap]}
- Avoid sensory conflicts${hasSensory ? ` (${profile.sensorySensitivities.join(", ")})` : ""}
- Prefer ${preferOutdoor ? "outdoor or adaptable" : "indoor"} activities
- ${montessoriOk ? "Montessori-inspired is welcome" : "Avoid Montessori framing — keep it play-based"}
- Be creative — aim for something surprising and delightful, not the first obvious choice
- Warm, supportive purpose language — never clinical

Return ONLY valid JSON — no markdown, no code fences:
{
  "activity": {
    "id": "${windowToSwap}",
    "timeWindow": "${windowToSwap}",
    "emoji": "🎨",
    "title": "Short evocative activity name",
    "duration": "15–20 min",
    "purpose": "One or two warm sentences.",
    "materials": ["item one", "item two"],
    "category": "creative",
    "isMontessori": false
  }
}

Valid category values: sensory, motor, language, creative, outdoor, quiet`;
}
