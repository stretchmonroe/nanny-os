import { createClient } from "@supabase/supabase-js";
import { systemPrompt } from "@/lib/ai/prompts/systemPrompt";

export async function POST(req: Request) {
  if (process.env.LOCAL_AI_DISABLED === "1") {
    return Response.json({ error: "disabled_local" });
  }
  try {
    const token = req.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return Response.json({ error: "unavailable" }, { status: 503 });
    const db = createClient(url, serviceKey);
    const { data: { user }, error: userError } = await db.auth.getUser(token);
    if (userError || !user) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { data: membership, error: memberError } = await db.from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (memberError || !membership) return Response.json({ error: "forbidden" }, { status: 403 });

    const rawBody = await req.text();
    if (rawBody.length > 12000) return Response.json({ error: "too_large" }, { status: 413 });
    let body;
    try { body = JSON.parse(rawBody); }
    catch { return Response.json({ error: "invalid_request" }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }
    const { type, input } = body;
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[ai] missing api key");
      return Response.json({ error: "unavailable" }, { status: 503 });
    }

    let prompt = "";

    if (type === "dailyPlan") {
      const { generateDailyPlanPrompt } = await import(
        "@/lib/ai/prompts/generateDailyPlan"
      );
      prompt = generateDailyPlanPrompt(input);
    } else if (type === "dailySummary") {
      const { dailySummaryPrompt } = await import(
        "@/lib/ai/prompts/dailySummary"
      );
      prompt = dailySummaryPrompt(input);
    } else if (type === "nextBestAction") {
      const { nextBestActionPrompt } = await import(
        "@/lib/ai/prompts/nextBestAction"
      );
      prompt = nextBestActionPrompt(input);
    } else if (type === "insights") {
      const { insightsPrompt } = await import("@/lib/ai/prompts/insights");
      prompt = insightsPrompt(input);
    } else if (type === "activityPlan") {
      const { activityPlanPrompt } = await import(
        "@/lib/ai/prompts/activityPlan"
      );
      prompt = activityPlanPrompt(input);
    } else {
      return Response.json({ error: "unknown_type" }, { status: 400 });
    }

    if (prompt.length > 16000) return Response.json({ error: "too_large" }, { status: 413 });

    // Consume the database-backed allowance before any paid provider request.
    const { error: quotaError } = await db.rpc("consume_ai_request_quota", { p_user_id: user.id });
    if (quotaError) {
      if (quotaError.code === "P0001") return Response.json({ error: "rate_limited" }, { status: 429 });
      if (quotaError.code === "P0002") return Response.json({ error: "forbidden" }, { status: 403 });
      return Response.json({ error: "unavailable" }, { status: 503 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("[ai] anthropic error", response.status);
      return Response.json({ error: "api_error" }, { status: 502 });
    }

    const data = await response.json();
    const result = data.content?.[0]?.text ?? null;
    if (!result) console.error("[ai] empty result from anthropic");
    return Response.json({ result });
  } catch (err) {
    console.error("[ai] server_error", err instanceof Error ? err.name : "unknown");
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
