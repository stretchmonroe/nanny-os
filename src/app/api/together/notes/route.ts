import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function verifyMembership(db: ReturnType<typeof admin>, userId: string, childId: string) {
  const { data: child } = await db
    .from("children")
    .select("household_id")
    .eq("id", childId)
    .maybeSingle();

  if (!child) return null;

  const { data: membership } = await db
    .from("household_members")
    .select("role")
    .eq("household_id", child.household_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return membership ?? null;
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const childId = req.nextUrl.searchParams.get("childId") ?? "";
  if (!childId) return NextResponse.json({ notes: [] });

  const membership = await verifyMembership(db, user.id, childId);
  if (!membership) return NextResponse.json({ notes: [] });

  const { data: notes } = await db
    .from("memory_events")
    .select("id, content, created_by, created_at")
    .eq("child_id", childId)
    .eq("type", "handoff")
    .order("created_at", { ascending: false })
    .limit(30);

  return NextResponse.json({ notes: notes ?? [] });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const content: string = (body.content ?? "").trim();
  const childId: string = (body.childId ?? "").trim();

  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
  if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });

  const membership = await verifyMembership(db, user.id, childId);
  if (!membership) return NextResponse.json({ error: "Not a member of this household" }, { status: 403 });

  const { data: note, error: insertErr } = await db
    .from("memory_events")
    .insert({
      type:       "handoff",
      content,
      child_id:   childId,
      created_by: membership.role,
      created_at: new Date().toISOString(),
    })
    .select("id, content, created_by, created_at")
    .single();

  if (insertErr || !note) {
    return NextResponse.json(
      { error: "Could not save note", detail: insertErr?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ note });
}
