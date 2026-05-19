export function monthlyStoryPrompt(input: Record<string, unknown>): string {
  const { childName, childAge, month, highlights } = input as {
    childName: string;
    childAge: string;
    month: string;
    highlights: string[];
  };

  return `Write a warm monthly story — the emotional narrative of a month in a child's life.

Child: ${childName}, ${childAge}
Month: ${month}

Key moments from this month:
${highlights.map((h, i) => `${i + 1}. ${h}`).join("\n")}

This is for a parent who treasures these moments. Write like someone who loves this child and has been paying close attention. Not a summary — a story. Find the theme of the month. What has this month been about for this child?

Return JSON only: { "title": "...", "story": "..." }
- title: the theme of the month in 4–7 words. Examples: "The month he started talking back" / "Finding his feet in May" / "A boy figuring out the world"
- story: 3–4 sentences. Lyrical but grounded. Use specific moments. The last sentence should land emotionally.`;
}
