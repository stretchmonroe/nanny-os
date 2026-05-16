import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ChildProfile } from "@/lib/onboarding-flow";
import type { TimeWindow } from "@/lib/activities";
import { buildActivitiesPrompt, buildSwapPrompt } from "@/lib/activities-prompt";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profile,
      swapWindow,
    }: { profile: ChildProfile; swapWindow?: TimeWindow } = body;

    const isSwap = Boolean(swapWindow);
    const prompt = isSwap
      ? buildSwapPrompt(profile, swapWindow!)
      : buildActivitiesPrompt(profile);
    const maxTokens = isSwap ? 400 : 1800;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (isSwap) {
      return NextResponse.json({ activity: parsed.activity });
    }
    return NextResponse.json({ activities: parsed.activities });
  } catch (error) {
    console.error("Activities API error:", error);
    return NextResponse.json(
      { error: "Failed to generate activities" },
      { status: 500 }
    );
  }
}
