"use client";

import { useState } from "react";
import ChildProfileHeader from "@/components/home/ChildProfileHeader";
import SproutCard from "@/components/home/SproutCard";
import ActivityPlan from "@/components/home/ActivityPlan";
import TimelineFeed from "@/components/home/TimelineFeed";
import MomentsCarousel from "@/components/home/MomentsCarousel";
import ProfileSheet from "@/components/profile/ProfileSheet";
import AnkurWordmark from "@/components/brand/AnkurWordmark";
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

        {/* Brand footer */}
        <div className="flex flex-col items-center gap-1.5 pt-6 pb-2 opacity-30">
          <AnkurWordmark width={88} />
          <p className="text-[10px] text-muted-foreground/60 font-medium tracking-wide">
            rooted in care, growing together
          </p>
        </div>
      </div>

      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}
