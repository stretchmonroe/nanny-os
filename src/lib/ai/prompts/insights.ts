export const insightsPrompt = (input: {
  childName: string;
  childAge: string;
  developmentalFocus: string;
  completedActivities: string[];
  currentActivity?: string;
  timeOfDay: string;
}) => `
Context:
- Child: ${input.childName}, ${input.childAge}
- Developmental focus: ${input.developmentalFocus}
- Completed today: ${input.completedActivities.join(", ")}
${input.currentActivity ? `- Currently: ${input.currentActivity}` : ""}
- Time: ${input.timeOfDay}

Generate three grounded, specific observations about today and this week.

OUTPUT JSON (nothing else, no markdown):
{
  "todayInsight": "one specific warm observation about today — reference actual activities by name, 1–2 sentences",
  "weeklyPattern": "one behavioral or developmental pattern observed across the week, 1–2 sentences",
  "careNote": "one practical observation about sleep, energy, or appetite today, 1–2 sentences"
}
`;
