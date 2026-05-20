import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await getAdmin().auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, age, householdId } = await req.json();
    if (!name?.trim() || !householdId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = getAdmin();

    // Verify the user is a member of this household
    const { data: membership } = await admin
      .from("household_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("household_id", householdId)
      .single();
    if (!membership) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: child, error } = await admin
      .from("children")
      .insert({ id: randomUUID(), name: name.trim(), focus: age ?? "", household_id: householdId })
      .select("id")
      .single();
    if (error || !child) {
      return NextResponse.json({ error: "Couldn't save your child's profile. Try again." }, { status: 500 });
    }

    return NextResponse.json({ id: String(child.id) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
