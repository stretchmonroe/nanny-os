import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing env: ${!url ? "NEXT_PUBLIC_SUPABASE_URL" : "SUPABASE_SERVICE_ROLE_KEY"}`);
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let db;
  try { db = admin(); } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server config error" }, { status: 500 });
  }

  const { data: { user }, error: userErr } = await db.auth.getUser(token);
  if (userErr || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code: string = (body.code ?? "").trim().toUpperCase().replace(/-/g, "");
  if (!code || code.length < 8) return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });

  // Check nanny doesn't already have a household.
  const { data: existing } = await db
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.household_id) {
    // Already in a household — return their child.
    const { data: children } = await db
      .from("children")
      .select("id, name, birth_date")
      .eq("household_id", existing.household_id)
      .limit(1);
    return NextResponse.json({ child: children?.[0] ?? null });
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Your account has no verified email" }, { status: 400 });

  // A code alone is not authorization. It must match an outstanding invitation
  // for the signed-in email address.
  const { data: invites, error: inviteErr } = await db
    .from("household_members")
    .select("id, household_id, role")
    .eq("invited_email", email)
    .eq("status", "invited")
    .is("user_id", null);

  if (inviteErr) {
    console.error("[invite/claim] invite lookup failed:", inviteErr);
    return NextResponse.json({ error: "Could not verify invite" }, { status: 500 });
  }

  const invite = (invites ?? []).find(
    (row) => String(row.household_id).split("-")[0].toUpperCase() === code.slice(0, 8)
  );
  if (!invite) return NextResponse.json({ error: "Invite code not found for this email" }, { status: 404 });

  const householdId = invite.household_id as string;

  // Claim the pre-authorized membership rather than creating a new one.
  const { error: memErr } = await db
    .from("household_members")
    .update({ user_id: user.id, status: "active" })
    .eq("id", invite.id)
    .eq("status", "invited");

  if (memErr) {
    console.error("[invite/claim] membership insert failed:", memErr);
    return NextResponse.json({ error: `Failed to join household: ${memErr.message}` }, { status: 500 });
  }

  // Return the household's child so the nanny's activeChild is populated.
  const { data: children } = await db
    .from("children")
    .select("id, name, birth_date")
    .eq("household_id", householdId)
    .limit(1);

  return NextResponse.json({ child: children?.[0] ?? null });
}
