export type ExecutionSummary = {
  completed: { title: string; outcome?: "great" | "okay" | "rough"; note?: string }[];
  skipped: string[];
}

export const insightsPrompt = (input: {
  childName: string;
  childAge: string;
  developmentalFocus: string;
  completedActivities: string[];
  currentActivity?: string;
  timeOfDay: string;
  executionSummary?: ExecutionSummary;
}) => `
Context:
- Child: ${input.childName}, ${input.childAge}
- Developmental focus: ${input.developmentalFocus}
- Completed today: ${input.completedActivities.join(", ") || "none yet"}
${input.currentActivity ? `- Currently: ${input.currentActivity}` : ""}
- Time: ${input.timeOfDay}
${input.executionSummary ? `
Execution detail:
${input.executionSummary.completed.map(c =>
  `- ${c.title}${c.outcome ? ` → ${c.outcome}` : ""}${c.note ? ` ("${c.note}")` : ""}`
).join("\n")}
${input.executionSummary.skipped.length > 0 ? `Skipped: ${input.executionSummary.skipped.join(", ")}` : ""}
` : ""}
Generate three grounded, specific observations about today and this week.
When outcome data is available, reference what went well and what felt harder — speak to patterns.

OUTPUT JSON (nothing else, no markdown):
{
  "todayInsight": "one specific warm observation about today — reference actual activities and outcomes by name, 1–2 sentences",
  "weeklyPattern": "one behavioral or developmental pattern observed across the week, 1–2 sentences",
  "careNote": "one practical observation about sleep, energy, or appetite today, 1–2 sentences"
}
`;
