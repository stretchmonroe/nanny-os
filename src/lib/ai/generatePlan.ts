export const generateDailyPlanPrompt = (input: {
  age: number;
  wakeTime: string;
  napSchedule: string;
  weather: string;
  preferences?: string[];
}) => `
Create a structured daily plan for a child.

INPUT:
- Age: ${input.age}
- Wake time: ${input.wakeTime}
- Nap schedule: ${input.napSchedule}
- Weather: ${input.weather}
- Preferences: ${input.preferences?.join(", ") || "none"}

OUTPUT JSON FORMAT:

{
  "summary": "1 sentence overview of the day",
  "schedule": [
    {
      "time": "HH:MM",
      "activity": "string",
      "type": "meal | nap | play | outdoor | learning",
      "notes": "short instruction for nanny"
    }
  ],
  "focusAreas": ["language", "motor skills", "social", "sensory"],
  "fallbackActivities": [
    {
      "situation": "rainy day | low energy | high energy",
      "activity": "string"
    }
  ]
}

Rules:
- Keep activities realistic for a nanny to execute
- Balance active and calm periods
- Prioritize outdoor time if weather allows
- Keep total schedule simple (6–10 ite max)
`;

export const dailySummaryPrompt = (input: {
  events: { type: string; content: string; time: string }[];
}) => `
You are summarizing a child's day for a parent.

INPUT EVENTS:
${JSON.stringify(input.events)}

OUTPUT JSON:

{
  "headline": "One sentence emotional summary",
  "overview": "2–4 sentence summary of the day",
  "highlights": [
    "key moment 1",
    "key moment 2"
  ],
  "moodTrend": "positive | neutral | low energy",
  "careNotes": [
    "sleep insight",
    "nutrition insight",
    "activity insight"
  ]
}

Rules:
- Be warm but factual
- Do not overinterpret behavior
- Focus on clarity and reassurance
`;

export const nextBestActionPrompt = (input: {
  currentTime: string;
  lastActivity: string;
  energyLevel?: string;
  context?: string;
}) => `
You are assisting a nanny in real time.

INPUT:
- Current time: ${input.currentTime}
- Last activity: ${input.lastActivity}
- Energy level: ${input.energyLevel || "unknown"}
- Context: ${input.context || "none"}

OUTPUT JSON:

{
  "recommendation": "what to do next",
  "reason": "short explanation",
  "duration": "estimated minutes",
  "materialsNeeded": ["list of simple items"],
  "backupOption": "simpler fallback activity"
}

Rules:
- Always prioritize practicality
- Keep activities simple and low-prep
- Assume limited materials
- Prefer physical play or reading over screens
`;
