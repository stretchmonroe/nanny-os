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
import PushPermission from "@/components/notifications/PushPermission";
import type { FocusArea } from "@/lib/data/demo";

export default function HomePage() {
  const [focus,     setFocus]     = useState<FocusArea>("language");
  const router = useRouter();

  const { authReady, activeChild } = useAppStore();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/onboarding");
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
      <ChildProfileHeader
        focus={focus}
        onFocusChange={setFocus}
        onSetupOpen={() => router.push("/setup")}
      />

      <div className="pt-2 pb-12">
        <PushPermission />

        {authReady && !activeChild && (
          <div className="mx-4 mb-5 rounded-2xl bg-[#EAF2EC] p-5">
            <p className="text-base font-bold text-[#261E18]">Create or join your home</p>
            <p className="mt-1 text-sm text-[#7A6D62]">Choose your role to connect to the right household.</p>
            <button
              type="button"
              onClick={() => router.push("/setup")}
              className="mt-4 w-full rounded-xl bg-[#6A9C80] px-4 py-3 text-sm font-bold text-white"
            >
              Continue setup
            </button>
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
