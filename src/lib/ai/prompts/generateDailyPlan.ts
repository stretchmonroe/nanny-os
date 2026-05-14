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
