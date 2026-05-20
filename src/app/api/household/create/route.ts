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
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify the token and get the user
    const { data: { user }, error: authErr } = await getAdmin().auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const admin = getAdmin();

    const { data: hh, error: hhErr } = await admin
      .from("households")
      .insert({ name: name.trim() })
      .select("id")
      .single();
    if (hhErr || !hh) {
      return NextResponse.json({ error: "Couldn't create your family home. Try again." }, { status: 500 });
    }

    const { error: mErr } = await admin
      .from("household_members")
      .insert({ household_id: hh.id, user_id: user.id, role: "parent" });
    if (mErr) {
      return NextResponse.json({ error: "Couldn't set up your household. Try again." }, { status: 500 });
    }

    return NextResponse.json({ id: String(hh.id) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
