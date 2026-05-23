"use client";

import { useAuthInit } from "@/hooks/useAuthInit";
import { useAppStore } from "@/store/useAppStore";
import { usePathname } from "next/navigation";
import NameGate from "@/components/onboarding/NameGate";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthInit();

  const { authReady, profileFullName } = useAppStore();
  const pathname = usePathname();
  const isPublic = pathname?.startsWith("/onboarding");

  const showNameGate = authReady && !profileFullName && !isPublic;

  return (
    <>
      {children}
      <NameGate open={showNameGate} />
    </>
  );
}
