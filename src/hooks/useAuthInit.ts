"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

function normaliseRole(role: string): "nanny" | "parent" {
  return role === "parent" ? "parent" : "nanny";
}

// Module-level guard — prevents React Strict Mode double-invoke from
// triggering two window.location.href navigations before the page unloads.
let _navigatingToHome = false;

function logGuard(
  route: string,
  appReady: boolean,
  onboardingRequired: boolean,
  action: string,
) {
  console.log(`[route-guard] currentRoute="${route}"`);
  console.log(`[route-guard] appReady=${appReady}`);
  console.log(`[route-guard] onboardingRequired=${onboardingRequired}`);
  console.log(`[route-guard] action="${action}"`);
}

export function useAuthInit() {
  const router   = useRouter();
  const pathname = usePathname();
  const { setActiveChild, setMemberNames, setCurrentUserRole, setAuthReady, setProfileFullName, setChildBirthDate } = useAppStore();

  const init = useCallback(async () => {
    if (pathname.startsWith("/invite/")) {
      setAuthReady(true);
      return;
    }

    // ── Requirement 1: user ───────────────────────────────────────────────────
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("[auth] ✗ user: no session");
      const target = "/onboarding";
      const action = pathname.startsWith("/onboarding") ? "stay" : `redirect:${target}`;
      logGuard(pathname, false, true, action);
      if (!pathname.startsWith("/onboarding")) router.replace(target);
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
      logGuard(pathname, false, false, "stay (api-unreachable)");
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
    console.log(`  ${childName ? "✓" : "·"} child name (optional): ${childName ?? "not set"}`);
    console.log(`  ${firstChild                                ? "✓" : "✗"} activeChildId:       ${firstChild?.id ?? "MISSING"}`);
    console.log("[auth] ───────────────────────────────────────────────────");

    // ── Requirement 3: household membership ───────────────────────────────────
    if (!membership) {
      const target = "/onboarding?resume=household";
      const action = pathname.startsWith("/onboarding") ? "stay" : `redirect:${target}`;
      console.log("[auth] ✗ household_membership: MISSING");
      logGuard(pathname, false, true, action);
      if (!pathname.startsWith("/onboarding")) router.replace(target);
      setAuthReady(true);
      return;
    }

    if (membership.status === "invited") {
      const target = "/onboarding?resume=household";
      const action = pathname.startsWith("/onboarding") ? "stay" : `redirect:${target}`;
      console.log("[auth] ✗ household_membership: status=invited");
      logGuard(pathname, false, true, action);
      if (!pathname.startsWith("/onboarding")) router.replace(target);
      setAuthReady(true);
      return;
    }

    // ── Requirement 4: child row must exist (name/birth_date are optional) ──────
    if (!firstChild) {
      const target = `/onboarding?resume=child&hid=${membership.household_id}`;
      const action = pathname.startsWith("/onboarding") ? "stay" : `redirect:${target}`;
      console.log("[auth] ✗ child: no child row");
      logGuard(pathname, false, true, action);
      if (!pathname.startsWith("/onboarding")) router.replace(target);
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
    setProfileFullName(profile?.full_name ?? null);
    setChildBirthDate(firstChild?.birth_date ?? null);
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

    if (pathname === "/" || pathname.startsWith("/onboarding")) {
      logGuard(pathname, true, false, "redirect:/home");
      // router.replace is unreliable from async/onAuthStateChange context in
      // Next.js App Router — window.location.href is the guaranteed path.
      if (!_navigatingToHome) {
        _navigatingToHome = true;
        console.log("[auth] → navigating to /home via window.location");
        window.location.href = "/home";
      }
    } else {
      logGuard(pathname, true, false, "stay");
    }
  }, [pathname, router, setActiveChild, setMemberNames, setCurrentUserRole, setAuthReady, setProfileFullName, setChildBirthDate]);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("[auth] onAuthStateChange:", event, "pathname:", pathname);
      // SIGNED_IN: user just authenticated
      // TOKEN_REFRESHED: expired token was silently renewed — re-check so guarded
      //   routes don't stay stuck if getSession() returned null on first load
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        _navigatingToHome = false; // reset guard so a fresh check can redirect
        init();
      }
    });
    return () => subscription.unsubscribe();
  }, [pathname, init]);
}
