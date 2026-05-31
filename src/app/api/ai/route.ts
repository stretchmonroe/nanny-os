import { systemPrompt } from "@/lib/ai/prompts/systemPrompt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, input } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("[ai] key present:", !!apiKey, "length:", apiKey?.length ?? 0, "prefix:", apiKey?.slice(0, 7) ?? "none");
    if (!apiKey) {
      return Response.json({ error: "no_key" });
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
      return Response.json({ error: "unknown_type" });
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
      const errBody = await response.text().catch(() => "(unreadable)");
      console.error("[ai] anthropic error", response.status, errBody);
      return Response.json({ error: "api_error", status: response.status });
    }

    const data = await response.json();
    const result = data.content?.[0]?.text ?? null;
    if (!result) console.error("[ai] empty result from anthropic", JSON.stringify(data));
    return Response.json({ result });
  } catch (err) {
    console.error("[ai] server_error", err);
    return Response.json({ error: "server_error" });
  }
}
