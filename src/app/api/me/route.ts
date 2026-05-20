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
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: membership } = await admin
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) return NextResponse.json({ membership: null });

    const { data: children } = await admin
      .from("children")
      .select("id, name, focus")
      .eq("household_id", membership.household_id)
      .order("created_at", { ascending: true })
      .limit(10);

    return NextResponse.json({ membership, children: children ?? [] });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
