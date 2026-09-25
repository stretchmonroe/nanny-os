import { NextRequest, NextResponse } from "next/server";
import { POST as createHome } from "../create-home/route";

// Keep the older card's request shape while sharing the parent-only workflow.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (body?.birth_date != null && typeof body.birth_date !== "string") {
    return NextResponse.json({ error: "Invalid birth date" }, { status: 400 });
  }
  const forwarded = new Request(req.url, {
    method: "POST",
    headers: {
      authorization: req.headers.get("authorization") ?? "",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      childName: body?.child_name,
      birthDate: body?.birth_date ?? null,
      role: "parent",
    }),
  });
  return createHome(forwarded as NextRequest);
}
