import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: { user } } = await getAdmin().auth.getUser(authToken ?? "");
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { invite_id } = await req.json();
    if (!invite_id) return NextResponse.json({ error: "Missing invite_id" }, { status: 400 });

    // Caller must be a parent in the same household
    const { data: membership } = await getAdmin()
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership || membership.role !== "parent") {
      return NextResponse.json({ error: "Only parents can cancel invites" }, { status: 403 });
    }

    // Verify invite belongs to this household
    const { data: invite } = await getAdmin()
      .from("caregiver_invites")
      .select("household_id, status")
      .eq("id", invite_id)
      .maybeSingle();

    if (!invite || invite.household_id !== membership.household_id) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invite is not pending" }, { status: 400 });
    }

    await getAdmin()
      .from("caregiver_invites")
      .update({ status: "cancelled" })
      .eq("id", invite_id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
