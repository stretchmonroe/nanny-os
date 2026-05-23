"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import ChildProfileHeader from "@/components/home/ChildProfileHeader";
import RecommendationCard from "@/components/home/RecommendationCard";
import ActivityPlan from "@/components/home/ActivityPlan";
import TimelineFeed from "@/components/home/TimelineFeed";
import QuickActions from "@/components/home/QuickActions";
import MomentsCarousel from "@/components/home/MomentsCarousel";
import InsightStrip from "@/components/home/InsightStrip";
import type { FocusArea } from "@/lib/data/demo";

export default function HomePage() {
  const [focus, setFocus] = useState<FocusArea>("language");

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/onboarding";
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
      <ChildProfileHeader focus={focus} onFocusChange={setFocus} />

      {/* Intentional spacing rhythm — not uniform */}
      <div className="pt-2 pb-12">
        <RecommendationCard />

        <div className="mt-6">
          <ActivityPlan focus={focus} />
        </div>

        <div className="mt-7">
          <QuickActions />
        </div>

        <div className="mt-8">
          <MomentsCarousel />
        </div>

        <div className="mt-9">
          <TimelineFeed />
        </div>

        <div className="mt-6">
          <InsightStrip />
        </div>

        {/* Temporary sign-out — remove once profile/settings is wired up */}
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
