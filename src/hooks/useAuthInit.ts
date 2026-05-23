"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import type { UserRole, ActiveChild } from "@/store/useAppStore";

// Prevent Strict Mode double-invoke from firing two navigations.
let _navigating = false;

const PUBLIC = ["/onboarding"];

function isPublic(path: string) {
  return PUBLIC.some((p) => path.startsWith(p));
}

export function useAuthInit() {
  const pathname = usePathname();
  const {
    setAuthReady,
    setProfileFullName,
    setCurrentUserRole,
    setActiveChild,
  } = useAppStore();

  const check = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setAuthReady(true);
      if (!isPublic(pathname) && !_navigating) {
        _navigating = true;
        console.log("[auth] no session → /onboarding");
        window.location.href = "/onboarding";
      }
      return;
    }

    console.log("[auth] session ok →", session.user.id);

    // Fetch real data — non-blocking. Failures are safe; app uses demo fallbacks.
    try {
      const res = await fetch("/api/me", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const { profile, membership, children } = await res.json();

        if (profile?.full_name)  setProfileFullName(profile.full_name);
        if (membership?.role)    setCurrentUserRole(membership.role as UserRole);

        const child = children?.[0];
        if (child) {
          const childData: ActiveChild = {
            id:        String(child.id),
            name:      child.name ?? child.full_name ?? "",
            birthDate: child.birth_date ?? null,
          };
          setActiveChild(childData);
        }

        console.log("[auth] /api/me populated — profile:", profile?.full_name, "children:", children?.length);
      }
    } catch (err) {
      console.warn("[auth] /api/me failed (non-fatal):", err);
    }

    setAuthReady(true);

    if ((pathname === "/" || isPublic(pathname)) && !_navigating) {
      _navigating = true;
      console.log("[auth] authenticated → /home");
      window.location.href = "/home";
    }
  }, [pathname, setAuthReady, setProfileFullName, setCurrentUserRole, setActiveChild]);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("[auth] event:", event);
      if (event === "SIGNED_IN") {
        _navigating = false;
        check();
      }
    });
    return () => subscription.unsubscribe();
  }, [check]);
}
