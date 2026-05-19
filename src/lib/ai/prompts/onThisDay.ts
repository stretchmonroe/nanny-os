export function onThisDayPrompt(input: Record<string, unknown>): string {
  const { childName, childAge, pastMoment, daysAgo, presentMoment } = input as {
    childName: string;
    childAge: string;
    pastMoment: string;
    daysAgo: number;
    presentMoment?: string;
  };

  return `Write a brief, warm reflection connecting a past memory to the present.

Child: ${childName}, ${childAge}

${daysAgo} days ago: ${pastMoment}
${presentMoment ? `This week: ${presentMoment}` : ""}

Write 1–2 sentences that gently connect then to now. Not nostalgic in a heavy way — more like: "look how much has happened since." Make a parent want to hold this moment.

Return JSON only: { "reflection": "..." }
- reflection: 1–2 warm sentences. Specific. Notice a contrast, a continuity, or a becoming. Don't start with "It was" or "This was".`;
}
