"use client";

import { useState } from "react";
import ChildProfileHeader from "@/components/home/ChildProfileHeader";
import SproutCard from "@/components/home/SproutCard";
import ActivityPlan from "@/components/home/ActivityPlan";
import TimelineFeed from "@/components/home/TimelineFeed";
import MomentsCarousel from "@/components/home/MomentsCarousel";
import ProfileSheet from "@/components/profile/ProfileSheet";
import type { FocusArea } from "@/lib/data/demo";

export default function HomePage() {
  const [focus,       setFocus]       = useState<FocusArea>("language");
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
      <ChildProfileHeader
        focus={focus}
        onFocusChange={setFocus}
        onProfileOpen={() => setProfileOpen(true)}
      />

      {/* Intentional spacing rhythm — not uniform */}
      <div className="pt-2 pb-12">
        <SproutCard />

        <div className="mt-6">
          <ActivityPlan focus={focus} />
        </div>

        <div className="mt-8">
          <MomentsCarousel />
        </div>

        <div className="mt-9">
          <TimelineFeed />
        </div>
      </div>

      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}
