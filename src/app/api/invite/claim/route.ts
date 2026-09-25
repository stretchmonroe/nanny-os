import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase().replace(/[\s-]/g, "") : "";
  const legacy = /^[0-9A-F]{8}$/.test(code);
  if (!legacy && !/^[A-HJ-NP-Z2-9]{12}$/.test(code)) return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  if (!user.email_confirmed_at) return NextResponse.json({ error: "Verify your email first" }, { status: 403 });
  const { data: householdId, error: claimError } = await db.rpc(legacy ? "claim_household_invitation" : "claim_household_join_code", {
    p_user_id: user.id, p_code: code,
  });
  if (claimError) {
    const rejected = ["P0001", "23505"].includes(claimError.code);
    return NextResponse.json({ error: rejected ? "Invitation unavailable or already joined" : "Could not verify invitation" }, { status: rejected ? 409 : 503 });
  }
  const { data: children, error: childError } = await db.from("children")
    .select("id, name, birth_date").eq("household_id", householdId).limit(1);
  if (childError) return NextResponse.json({ error: "Joined successfully; reload to load your household" }, { status: 503 });
  return NextResponse.json({ child: children?.[0] ?? null });
}
