export function developmentStoryPrompt(input: Record<string, unknown>): string {
  const { childName, childAge, milestones, observations } = input as {
    childName: string;
    childAge: string;
    milestones: string[];
    observations: string[];
  };

  return `Write a warm, observational paragraph about what's shifting in this child's world this week.

Child: ${childName}, ${childAge}

Recent milestones:
${milestones.join("\n")}

Recent observations:
${observations.join("\n")}

Write as a thoughtful, warm observer — not a developmental specialist. This should feel like what a wise, loving caregiver might say out loud. Avoid all clinical language, percentiles, and milestone checklists. Don't say "gross motor skills", "cognitive development", or "at this stage". Instead: notice what it feels like to watch this child grow.

Return JSON only: { "story": "..." }
- story: 2–3 sentences. Soft, observational, warm. Example of the right tone: "Something is shifting in how Mateo communicates — not just the new word, but the way he now turns to make sure you heard it." Avoid hollow phrases like "making great progress". Be specific.`;
}
