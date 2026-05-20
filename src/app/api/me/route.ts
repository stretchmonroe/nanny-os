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

    // ── 1. Verify auth user ───────────────────────────────────────────────────
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) {
      console.log("[api/me] ✗ user: auth error:", authErr?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[api/me] ✓ user:", user.id, user.email);

    // ── 2. Profile — upsert if trigger didn't fire ────────────────────────────
    let { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, email, default_household_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      console.log("[api/me] ✗ profile: missing — upserting now");
      const displayName =
        (user.user_metadata?.name as string | undefined) ??
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split("@")[0] ??
        null;
      await admin
        .from("profiles")
        .upsert(
          { id: user.id, full_name: displayName, email: user.email ?? null },
          { onConflict: "id" }
        );
      profile = {
        id: user.id,
        full_name: displayName ?? null,
        email: user.email ?? null,
        default_household_id: null,
      };
    }
    console.log("[api/me] ✓ profile:", JSON.stringify({
      full_name: profile.full_name,
      email: profile.email,
      default_household_id: profile.default_household_id,
    }));

    // ── 3. Membership — with status fallback for pre-migration schema ─────────
    // Try with status first (post-migration). If that column doesn't exist yet,
    // PostgREST returns an error — we retry without it and synthesise status.
    type MembershipRow = { household_id: string; role: string; status: string };
    let membership: MembershipRow | null = null;
    {
      const { data, error: selErr } = await admin
        .from("household_members")
        .select("household_id, role, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (selErr) {
        // status column doesn't exist yet — fall back to known columns
        console.warn("[api/me] membership select (with status) failed:", selErr.message);
        const { data: data2, error: selErr2 } = await admin
          .from("household_members")
          .select("household_id, role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (selErr2) {
          console.error("[api/me] membership select (fallback) failed:", selErr2.message);
        }
        membership = data2 ? { ...data2, status: "active" } : null;
      } else {
        membership = data
          ? { ...data, status: (data as { status?: string }).status ?? "active" }
          : null;
      }
    }
    console.log("[api/me] " + (membership ? "✓" : "✗") + " household_membership:", JSON.stringify(membership));

    if (!membership) {
      return NextResponse.json({
        profile,
        membership: null,
        household: null,
        children: [],
      });
    }

    // ── 4. Household ──────────────────────────────────────────────────────────
    const { data: household } = await admin
      .from("households")
      .select("id, name")
      .eq("id", membership.household_id)
      .maybeSingle();
    console.log("[api/me] " + (household ? "✓" : "✗") + " household:", JSON.stringify(household));

    // ── 5. Children ───────────────────────────────────────────────────────────
    const { data: children } = await admin
      .from("children")
      .select("id, name, full_name, focus, birth_date")
      .eq("household_id", membership.household_id)
      .order("created_at", { ascending: true })
      .limit(10);
    console.log("[api/me] " + (children?.length ? "✓" : "✗") + " children:", JSON.stringify(children));

    // Validate first child
    const firstChild = children?.[0] ?? null;
    const childName  = firstChild?.name?.trim() || firstChild?.full_name?.trim() || null;
    if (firstChild && !childName) {
      console.warn("[api/me] ⚠ child exists but has no usable name:", JSON.stringify(firstChild));
    }

    return NextResponse.json({
      profile,
      membership: {
        household_id: membership.household_id,
        role:         membership.role,
        status:       membership.status,
      },
      household: household ?? null,
      children:  (children ?? []).map((c) => ({
        id:         String(c.id),
        name:       c.name?.trim() || c.full_name?.trim() || "",
        full_name:  c.full_name ?? null,
        focus:      c.focus ?? null,
        birth_date: c.birth_date ?? null,
      })),
    });
  } catch (err) {
    console.error("[api/me] unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
