import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ found: false });
    }

    const { data } = await admin
      .from("household_invites")
      .select("id, household_id, household_name, inviter_name, child_name")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return NextResponse.json({ found: false });

    return NextResponse.json({
      found:          true,
      invite_id:      data.id,
      household_id:   data.household_id,
      household_name: data.household_name,
      inviter_name:   data.inviter_name,
      child_name:     data.child_name,
    });
  } catch {
    return NextResponse.json({ found: false });
  }
}
