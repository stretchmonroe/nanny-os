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

    const { user_id } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Caller must be a parent in the same household
    const { data: callerMembership } = await admin
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (!callerMembership || callerMembership.role !== "parent") {
      return NextResponse.json({ error: "Only parents can remove caregivers" }, { status: 403 });
    }

    // Cannot remove yourself
    if (user_id === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    // Target must be in the same household
    const { data: targetMembership } = await admin
      .from("household_members")
      .select("role")
      .eq("user_id", user_id)
      .eq("household_id", callerMembership.household_id)
      .single();

    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await admin
      .from("household_members")
      .delete()
      .eq("user_id", user_id)
      .eq("household_id", callerMembership.household_id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
