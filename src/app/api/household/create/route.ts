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
    const { data: hh, error: hhErr } = await admin
      .from("households")
      .insert({ name: name.trim(), created_by: user.id })
      .select("id")
      .single();

    if (hhErr || !hh) {
      // created_by column may not exist on older schema — retry without it
      if (hhErr?.message?.includes("created_by") || hhErr?.message?.includes("column")) {
        const { data: hh2, error: hhErr2 } = await admin
          .from("households")
          .insert({ name: name.trim() })
          .select("id")
          .single();
        if (hhErr2 || !hh2) {
          console.error("[household/create] households insert failed:", hhErr2);
          return NextResponse.json({ error: "Couldn't create your family home. Try again." }, { status: 500 });
        }
        return await finishSetup(admin, user.id, hh2.id, req);
      }
      console.error("[household/create] households insert failed:", hhErr);
      return NextResponse.json({ error: "Couldn't create your family home. Try again." }, { status: 500 });
    }

    return await finishSetup(admin, user.id, hh.id, req);
  } catch (err) {
    console.error("[household/create] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function finishSetup(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  householdId: string,
  _req: NextRequest,
): Promise<NextResponse> {
  // ── 2. Create membership — try with status=active (new schema) first ───────
  const { error: mErr1 } = await admin
    .from("household_members")
    .insert({ household_id: householdId, user_id: userId, role: "parent", status: "active" });

  if (mErr1) {
    // status column likely doesn't exist on the old schema — retry without it
    if (mErr1.message?.includes("status") || mErr1.message?.includes("column") || mErr1.code === "PGRST204") {
      const { error: mErr2 } = await admin
        .from("household_members")
        .insert({ household_id: householdId, user_id: userId, role: "parent" });
      if (mErr2) {
        console.error("[household/create] membership insert (no status) failed:", mErr2);
        return NextResponse.json({ error: "Couldn't set up your household. Try again." }, { status: 500 });
      }
    } else {
      console.error("[household/create] membership insert failed:", mErr1);
      return NextResponse.json({ error: "Couldn't set up your household. Try again." }, { status: 500 });
    }
  }
  console.log("[household/create] membership created for user", userId, "in household", householdId);

  // ── 3. Update profile.default_household_id ────────────────────────────────
  // Ignore error — profiles table may not exist on very old deployments
  const { error: pErr } = await admin
    .from("profiles")
    .update({ default_household_id: householdId })
    .eq("id", userId);
  if (pErr) console.warn("[household/create] profile update failed (non-fatal):", pErr.message);

  return NextResponse.json({ id: String(householdId) });
}
