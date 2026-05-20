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
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdmin();
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    // ── 1. Create household ───────────────────────────────────────────────────
    // Try with created_by first (new schema); fall back for old schema without it
    let householdId: string | null = null;
    {
      const { data: hh, error: hhErr } = await admin
        .from("households")
        .insert({ name: name.trim(), created_by: user.id })
        .select("id")
        .single();

      if (hhErr) {
        if (hhErr.message?.includes("created_by") || hhErr.message?.includes("column")) {
          // Old schema without created_by
          const { data: hh2, error: hhErr2 } = await admin
            .from("households")
            .insert({ name: name.trim() })
            .select("id")
            .single();
          if (hhErr2 || !hh2) {
            console.error("[household/create] insert failed:", hhErr2);
            return NextResponse.json({ error: "Couldn't create your family home. Try again." }, { status: 500 });
          }
          householdId = hh2.id;
        } else {
          console.error("[household/create] insert failed:", hhErr);
          return NextResponse.json({ error: "Couldn't create your family home. Try again." }, { status: 500 });
        }
      } else {
        householdId = hh?.id ?? null;
      }
    }

    if (!householdId) {
      return NextResponse.json({ error: "Couldn't create your family home. Try again." }, { status: 500 });
    }
    console.log("[household/create] household created:", householdId);

    // ── 2. Create membership ──────────────────────────────────────────────────
    // Insert without status — the DB column DEFAULT 'active' handles it after
    // migration_add_member_status.sql is run. On old schema (no status column)
    // the insert works as-is.
    const { error: mErr } = await admin
      .from("household_members")
      .insert({ household_id: householdId, user_id: user.id, role: "parent" });

    if (mErr) {
      console.error("[household/create] membership insert failed:", mErr);
      return NextResponse.json({ error: "Couldn't set up your household. Try again." }, { status: 500 });
    }
    console.log("[household/create] membership created for user", user.id);

    // ── 3. Update profiles.default_household_id (non-fatal) ──────────────────
    const { error: pErr } = await admin
      .from("profiles")
      .update({ default_household_id: householdId })
      .eq("id", user.id);
    if (pErr) console.warn("[household/create] profile update (non-fatal):", pErr.message);

    return NextResponse.json({ id: String(householdId) });
  } catch (err) {
    console.error("[household/create] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
