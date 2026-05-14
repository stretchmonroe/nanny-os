export async function callAI(
  type: string,
  input: Record<string, unknown>
): Promise<{ result: string } | null> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, input }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.result) return null;
    return data;
  } catch {
    return null;
  }
}

export function parseAIJson<T>(result: string, fallback: T): T {
  try {
    const json = result.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
