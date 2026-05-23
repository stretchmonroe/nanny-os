import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  // Get the user's household membership (no status filter — create-home inserts without status).
  const { data: myMembership } = await db
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMembership) return NextResponse.json({ members: [], householdId: null });

  const householdId = myMembership.household_id as string;

  // All members who have actually joined (user_id is set).
  const { data: rows } = await db
    .from("household_members")
    .select("user_id, role, invited_email, created_at")
    .eq("household_id", householdId)
    .not("user_id", "is", null)
    .order("created_at", { ascending: true });

  // Fetch profiles for members who have signed up.
  const userIds = (rows ?? []).map((r) => r.user_id).filter(Boolean);
  const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap[p.id] = { full_name: p.full_name, email: p.email };
    }
  }

  const members = (rows ?? []).map((r) => ({
    role:         r.role as string,
    display_name: profileMap[r.user_id]?.full_name ?? null,
    email:        profileMap[r.user_id]?.email ?? r.invited_email ?? null,
    is_me:        r.user_id === user.id,
  }));

  return NextResponse.json({ members, householdId });
}
