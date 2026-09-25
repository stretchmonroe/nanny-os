import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
  return Array.from(randomBytes(12), (byte) => alphabet[byte & 31]).join("");
}

async function parentHousehold(req: NextRequest) {
  const token = req.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: membership, error: membershipError } = await db.from("household_members")
    .select("household_id, role").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (membershipError) return { error: NextResponse.json({ error: "Could not verify household" }, { status: 503 }) };
  if (!membership || membership.role !== "parent") {
    return { error: NextResponse.json({ error: "Only active parents can manage invite codes" }, { status: 403 }) };
  }
  return { db, user, householdId: membership.household_id };
}

export async function GET(req: NextRequest) {
  const result = await parentHousehold(req);
  if (result.error) return result.error;
  const { data, error } = await result.db!.from("household_join_codes")
    .select("code, expires_at").eq("household_id", result.householdId!).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load invite code" }, { status: 503 });
  return NextResponse.json({ code: data && Date.parse(data.expires_at) > Date.now() ? data.code : null,
    expiresAt: data?.expires_at ?? null });
}

export async function POST(req: NextRequest) {
  const result = await parentHousehold(req);
  if (result.error) return result.error;
  const code = makeCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await result.db!.from("household_join_codes").upsert({
    household_id: result.householdId!, code, created_by: result.user!.id,
    created_at: new Date().toISOString(), expires_at: expiresAt,
  }, { onConflict: "household_id" });
  if (error) return NextResponse.json({ error: "Could not generate invite code" }, { status: 503 });
  return NextResponse.json({ code, expiresAt });
}
