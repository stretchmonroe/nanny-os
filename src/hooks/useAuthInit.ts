"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

function normaliseRole(role: string): "nanny" | "parent" {
  // 'caregiver' and 'grandparent' are treated as 'nanny' internally
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

    // ── Step 1: user (session) ────────────────────────────────────────────────
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("[auth] ✗ user: no session");
      if (!pathname.startsWith("/onboarding")) router.replace("/onboarding");
      setAuthReady(true);
      return;
    }
    console.log("[auth] ✓ user:", session.user.id);

    // ── Step 2–4: profile / membership / children via /api/me ─────────────────
    type MeResponse = {
      profile:    { id: string; full_name: string | null; default_household_id: string | null } | null;
      membership: { household_id: string; role: string; status: string } | null;
      children:   { id: string; name: string; focus?: string }[];
    };

    let me: MeResponse | null = null;
    let fetchOk = false;

    try {
      const res = await fetch("/api/me", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      console.log("[auth] /api/me status:", res.status);
      if (res.ok) {
        me = await res.json() as MeResponse;
        fetchOk = true;
      } else {
        const body = await res.text().catch(() => "");
        console.warn("[auth] /api/me error body:", body);
      }
    } catch (err) {
      console.warn("[auth] /api/me network error:", err);
    }

    if (!fetchOk || !me) {
      // Network or server error — don't redirect, let page render as-is
      console.warn("[auth] /api/me failed — staying on current page");
      setAuthReady(true);
      return;
    }

    // ── Checklist logging ─────────────────────────────────────────────────────
    const { profile, membership, children } = me;

    console.log("[auth] checklist:");
    console.log("  ✓ user:                 ", session.user.id);
    console.log("  " + (profile   ? "✓" : "✗") + " profile:              ", profile   ? `full_name=${profile.full_name}` : "MISSING");
    console.log("  " + (membership ? "✓" : "✗") + " household_membership: ", membership ? `hid=${membership.household_id} role=${membership.role} status=${membership.status}` : "MISSING");
    console.log("  " + (membership ? "✓" : "✗") + " activeHouseholdId:    ", membership?.household_id ?? "MISSING");
    console.log("  " + (children?.length ? "✓" : "✗") + " child:                ", children?.length ? `name=${children[0].name} id=${children[0].id}` : "MISSING");
    console.log("  " + (children?.length ? "✓" : "✗") + " activeChildId:        ", children?.length ? children[0].id : "MISSING");

    // ── Step 3: profile ───────────────────────────────────────────────────────
    // Profile row is now created by trigger (or upserted by /api/me above).
    // No redirect needed for missing profile — it was just created.

    // ── Step 4: household membership ─────────────────────────────────────────
    if (!membership) {
      console.log("[auth] ✗ household_membership: redirecting to /onboarding?resume=household");
      if (!pathname.startsWith("/onboarding")) {
        router.replace("/onboarding?resume=household");
      }
      setAuthReady(true);
      return;
    }

    // ── Step 5: membership must be active ────────────────────────────────────
    // 'invited' status means the membership row exists but the user hasn't
    // been activated yet (new schema). Treat the same as missing.
    if (membership.status === "invited") {
      console.log("[auth] ✗ household_membership: status=invited — redirecting to /onboarding?resume=household");
      if (!pathname.startsWith("/onboarding")) {
        router.replace("/onboarding?resume=household");
      }
      setAuthReady(true);
      return;
    }

    // ── Step 6: children ─────────────────────────────────────────────────────
    if (!children || children.length === 0) {
      console.log("[auth] ✗ child: none — redirecting to /onboarding?resume=child");
      if (!pathname.startsWith("/onboarding")) {
        router.replace(`/onboarding?resume=child&hid=${membership.household_id}`);
      }
      setAuthReady(true);
      return;
    }

    // ── All requirements met — populate store ─────────────────────────────────
    setCurrentUserRole(normaliseRole(membership.role));
    console.log("[auth] ✓ role set:", membership.role);

    const storedId = useAppStore.getState().activeChildId;
    const match    = children.find((c) => c.id === storedId) ?? children[0];
    setActiveChild({
      id:   String(match.id),
      name: String(match.name),
      age:  String(match.focus ?? ""),
    });
    console.log("[auth] ✓ activeChild set:", match.name, match.id);

    // Load member display names
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
