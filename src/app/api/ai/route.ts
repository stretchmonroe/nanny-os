import { systemPrompt } from "@/lib/ai/prompts/systemPrompt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, input } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
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
    } else if (type === "research") {
      const { researchPrompt } = await import("@/lib/ai/prompts/research");
      prompt = researchPrompt(input as { question: string; childAge: string; childName: string });
    } else {
      return Response.json({ error: "unknown_type" });
    }

    const isResearch = type === "research";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: isResearch ? 1200 : 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return Response.json({ error: "api_error" });
    }

    const data = await response.json();
    return Response.json({ result: data.content?.[0]?.text ?? null });
  } catch {
    return Response.json({ error: "server_error" });
  }
}
