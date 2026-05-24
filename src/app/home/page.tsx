"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import ChildProfileHeader from "@/components/home/ChildProfileHeader";
import RecommendationCard from "@/components/home/RecommendationCard";
import ActivityPlan from "@/components/home/ActivityPlan";
import TimelineFeed from "@/components/home/TimelineFeed";
import QuickActions from "@/components/home/QuickActions";
import MomentsCarousel from "@/components/home/MomentsCarousel";
import InsightStrip from "@/components/home/InsightStrip";
import { ProfileSetupCard } from "@/components/home/ProfileSetupCard";
import type { FocusArea } from "@/lib/data/demo";

export default function HomePage() {
  const [focus,     setFocus]     = useState<FocusArea>("language");
  const [setupOpen, setSetupOpen] = useState(false);

  const { authReady, activeChild, currentUserRole } = useAppStore();
  const isNanny = currentUserRole === "nanny";

  useEffect(() => {
    if (authReady && !activeChild) setSetupOpen(true);
  }, [authReady, activeChild]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/onboarding";
  }

  if (isNanny) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
        <ChildProfileHeader
          focus={focus}
          onFocusChange={setFocus}
          showFocusSelector={false}
        />

        <div className="pt-2 pb-12 space-y-6">
          <QuickActions />
          <TimelineFeed childId={activeChild?.id ?? null} />

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

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
      <ChildProfileHeader
        focus={focus}
        onFocusChange={setFocus}
        onSetupOpen={() => setSetupOpen(true)}
      />

      <div className="pt-2 pb-12">
        {setupOpen && !activeChild && (
          <div className="mb-5">
            <ProfileSetupCard onDismiss={() => setSetupOpen(false)} />
          </div>
        )}

        <RecommendationCard />

        <div className="mt-6">
          <ActivityPlan focus={focus} />
        </div>

        <div className="mt-7">
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
