import { supabase } from "@/lib/supabase/client";

export async function callAI(
  type: string,
  input: Record<string, unknown>
): Promise<{ result: string } | null> {
  if (process.env.NEXT_PUBLIC_LOCAL_AI_DISABLED === "1") return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ type, input }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.result) {
      console.warn("[callAI]", type, "failed:", data.error, data.status ?? "");
      return null;
    }
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
