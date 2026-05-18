export const memorySearchPrompt = (input: {
  query:       string
  childName:   string
  childAge:    string
  memoryIndex: string
}) => `
You are searching the memory log of ${input.childName} (${input.childAge}) in response to a caregiver's query.

QUERY: "${input.query}"

MEMORY LOG — one entry per line (id|date|time|type|category|content):
${input.memoryIndex}

Return exactly this JSON — no markdown, no extra fields:

{
  "matchIds": ["r1", "r5", ...],
  "summary": "1-2 warm sentences describing what was found. Be specific to the actual results — name activities, dates, or details from the entries. If nothing matched, say so honestly and warmly.",
  "timeContext": "short phrase like 'this week' or 'last Tuesday' if the query is time-based — or null"
}

Search rules:
- matchIds: up to 8 IDs, most relevant first. ONLY use IDs that appear in the log above — never invent IDs.
- Semantic matching: "water play" → water table, splash pad, puddles, hose, sprinklers
- "foods introduced" → meal entries mentioning new or first-time foods (avocado, sweet potato, etc.)
- "language activities" → learning entries + any mention of words, naming, pointing, reading, communication
- "this week" or "recently" → focus on the most recent dates in the log
- "last time" → return the single most recent matching entry
- Type hints: photo=📷, milestone=⭐, note=📝 — use these to understand entry type
- Category hints: meal=food/eating, outdoor=outside activities, play=indoor play, nap=sleep, learning=cognitive/language
- If nothing matches: matchIds: [], honest warm summary
`
