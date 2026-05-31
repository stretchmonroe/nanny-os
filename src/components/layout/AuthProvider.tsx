"use client";

import { useEffect } from "react";
import { useAuthInit } from "@/hooks/useAuthInit";
import { useAppStore } from "@/store/useAppStore";
import { usePathname } from "next/navigation";
import NameGate from "@/components/onboarding/NameGate";
import { supabase } from "@/lib/supabase/client";
import { registerPush } from "@/lib/push/client";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthInit();

  const { authReady, profileFullName } = useAppStore();
  const pathname = usePathname();
  const isPublic = pathname?.startsWith("/onboarding");

  const showNameGate = authReady && !profileFullName && !isPublic;

  // Auto-renew push subscription on load when permission is already granted
  useEffect(() => {
    if (!authReady || isPublic) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) registerPush(session.access_token);
    });
  }, [authReady, isPublic]);

  return (
    <>
      {children}
      <NameGate open={showNameGate} />
    </>
  );
}
