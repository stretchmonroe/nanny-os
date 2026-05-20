import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdmin();

    // ── 1. Verify user ────────────────────────────────────────────────────────
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) {
      console.log("[api/me] auth error:", authErr?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[api/me] user:", user.id);

    // ── 2. Profile — upsert if trigger didn't fire ────────────────────────────
    let { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, default_household_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      console.log("[api/me] profile missing — creating now");
      const displayName =
        (user.user_metadata?.name as string | undefined) ??
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split("@")[0] ??
        null;
      await admin
        .from("profiles")
        .upsert({ id: user.id, full_name: displayName }, { onConflict: "id" });
      profile = { id: user.id, full_name: displayName ?? null, default_household_id: null };
    }
    console.log("[api/me] profile:", JSON.stringify(profile));

    // ── 3. Membership — no status filter; admin bypasses RLS ─────────────────
    // Returns the first membership regardless of status so we can show the
    // correct onboarding resume step even for 'invited' rows.
    const { data: membership } = await admin
      .from("household_members")
      .select("household_id, role, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    console.log("[api/me] membership:", JSON.stringify(membership));

    if (!membership) {
      return NextResponse.json({ profile, membership: null, children: [] });
    }

    // ── 4. Children ───────────────────────────────────────────────────────────
    const { data: children } = await admin
      .from("children")
      .select("id, name, focus")
      .eq("household_id", membership.household_id)
      .order("created_at", { ascending: true })
      .limit(10);
    console.log("[api/me] children:", JSON.stringify(children));

    return NextResponse.json({
      profile,
      membership: {
        household_id: membership.household_id,
        role:         membership.role,
        status:       membership.status ?? "active", // old schema has no status — treat as active
      },
      children: children ?? [],
    });
  } catch (err) {
    console.error("[api/me] unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
