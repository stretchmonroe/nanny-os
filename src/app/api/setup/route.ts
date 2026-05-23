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
  if (userErr || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const childName: string = (body.child_name ?? "").trim();
  const birthDate: string | null = (body.birth_date ?? "").trim() || null;

  if (!childName) return NextResponse.json({ error: "child_name required" }, { status: 400 });

  // Ensure a profile row exists for this user.
  await db.from("profiles").upsert({ id: user.id, email: user.email }, { onConflict: "id" });

  // Check for an existing household membership (idempotent).
  const { data: existingMember } = await db
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let householdId = existingMember?.household_id as string | undefined;

  if (!householdId) {
    const { data: household, error: hErr } = await db
      .from("households")
      .insert({ name: "My Family" })
      .select("id")
      .single();
    if (hErr || !household) {
      return NextResponse.json({ error: "Could not create household" }, { status: 500 });
    }
    householdId = household.id as string;

    await db.from("household_members").insert({
      user_id:      user.id,
      household_id: householdId,
      role:         "parent",
      status:       "active",
    });
  }

  // children.id is TEXT PRIMARY KEY with no default — must be provided explicitly.
  const childId = crypto.randomUUID();
  const { data: child, error: cErr } = await db
    .from("children")
    .insert({ id: childId, household_id: householdId, name: childName, birth_date: birthDate })
    .select("id, name, birth_date")
    .single();

  if (cErr || !child) {
    console.error("[setup] child insert error:", cErr);
    return NextResponse.json({ error: "Could not create child", detail: cErr?.message }, { status: 500 });
  }

  return NextResponse.json({ child });
}
