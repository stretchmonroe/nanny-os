import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token ?? "");

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, household_id, inviter_name, child_name, note } = await req.json();
    if (!email || !household_id) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // Caller must be a parent in this household
    const { data: membership } = await admin
      .from("household_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("household_id", household_id)
      .single();

    if (!membership || membership.role !== "parent") {
      return NextResponse.json({ error: "Only parents can invite" }, { status: 403 });
    }

    // Fetch household name for denormalized storage
    const { data: household } = await admin
      .from("households")
      .select("name")
      .eq("id", household_id)
      .single();

    const householdName = (household as { name: string } | null)?.name ?? "";

    // Expire any existing pending invite for this email+household
    await admin
      .from("household_invites")
      .update({ status: "expired" })
      .eq("email", email.toLowerCase().trim())
      .eq("household_id", household_id)
      .eq("status", "pending");

    // Create new invite (7-day expiry)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from("household_invites").insert({
      email:          email.toLowerCase().trim(),
      household_id,
      household_name: householdName,
      invited_by:     user.id,
      inviter_name:   inviter_name ?? null,
      child_name:     child_name ?? null,
      note:           note ?? null,
      status:         "pending",
      expires_at:     expiresAt,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
