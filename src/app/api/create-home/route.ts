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
  const body = await req.json().catch(() => null);
  const childName = typeof body?.childName === "string" ? body.childName.trim() : "";
  if (!childName || childName.length > 120 || body?.role !== "parent") {
    return NextResponse.json({ error: "Parent setup requires a child name" }, { status: 400 });
  }
  const { birthYear, birthMonth } = body;
  let birthDate: string | null = null;
  if (body.birthDate != null && body.birthDate !== "") {
    if (typeof body.birthDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.birthDate) ||
        Number.isNaN(Date.parse(body.birthDate)) ||
        new Date(body.birthDate).toISOString().slice(0, 10) !== body.birthDate ||
        body.birthDate > new Date().toISOString().slice(0, 10)) {
      return NextResponse.json({ error: "Invalid birth date" }, { status: 400 });
    }
    birthDate = body.birthDate;
  } else if (birthYear != null || birthMonth != null) {
    if (!Number.isInteger(birthYear) || !Number.isInteger(birthMonth) ||
        birthYear < 1900 || birthYear > new Date().getFullYear() ||
        birthMonth < 1 || birthMonth > 12) {
      return NextResponse.json({ error: "Invalid birth date" }, { status: 400 });
    }
    birthDate = `${birthYear}-${String(birthMonth).padStart(2, "0")}-01`;
    if (birthDate > new Date().toISOString().slice(0, 10)) {
      return NextResponse.json({ error: "Invalid birth date" }, { status: 400 });
    }
  }

  // Check for existing household membership (handles retries after partial failure).
  const { data: existing, error: membershipErr } = await db
    .from("household_members")
    .select("household_id, role, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipErr) return NextResponse.json({ error: "Could not verify household membership" }, { status: 409 });
  if (existing && (existing.status !== "active" || existing.role !== "parent")) {
    return NextResponse.json({ error: "Only active parents can set up a home" }, { status: 403 });
  }

  const { error: profileErr } = await db.from("profiles")
    .upsert({ id: user.id, email: user.email ?? null }, { onConflict: "id" });
  if (profileErr) return NextResponse.json({ error: "Could not save profile" }, { status: 503 });

  let householdId: string;

  if (existing?.household_id) {
    // Membership already exists — check if child was also created.
    const { data: existingChildren, error: existingChildrenErr } = await db
      .from("children")
      .select("id, name, birth_date")
      .eq("household_id", existing.household_id)
      .limit(1);

    if (existingChildrenErr) return NextResponse.json({ error: "Could not load household" }, { status: 503 });

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
      .insert({ name: `${childName}'s Home` })
      .select("id")
      .single();

    if (hhErr || !household) {
      console.error("[create-home] household insert failed:", hhErr);
      return NextResponse.json({ error: `Failed to create household: ${hhErr?.message ?? "unknown"}` }, { status: 500 });
    }

    // Create membership.
    const { error: memErr } = await db
      .from("household_members")
      .insert({ user_id: user.id, household_id: household.id, role: "parent", status: "active" });

    if (memErr) {
      console.error("[create-home] membership insert failed:", memErr);
      await db.from("households").delete().eq("id", household.id);
      return NextResponse.json({ error: "Could not create household membership" }, { status: 503 });
    }

    householdId = household.id;
  }

  // Create child (reached from both the fresh path and the partial-retry path).
  const { data: child, error: childErr } = await db
    .from("children")
    .insert({ id: randomUUID(), name: childName, birth_date: birthDate, household_id: householdId })
    .select("id, name, birth_date")
    .single();

  if (childErr || !child) {
    console.error("[create-home] child insert failed:", childErr);
    return NextResponse.json({ error: `Failed to create child: ${childErr?.message ?? "unknown"}` }, { status: 500 });
  }

  return NextResponse.json({ child });
}
