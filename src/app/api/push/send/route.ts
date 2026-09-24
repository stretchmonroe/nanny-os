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

  const input = await req.json().catch(() => null);
  const { childId, targetRole, title, body, url = "/memory" } = input ?? {};
  if (typeof childId !== 'string' || !childId || childId.length > 120 || !targetRole) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!['parent', 'nanny'].includes(targetRole)) {
    return NextResponse.json({ error: "Invalid target role" }, { status: 400 });
  }
  if (typeof title !== 'string' || !title.trim() || title.length > 120 ||
      typeof body !== 'string' || !body.trim() || body.length > 1000) {
    return NextResponse.json({ error: "Invalid notification content" }, { status: 400 });
  }
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//') || url.length > 250) {
    return NextResponse.json({ error: "Invalid notification URL" }, { status: 400 });
  }

  const db = admin();

  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { data: child } = await db
    .from("children")
    .select("household_id")
    .eq("id", childId)
    .single();
  if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  // The service-role client bypasses RLS, so authorization must be explicit.
  const { data: membership } = await db
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", child.household_id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: recipients, error: recipientError } = await db.from("household_members")
    .select("user_id").eq("household_id", child.household_id)
    .eq("status", "active").eq("role", targetRole);
  if (recipientError) return NextResponse.json({ error: "Could not load recipients" }, { status: 503 });
  if (!recipients?.length) return NextResponse.json({ ok: true, sent: 0 });
  const { data: subs, error: subsError } = await db
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("household_id", child.household_id)
    .in("user_id", recipients.map((member) => member.user_id))
    .eq("role", targetRole);

  if (subsError) return NextResponse.json({ error: "Could not load subscriptions" }, { status: 503 });
  if (!subs || subs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const vapidSubject = process.env.VAPID_SUBJECT;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

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
