"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

// DB role values include 'caregiver' (new) and 'nanny' (legacy).
// The store uses 'nanny' as the caregiver key throughout the app.
function normaliseRole(role: string): "nanny" | "parent" {
  return role === "parent" ? "parent" : "nanny";
}

export function useAuthInit() {
  const router   = useRouter();
  const pathname = usePathname();
  const { setActiveChild, setMemberNames, setCurrentUserRole } = useAppStore();

  useEffect(() => {
    // Invite pages are public — don't redirect or seed store here
    if (pathname.startsWith("/invite/")) return;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/onboarding");
        return;
      }

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id, role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!membership) {
        router.replace("/onboarding");
        return;
      }

      setCurrentUserRole(normaliseRole(membership.role));

      // Load children in this household
      const { data: children } = await supabase
        .from("children")
        .select("id, name, age")
        .eq("household_id", membership.household_id)
        .order("created_at", { ascending: true })
        .limit(10);

      if (children && children.length > 0) {
        const storedId = useAppStore.getState().activeChildId;
        const match = children.find((c) => c.id === storedId) ?? children[0];
        setActiveChild({
          id:   String(match.id),
          name: String(match.name),
          age:  String(match.age ?? ""),
        });
      }

      // Load household member display names for attribution
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      try {
        const res = await fetch("/api/care-circle", {
          headers: { authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!json.demo && Array.isArray(json.members)) {
          const names = { nanny: "Caregiver", parent: "Parent" };
          for (const m of json.members as { role: string; display_name: string }[]) {
            const key = normaliseRole(m.role);
            if (m.display_name) names[key] = m.display_name;
          }
          setMemberNames(names);
        }
      } catch {
        // keep defaults
      }
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
