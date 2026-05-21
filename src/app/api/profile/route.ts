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

    const { full_name } = await req.json();
    if (!full_name?.trim()) {
      return NextResponse.json({ error: "full_name required" }, { status: 400 });
    }

    const { error } = await admin
      .from("profiles")
      .update({ full_name: full_name.trim() })
      .eq("id", user.id);

    if (error) {
      console.error("[api/profile] update failed:", error.message);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/profile] unexpected:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
