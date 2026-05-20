"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

function normaliseRole(role: string): "nanny" | "parent" {
  // 'caregiver' / 'grandparent' map to 'nanny' internally
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

    // ── Requirement 1: user ───────────────────────────────────────────────────
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("[auth] ✗ user: no session → /onboarding");
      if (!pathname.startsWith("/onboarding")) router.replace("/onboarding");
      setAuthReady(true);
      return;
    }
    console.log("[auth] ✓ user:", session.user.id);

    // ── Fetch /api/me — single source of truth ────────────────────────────────
    type Child = {
      id: string; name: string; full_name: string | null;
      focus: string | null; birth_date: string | null;
    };
    type MeResponse = {
      profile:    { id: string; full_name: string | null; email: string | null; default_household_id: string | null } | null;
      membership: { household_id: string; role: string; status: string } | null;
      household:  { id: string; name: string } | null;
      children:   Child[];
    };

    let me: MeResponse | null = null;
    let fetchOk = false;

    try {
      const res = await fetch("/api/me", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      console.log("[auth] /api/me HTTP status:", res.status);
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
      console.warn("[auth] /api/me unreachable — staying on page, not redirecting");
      setAuthReady(true);
      return;
    }

    const { profile, membership, household, children } = me;
    const firstChild  = children?.[0] ?? null;
    const childName   = firstChild?.name?.trim() || firstChild?.full_name?.trim() || null;

    // ── Full debug checklist ──────────────────────────────────────────────────
    console.log("[auth] checklist ─────────────────────────────────────────");
    console.log(`  ${session.user.id                           ? "✓" : "✗"} user:               ${session.user.id}`);
    console.log(`  ${profile                                   ? "✓" : "✗"} profile:            ${profile ? `full_name="${profile.full_name}" email="${profile.email}"` : "MISSING"}`);
    console.log(`  ${membership                                ? "✓" : "✗"} household_membership:${membership ? ` hid=${membership.household_id} role=${membership.role} status=${membership.status}` : " MISSING"}`);
    console.log(`  ${household                                 ? "✓" : "✗"} household:           ${household ? `name="${household.name}" id=${household.id}` : "MISSING"}`);
    console.log(`  ${membership                                ? "✓" : "✗"} activeHouseholdId:   ${membership?.household_id ?? "MISSING"}`);
    console.log(`  ${firstChild                                ? "✓" : "✗"} child:               ${firstChild ? `id=${firstChild.id} name="${firstChild.name}" full_name="${firstChild.full_name}" birth_date=${firstChild.birth_date}` : "MISSING"}`);
    console.log(`  ${childName                                 ? "✓" : "✗"} child name usable:   ${childName ?? "MISSING"}`);
    console.log(`  ${firstChild                                ? "✓" : "✗"} activeChildId:       ${firstChild?.id ?? "MISSING"}`);
    console.log("[auth] ───────────────────────────────────────────────────");

    // ── Requirement 3: household membership ───────────────────────────────────
    if (!membership) {
      console.log("[auth] ✗ household_membership: MISSING → /onboarding?resume=household");
      if (!pathname.startsWith("/onboarding")) {
        router.replace("/onboarding?resume=household");
      }
      setAuthReady(true);
      return;
    }

    // 'invited' only meaningful after migration_add_member_status.sql is run
    if (membership.status === "invited") {
      console.log("[auth] ✗ household_membership: status=invited → /onboarding?resume=household");
      if (!pathname.startsWith("/onboarding")) {
        router.replace("/onboarding?resume=household");
      }
      setAuthReady(true);
      return;
    }

    // ── Requirement 4: child ──────────────────────────────────────────────────
    if (!firstChild || !childName) {
      const url = `/onboarding?resume=child&hid=${membership.household_id}`;
      console.log(`[auth] ✗ child: ${!firstChild ? "no child row" : "child has no name"} → ${url}`);
      if (!pathname.startsWith("/onboarding")) {
        router.replace(url);
      }
      setAuthReady(true);
      return;
    }

    // ── All requirements met — populate store ─────────────────────────────────
    setCurrentUserRole(normaliseRole(membership.role));

    const storedId = useAppStore.getState().activeChildId;
    const match    = children.find((c) => c.id === storedId) ?? firstChild;
    const matchName = match.name?.trim() || match.full_name?.trim() || match.name;
    setActiveChild({
      id:   String(match.id),
      name: String(matchName),
      age:  String(match.focus ?? ""),
    });
    console.log("[auth] ✓ store populated — role:", membership.role, "child:", matchName, match.id);

    // Load member display names from care-circle
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
