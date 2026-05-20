import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: { user } } = await getAdmin().auth.getUser(token ?? "");

    if (!user) {
      return NextResponse.json({ demo: true, members: [], invites: [], household_id: null });
    }

    // Get the user's household membership
    const { data: membership } = await getAdmin()
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ demo: true, members: [], invites: [], household_id: null });
    }

    const householdId = membership.household_id as string;

    // Fetch all members of this household
    const { data: members } = await getAdmin()
      .from("household_members")
      .select("user_id, role, created_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    // Fetch user metadata for each member
    const enriched = await Promise.all(
      (members ?? []).map(async (m) => {
        const { data: { user: u } } = await getAdmin().auth.admin.getUserById(m.user_id as string);
        return {
          user_id:      m.user_id,
          role:         m.role,
          joined_at:    m.created_at,
          display_name: (u?.user_metadata?.name as string | undefined) ?? (u?.email?.split("@")[0] ?? "Unknown"),
          email:        u?.email ?? "",
          is_self:      m.user_id === user.id,
        };
      }),
    );

    // Fetch pending invites
    const { data: rawInvites } = await getAdmin()
      .from("caregiver_invites")
      .select("id, email, token, role, invited_by, created_at, expires_at")
      .eq("household_id", householdId)
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    // Enrich with inviter display name
    const invites = await Promise.all(
      (rawInvites ?? []).map(async (inv) => {
        let inviterName = "";
        if (inv.invited_by) {
          const { data: p } = await getAdmin()
            .from("profiles")
            .select("full_name")
            .eq("id", inv.invited_by)
            .maybeSingle();
          inviterName = (p as { full_name: string } | null)?.full_name ?? "";
        }
        return {
          id:           inv.id,
          email:        inv.email,
          token:        inv.token,
          role:         inv.role,
          inviter_name: inviterName,
          note:         null,
          created_at:   inv.created_at,
          expires_at:   inv.expires_at,
        };
      }),
    );

    // Fetch household + child names for invite creation
    const { data: household } = await getAdmin()
      .from("households")
      .select("name")
      .eq("id", householdId)
      .single();

    const { data: childRow } = await getAdmin()
      .from("children")
      .select("name")
      .eq("household_id", householdId)
      .limit(1)
      .single();

    const selfMember = enriched.find((m) => m.is_self);

    return NextResponse.json({
      demo:          false,
      household_id:  householdId,
      household_name: (household as { name: string } | null)?.name ?? "",
      child_name:    (childRow as { name: string } | null)?.name ?? "",
      your_name:     selfMember?.display_name ?? "",
      is_parent:     membership.role === "parent",
      members:       enriched,
      invites:       invites ?? [],
    });
  } catch {
    return NextResponse.json({ demo: true, members: [], invites: [], household_id: null });
  }
}
