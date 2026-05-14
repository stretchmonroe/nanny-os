"use client";

import { useState } from "react";
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
      </div>
    </div>
  );
}
