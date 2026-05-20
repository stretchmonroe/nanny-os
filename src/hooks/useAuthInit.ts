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
  const { setActiveChild, setMemberNames, setCurrentUserRole, setAuthReady } = useAppStore();

  const init = useCallback(async () => {
    if (pathname.startsWith("/invite/")) {
      setAuthReady(true);
      return;
    }

    console.log("[auth] init — pathname:", pathname);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("[auth] no session — redirecting to /onboarding");
      if (!pathname.startsWith("/onboarding")) {
        router.replace("/onboarding");
      }
      setAuthReady(true);
      return;
    }

    console.log("[auth] session OK, fetching /api/me");
    let membership: { household_id: string; role: string } | null = null;
    let children: { id: string; name: string; focus?: string }[] = [];
    let fetchSucceeded = false;

    try {
      const res = await fetch("/api/me", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      console.log("[auth] /api/me status:", res.status);
      if (res.ok) {
        const json = await res.json();
        console.log("[auth] /api/me response:", JSON.stringify(json));
        membership = json.membership ?? null;
        children   = json.children  ?? [];
        fetchSucceeded = true;
      } else {
        const errBody = await res.text().catch(() => "");
        console.warn("[auth] /api/me non-OK:", res.status, errBody);
      }
    } catch (err) {
      console.warn("[auth] /api/me network error:", err);
    }

    if (fetchSucceeded && membership === null) {
      console.log("[auth] membership null — redirecting to /onboarding?resume=household");
      if (!pathname.startsWith("/onboarding")) {
        router.replace("/onboarding?resume=household");
      }
      setAuthReady(true);
      return;
    }

    if (!fetchSucceeded) {
      console.warn("[auth] /api/me failed — staying on current page, not redirecting");
      setAuthReady(true);
      return;
    }

    setCurrentUserRole(normaliseRole(membership!.role));
    console.log("[auth] role set:", membership!.role);

    if (children.length > 0) {
      const storedId = useAppStore.getState().activeChildId;
      const match    = children.find((c) => c.id === storedId) ?? children[0];
      setActiveChild({
        id:   String(match.id),
        name: String(match.name),
        age:  String(match.focus ?? ""),
      });
      console.log("[auth] activeChild set:", match.name, match.id);
    } else {
      console.log("[auth] no children in /api/me response");
    }

    try {
      const circleRes  = await fetch("/api/care-circle", {
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

    setAuthReady(true);

    if (pathname === "/") {
      router.replace("/home");
    }
  }, [pathname, router, setActiveChild, setMemberNames, setCurrentUserRole, setAuthReady]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") init();
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
