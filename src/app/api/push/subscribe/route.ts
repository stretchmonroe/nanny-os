import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const subscription = body?.subscription;
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  let url: URL;
  try { url = new URL(endpoint); } catch { return NextResponse.json({ error: "Invalid subscription" }, { status: 400 }); }
  if (typeof endpoint !== "string" || endpoint.length > 2048 ||
      url.protocol !== "https:" || !url.hostname || url.username || url.password ||
      typeof p256dh !== "string" || typeof auth !== "string" ||
      !/^[A-Za-z0-9_-]{40,256}={0,2}$/.test(p256dh) ||
      !/^[A-Za-z0-9_-]{16,256}={0,2}$/.test(auth)) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { data: membership, error: membershipErr } = await db
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (membershipErr) return NextResponse.json({ error: "Could not verify household" }, { status: 503 });
  if (!membership) return NextResponse.json({ error: "No household" }, { status: 403 });

  // Create the replacement before removing the old one so a failed insert
  // does not discard a working subscription.
  const { data: inserted, error: insertErr } = await db.from("push_subscriptions").insert({
    user_id:      user.id,
    household_id: membership.household_id,
    subscription,
    role:         membership.role,
  }).select("id").single();
  if (insertErr || !inserted) return NextResponse.json({ error: "Could not save subscription" }, { status: 503 });

  const { error: cleanupErr } = await db.from("push_subscriptions").delete()
    .eq("user_id", user.id).neq("id", inserted.id);
  if (cleanupErr) return NextResponse.json({ error: "Could not replace old subscription" }, { status: 503 });

  return NextResponse.json({ ok: true });
}
