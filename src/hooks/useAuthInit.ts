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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Only redirect to onboarding if not already there
      if (!pathname.startsWith("/onboarding")) {
        router.replace("/onboarding");
      }
      return;
    }

    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      // Authenticated but no household — resume onboarding from household step
      if (!pathname.startsWith("/onboarding")) {
        router.replace("/onboarding?resume=household");
      }
      return;
    }

    setCurrentUserRole(normaliseRole(membership.role));

    const { data: children } = await supabase
      .from("children")
      .select("id, name, focus")
      .eq("household_id", membership.household_id)
      .order("created_at", { ascending: true })
      .limit(10);

    if (children && children.length > 0) {
      const storedId = useAppStore.getState().activeChildId;
      const match = children.find((c) => c.id === storedId) ?? children[0];
      setActiveChild({
        id:   String(match.id),
        name: String(match.name),
        age:  String((match as { focus?: string }).focus ?? ""),
      });
    }

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

    // If we just confirmed email and landed at root, go to home or onboarding
    if (pathname === "/") {
      router.replace("/home");
    }
  }, [pathname, router, setActiveChild, setMemberNames, setCurrentUserRole]);

  // Run on pathname change
  useEffect(() => {
    init();
  }, [init]);

  // Also run when Supabase fires SIGNED_IN — catches email confirmation redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        init();
      }
    });
    return () => subscription.unsubscribe();
  // init is stable within a pathname; re-subscribing on pathname change is fine
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
