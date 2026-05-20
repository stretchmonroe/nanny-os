import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token) return NextResponse.json({ found: false });

    const { data: invite } = await getAdmin()
      .from("caregiver_invites")
      .select("id, household_id, email, role, status, expires_at, invited_by")
      .eq("token", token)
      .maybeSingle();

    if (!invite) return NextResponse.json({ found: false });
    if (invite.status !== "pending") return NextResponse.json({ found: false, reason: invite.status });
    if (new Date(invite.expires_at as string) < new Date()) {
      return NextResponse.json({ found: false, reason: "expired" });
    }

    // Enrich with household name, child name, inviter display name
    const [householdRes, childRes, profileRes] = await Promise.all([
      getAdmin().from("households").select("name").eq("id", invite.household_id).maybeSingle(),
      getAdmin().from("children").select("name").eq("household_id", invite.household_id).limit(1).maybeSingle(),
      invite.invited_by
        ? getAdmin().from("profiles").select("full_name").eq("id", invite.invited_by).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      found:           true,
      invite_id:       invite.id,
      email:           invite.email,
      role:            invite.role,
      household_name:  (householdRes.data as { name: string } | null)?.name ?? "",
      child_name:      (childRes.data   as { name: string } | null)?.name ?? "",
      invited_by_name: (profileRes.data as { full_name: string } | null)?.full_name ?? "",
      expires_at:      invite.expires_at,
    });
  } catch {
    return NextResponse.json({ found: false });
  }
}
