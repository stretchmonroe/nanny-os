import { supabase } from "@/lib/supabase/client";

interface NotifyOpts {
  childId:    string;
  childName?: string | null;
  senderRole: "nanny" | "parent";
  senderName?: string | null;
  eventType:  "photo" | "note" | "milestone";
}

export async function notifyHousehold(opts: NotifyOpts): Promise<void> {
  const { childId, childName, senderRole, senderName, eventType } = opts;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return;

  const first  = senderName ? senderName.split(" ")[0] : senderRole === "nanny" ? "Your caregiver" : "The family";
  const label  = eventType === "photo" ? "a photo" : eventType === "note" ? "a note" : "a milestone";
  const target = senderRole === "nanny" ? "parent" : "nanny";

  fetch("/api/push/send", {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({
      childId,
      targetRole: target,
      title: childName ? `${childName}'s day` : "New moment",
      body:  `${first} just logged ${label}`,
      url:   "/memory",
    }),
  }).catch(() => {});
}
