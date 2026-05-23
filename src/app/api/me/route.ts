import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Service-role client bypasses RLS — never expose this key client-side.
function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = admin();

  const { data: { user }, error: userErr } = await db.auth.getUser(token);
  if (userErr || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const [{ data: profile }, { data: membership }] = await Promise.all([
    db.from("profiles").select("id, full_name, email").eq("id", user.id).single(),
    db.from("household_members").select("household_id, role").eq("user_id", user.id).maybeSingle(),
  ]);

  let children: { id: string; name: string | null; full_name: string | null; birth_date: string | null }[] = [];
  if (membership?.household_id) {
    const { data } = await db
      .from("children")
      .select("id, name, full_name, birth_date")
      .eq("household_id", membership.household_id);
    children = data ?? [];
  }

  return NextResponse.json({ profile, membership, children });
}
