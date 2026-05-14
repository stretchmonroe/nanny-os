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
