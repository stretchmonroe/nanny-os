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

  const { data: { user }, error: userErr } = await db.auth.getUser(token);
  if (userErr || !user) {
    console.error("[create-home] getUser failed:", userErr?.message ?? "no user");
    return NextResponse.json({ error: `Auth failed: ${userErr?.message ?? "no user"}` }, { status: 401 });
  }

  // Idempotent — if user already has a household, return their child.
  const { data: existing } = await db
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.household_id) {
    const { data: children } = await db
      .from("children")
      .select("id, name, birth_date")
      .eq("household_id", existing.household_id)
      .limit(1);
    return NextResponse.json({ child: children?.[0] ?? null });
  }

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

  // 1. Create household
  const { data: household, error: hhErr } = await db
    .from("households")
    .insert({ name: `${childName.trim()}'s Home` })
    .select("id")
    .single();

  if (hhErr || !household) {
    console.error("[create-home] household insert failed:", hhErr);
    return NextResponse.json({ error: "Failed to create household" }, { status: 500 });
  }

  // 2. Create membership
  const { error: memErr } = await db
    .from("household_members")
    .insert({ user_id: user.id, household_id: household.id, role });

  if (memErr) {
    console.error("[create-home] membership insert failed:", memErr);
    return NextResponse.json({ error: "Failed to create membership" }, { status: 500 });
  }

  // 3. Create child
  const birthDate =
    birthYear && birthMonth
      ? `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`
      : null;

  const { data: child, error: childErr } = await db
    .from("children")
    .insert({ name: childName.trim(), birth_date: birthDate, household_id: household.id })
    .select("id, name, birth_date")
    .single();

  if (childErr || !child) {
    console.error("[create-home] child insert failed:", childErr);
    return NextResponse.json({ error: "Failed to create child" }, { status: 500 });
  }

  return NextResponse.json({ child });
}
