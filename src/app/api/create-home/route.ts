import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

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
  try {
    db = admin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server config error";
    console.error("[create-home]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data: { user }, error: userErr } = await db.auth.getUser(token);
  if (userErr || !user) {
    console.error("[create-home] getUser failed:", userErr?.message ?? "no user");
    return NextResponse.json({ error: `Auth failed: ${userErr?.message ?? "no user"}` }, { status: 401 });
  }

  // Parse body early — needed regardless of which path we take.
  const body = await req.json();
  const { childName, birthYear, birthMonth, role } = body as {
    childName: string;
    birthYear: number | null;
    birthMonth: number | null;
    role: "parent" | "nanny";
  };

  if (!childName?.trim() || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const birthDate =
    birthYear && birthMonth
      ? `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`
      : null;

  // Check for existing household membership (handles retries after partial failure).
  const { data: existing } = await db
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let householdId: string;

  if (existing?.household_id) {
    // Membership already exists — check if child was also created.
    const { data: existingChildren } = await db
      .from("children")
      .select("id, name, birth_date")
      .eq("household_id", existing.household_id)
      .limit(1);

    if (existingChildren?.[0]) {
      // Fully complete — return the existing child.
      return NextResponse.json({ child: existingChildren[0] });
    }

    // Household + membership exist but child creation failed previously — continue to child insert.
    householdId = existing.household_id;
  } else {
    // Create household.
    const { data: household, error: hhErr } = await db
      .from("households")
      .insert({ name: `${childName.trim()}'s Home` })
      .select("id")
      .single();

    if (hhErr || !household) {
      console.error("[create-home] household insert failed:", hhErr);
      return NextResponse.json({ error: `Failed to create household: ${hhErr?.message ?? "unknown"}` }, { status: 500 });
    }

    // Create membership.
    const { error: memErr } = await db
      .from("household_members")
      .insert({ user_id: user.id, household_id: household.id, role });

    if (memErr) {
      console.error("[create-home] membership insert failed:", memErr);
      return NextResponse.json({ error: `Failed to create membership: ${memErr?.message ?? "unknown"}` }, { status: 500 });
    }

    householdId = household.id;
  }

  // Create child (reached from both the fresh path and the partial-retry path).
  const { data: child, error: childErr } = await db
    .from("children")
    .insert({ id: randomUUID(), name: childName.trim(), birth_date: birthDate, household_id: householdId })
    .select("id, name, birth_date")
    .single();

  if (childErr || !child) {
    console.error("[create-home] child insert failed:", childErr);
    return NextResponse.json({ error: `Failed to create child: ${childErr?.message ?? "unknown"}` }, { status: 500 });
  }

  return NextResponse.json({ child });
}
