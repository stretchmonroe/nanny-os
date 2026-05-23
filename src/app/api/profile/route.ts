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

  const body = await req.json().catch(() => ({}));
  const fullName = (body.full_name ?? "").trim();
  if (!fullName) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { error: updateErr } = await db
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
