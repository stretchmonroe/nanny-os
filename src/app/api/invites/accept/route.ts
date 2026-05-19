import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { invite_id, user_id } = await req.json();
    if (!invite_id || !user_id) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const { data: invite } = await admin
      .from("household_invites")
      .select("household_id, status, expires_at")
      .eq("id", invite_id)
      .single();

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invite already used" }, { status: 400 });
    }
    if (new Date(invite.expires_at as string) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    // Create household membership
    await admin.from("household_members").upsert(
      { user_id, household_id: invite.household_id, role: "nanny" },
      { onConflict: "user_id,household_id" },
    );

    // Mark invite accepted
    await admin.from("household_invites").update({ status: "accepted" }).eq("id", invite_id);

    return NextResponse.json({ household_id: invite.household_id });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
