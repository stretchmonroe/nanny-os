"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import ChildProfileHeader from "@/components/home/ChildProfileHeader";
import ActivityPlan from "@/components/home/ActivityPlan";
import TimelineFeed from "@/components/home/TimelineFeed";
import QuickActions from "@/components/home/QuickActions";
import MomentsCarousel from "@/components/home/MomentsCarousel";
import InsightStrip from "@/components/home/InsightStrip";
import { ProfileSetupCard } from "@/components/home/ProfileSetupCard";
import PushPermission from "@/components/notifications/PushPermission";
import type { FocusArea } from "@/lib/data/demo";

export default function HomePage() {
  const [focus,     setFocus]     = useState<FocusArea>("language");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupDismissed, setSetupDismissed] = useState(false);
  const router = useRouter();

  const { authReady, activeChild } = useAppStore();
  const showSetup = !activeChild && (setupOpen || (authReady && !setupDismissed));

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
      <ChildProfileHeader
        focus={focus}
        onFocusChange={setFocus}
        onSetupOpen={() => setSetupOpen(true)}
      />

      <div className="pt-2 pb-12">
        <PushPermission />

        {showSetup && (
          <div className="mb-5">
            <ProfileSetupCard onDismiss={() => { setSetupOpen(false); setSetupDismissed(true); }} />
          </div>
        )}

        <div className="mt-2">
          <ActivityPlan
            focus={focus}
            childName={activeChild?.name}
            childBirthDate={activeChild?.birthDate}
            childId={activeChild?.id}
          />
        </div>

        <div className="mt-6">
          <QuickActions />
        </div>

        <div className="mt-8">
          <MomentsCarousel childId={activeChild?.id ?? null} />
        </div>

        <div className="mt-9">
          <TimelineFeed childId={activeChild?.id ?? null} />
        </div>

        <div className="mt-6">
          <InsightStrip childName={activeChild?.name} childBirthDate={activeChild?.birthDate} />
        </div>

        <div className="flex justify-center pb-4">
          <button
            onClick={signOut}
            style={{ fontSize: 13, color: "#B4A99E", background: "none", border: "none", cursor: "pointer", padding: "8px 16px" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
