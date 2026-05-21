import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdmin();
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { child_id, name, birth_date } = await req.json();
    if (!child_id) return NextResponse.json({ error: "child_id required" }, { status: 400 });

    // Verify user's household membership covers this child
    const { data: child } = await admin
      .from("children")
      .select("household_id")
      .eq("id", child_id)
      .maybeSingle();

    if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

    const { data: membership } = await admin
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .eq("household_id", child.household_id)
      .maybeSingle();

    if (!membership) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const patch: Record<string, string> = {};
    if (name?.trim())       patch.name       = name.trim();
    if (birth_date?.trim()) patch.birth_date = birth_date.trim();

    if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });

    const { error } = await admin
      .from("children")
      .update(patch)
      .eq("id", child_id);

    if (error) {
      console.error("[api/child] update failed:", error.message);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/child] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
