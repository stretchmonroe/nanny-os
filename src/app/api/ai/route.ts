import { systemPrompt } from "@/lib/ai/prompts/systemPrompt";

export async function POST(req: Request) {
  const body = await req.json();

  const { type, input } = body;

  let prompt = "";

  if (type === "dailyPlan") {
    const { generateDailyPlanPrompt } = await import(
      "@/lib/ai/prompts/generateDailyPlan"
    );
    prompt = generateDailyPlanPrompt(input);
  }

  if (type === "dailySummary") {
    const { dailySummaryPrompt } = await import(
      "@/lib/ai/prompts/dailySummary"
    );
    prompt = dailySummaryPrompt(input);
  }

  if (type === "nextBestAction") {
    const { nextBestActionPrompt } = await import(
      "@/lib/ai/prompts/nextBestAction"
    );
    prompt = nextBestActionPrompt(input);
  }

  // CALL CLAUDE HERE
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();

  return Response.json({
    result: data.content[0].text,
  });
}
