import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { childId, targetRole, title, body, url = "/memory" } = await req.json();
  if (!childId || !targetRole) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = admin();
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { data: child } = await db
    .from("children")
    .select("household_id")
    .eq("id", childId)
    .single();
  if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("household_id", child.household_id)
    .eq("role", targetRole);

  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const payload = JSON.stringify({ title, body, url });

  const results = await Promise.allSettled(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription as webpush.PushSubscription, payload);
      } catch (err) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 410 || e.statusCode === 404) {
          await db.from("push_subscriptions").delete().eq("id", row.id);
        }
        throw err;
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ ok: true, sent });
}
