"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

function normaliseRole(role: string): "nanny" | "parent" {
  return role === "parent" ? "parent" : "nanny";
}

export function useAuthInit() {
  const router   = useRouter();
  const pathname = usePathname();
  const { setActiveChild, setMemberNames, setCurrentUserRole } = useAppStore();

  const init = useCallback(async () => {
    if (pathname.startsWith("/invite/")) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      if (!pathname.startsWith("/onboarding")) {
        router.replace("/onboarding");
      }
      return;
    }

    // Use service-role endpoint to bypass RLS for membership lookup
    let membership: { household_id: string; role: string } | null = null;
    let children: { id: string; name: string; focus?: string }[] = [];
    let fetchSucceeded = false;

    try {
      const res = await fetch("/api/me", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        membership = json.membership ?? null;
        children = json.children ?? [];
        fetchSucceeded = true;
      }
      // On 5xx we leave fetchSucceeded=false — don't redirect, let page render
    } catch {
      // network error — stay on current page
    }

    if (fetchSucceeded && membership === null) {
      // Definitively no membership — redirect to household setup
      if (!pathname.startsWith("/onboarding")) {
        router.replace("/onboarding?resume=household");
      }
      return;
    }

    if (!fetchSucceeded) {
      // Can't confirm membership state — don't redirect
      return;
    }

    setCurrentUserRole(normaliseRole(membership!.role));

    if (children.length > 0) {
      const storedId = useAppStore.getState().activeChildId;
      const match = children.find((c) => c.id === storedId) ?? children[0];
      setActiveChild({
        id:   String(match.id),
        name: String(match.name),
        age:  String(match.focus ?? ""),
      });
    }

    // Load member display names
    try {
      const circleRes = await fetch("/api/care-circle", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      const circleJson = await circleRes.json();
      if (!circleJson.demo && Array.isArray(circleJson.members)) {
        const names = { nanny: "Caregiver", parent: "Parent" };
        for (const m of circleJson.members as { role: string; display_name: string }[]) {
          const key = normaliseRole(m.role);
          if (m.display_name) names[key] = m.display_name;
        }
        setMemberNames(names);
      }
    } catch {
      // keep defaults
    }

    if (pathname === "/") {
      router.replace("/home");
    }
  }, [pathname, router, setActiveChild, setMemberNames, setCurrentUserRole]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        init();
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
