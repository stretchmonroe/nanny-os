export function weeklyStoryPrompt(input: Record<string, unknown>): string {
  const { childName, childAge, moments, weekRange } = input as {
    childName: string;
    childAge: string;
    moments: string[];
    weekRange: string;
  };

  return `Write a warm, literary weekly story for a parent reading about their child's week.

Child: ${childName}, ${childAge}
Week: ${weekRange}

This week's journal moments:
${moments.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Write as a thoughtful person who observed all of this — not a report, not a summary. Use narrative prose. Notice what's emotionally significant. Find the thread connecting the week's moments.

Return JSON only: { "headline": "...", "story": "..." }
- headline: 4–8 words, editorial and warm. Like a newspaper written by a poet. Examples: "The week he found his voice" / "Seven days of becoming" / "A boy who keeps surprising us"
- story: 2–3 sentences, flowing and specific. Use the actual moments. Avoid hollow phrases like "great week" or "made progress". Write about what it felt like, not just what occurred.`;
}
