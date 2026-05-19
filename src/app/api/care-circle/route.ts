import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token ?? "");

    if (!user) {
      return NextResponse.json({ demo: true, members: [], invites: [], household_id: null });
    }

    // Get the user's household membership
    const { data: membership } = await admin
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ demo: true, members: [], invites: [], household_id: null });
    }

    const householdId = membership.household_id as string;

    // Fetch all members of this household
    const { data: members } = await admin
      .from("household_members")
      .select("user_id, role, created_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    // Fetch user metadata for each member
    const enriched = await Promise.all(
      (members ?? []).map(async (m) => {
        const { data: { user: u } } = await admin.auth.admin.getUserById(m.user_id as string);
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
    const { data: invites } = await admin
      .from("household_invites")
      .select("id, email, inviter_name, note, created_at, expires_at")
      .eq("household_id", householdId)
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    // Fetch household + child names for invite creation
    const { data: household } = await admin
      .from("households")
      .select("name")
      .eq("id", householdId)
      .single();

    const { data: childRow } = await admin
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
