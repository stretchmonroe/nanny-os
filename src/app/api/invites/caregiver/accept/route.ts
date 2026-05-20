import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const authToken = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: { user } } = await getAdmin().auth.getUser(authToken ?? "");
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token, display_name } = await req.json();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    // Fetch invite by token
    const { data: invite } = await getAdmin()
      .from("caregiver_invites")
      .select("id, household_id, role, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "This invite has already been used" }, { status: 400 });
    }
    if (new Date(invite.expires_at as string) < new Date()) {
      return NextResponse.json({ error: "This invite has expired" }, { status: 400 });
    }

    // Create household membership (upsert — safe if user joins via multiple paths)
    await getAdmin()
      .from("household_members")
      .upsert(
        {
          user_id:      user.id,
          household_id: invite.household_id,
          role:         invite.role ?? "caregiver",
          status:       "active",
        },
        { onConflict: "household_id,user_id" },
      );

    // Update profile display_name if provided
    if (display_name?.trim()) {
      await getAdmin()
        .from("profiles")
        .update({ full_name: display_name.trim() })
        .eq("id", user.id);
    }

    // Mark invite accepted
    await getAdmin()
      .from("caregiver_invites")
      .update({
        status:      "accepted",
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    return NextResponse.json({ household_id: invite.household_id });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
