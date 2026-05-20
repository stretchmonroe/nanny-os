"use client";

import { usePathname } from "next/navigation";
import { useAuthInit } from "@/hooks/useAuthInit";
import { useAppStore } from "@/store/useAppStore";

const UNGUARDED_PREFIXES = ["/onboarding", "/invite"];

export default function AuthProvider() {
  useAuthInit();
  const pathname  = usePathname();
  const authReady = useAppStore((s) => s.authReady);

  const isGuarded = !UNGUARDED_PREFIXES.some((p) => pathname?.startsWith(p));

  if (isGuarded && !authReady) {
    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#F4EFE8",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <div style={{
          width: 28, height: 28,
          border: "3px solid rgba(42,105,101,0.18)",
          borderTopColor: "#2A6965",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
      </div>
    );
  }

  return null;
}
