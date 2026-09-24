import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const fullName = typeof body?.full_name === "string" ? body.full_name.trim() : "";
  if (!fullName || fullName.length > 120) return NextResponse.json({ error: "Valid name required" }, { status: 400 });

  const { error: updateErr } = await db
    .from("profiles")
    .upsert({ id: user.id, email: user.email ?? null, full_name: fullName }, { onConflict: "id" });

  if (updateErr) return NextResponse.json({ error: "Could not save name" }, { status: 503 });

  return NextResponse.json({ ok: true });
}
