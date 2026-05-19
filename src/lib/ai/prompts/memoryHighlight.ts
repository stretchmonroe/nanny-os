export function memoryHighlightPrompt(input: Record<string, unknown>): string {
  const { childName, childAge, moments } = input as {
    childName: string;
    childAge: string;
    moments: string[];
  };

  return `From this week's journal moments, select the single most emotionally significant one and write a brief editorial caption for it.

Child: ${childName}, ${childAge}

This week's moments (indexed from 0):
${moments.map((m, i) => `${i}. ${m}`).join("\n")}

Choose the moment that will matter most when this parent reads this journal in 10 years. Write a caption that frames why it matters — not what happened, but what it means.

Return JSON only: { "momentIndex": 0, "caption": "..." }
- momentIndex: 0-based index of the chosen moment
- caption: 1–2 sentences. Warm, specific, slightly literary. Not "This was a great milestone." More like: "The way he looked up and checked if you were watching — that's him knowing, for the first time, that something is worth sharing."`;
}
