import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ChildProfile } from "@/lib/onboarding-flow";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const profile: ChildProfile = await request.json();

    const prompt = `You are a warm, insightful child development advisor. Based on the following profile of a young child, write a brief, personalized welcome message (3-4 sentences) that:
1. Acknowledges something specific and lovely about this child based on their profile
2. Mentions 1-2 personalized activity ideas that would suit them perfectly
3. Ends with an encouraging, warm note for the parent

Child Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Sleep pattern: ${profile.sleepPattern}
- Activity level: ${profile.activityLevel}
- Language development: ${profile.languageDevelopment}
- Favorite activities: ${profile.favoriteActivities.join(", ")}
- Sensory sensitivities: ${profile.sensorySensitivities.length ? profile.sensorySensitivities.join(", ") : "none noted"}
- Environment preference: ${profile.environmentPreference}
- Developmental focus: ${profile.developmentalFocus.join(", ")}
- Montessori interest: ${profile.montessoriInterest}

Write the message in second person, addressing the parent warmly. Keep it under 80 words. No bullet points — flowing prose only. Use one emoji naturally in the message.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    const summary = content.type === "text" ? content.text : "";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Onboarding API error:", error);
    return NextResponse.json(
      { error: "Failed to generate profile" },
      { status: 500 }
    );
  }
}
