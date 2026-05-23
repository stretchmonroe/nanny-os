import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email: string = (body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // Confirm the inviter is an active parent in a household.
  const { data: membership } = await db
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "No household found" }, { status: 400 });
  if (membership.role !== "parent") return NextResponse.json({ error: "Only parents can invite" }, { status: 403 });

  const householdId = membership.household_id as string;

  // Avoid duplicate invites.
  const { data: existing } = await db
    .from("household_members")
    .select("id, status")
    .eq("household_id", householdId)
    .eq("invited_email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "An invite for this email already exists" }, { status: 409 });
  }

  const { data: invite, error: insertErr } = await db
    .from("household_members")
    .insert({
      household_id:  householdId,
      invited_email: email,
      role:          "caregiver",
      status:        "invited",
    })
    .select("id, invited_email, role, status")
    .single();

  if (insertErr || !invite) {
    return NextResponse.json({ error: "Could not create invite", detail: insertErr?.message }, { status: 500 });
  }

  return NextResponse.json({ invite });
}
