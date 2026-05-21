"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import ChildProfileHeader from "@/components/home/ChildProfileHeader";
import SproutNotice from "@/components/home/SproutNotice";
import ActivityPlan from "@/components/home/ActivityPlan";
import TimelineFeed from "@/components/home/TimelineFeed";
import MomentsCarousel from "@/components/home/MomentsCarousel";
import ProfileSheet from "@/components/profile/ProfileSheet";
import AnkurWordmark from "@/components/brand/AnkurWordmark";
import { ProfileSetupCard } from "@/components/home/ProfileSetupCard";
import type { FocusArea } from "@/lib/data/demo";

export default function HomePage() {
  const [focus,       setFocus]       = useState<FocusArea>("language");
  const [profileOpen, setProfileOpen] = useState(false);

  const { authReady, activeChild } = useAppStore();
  useEffect(() => {
    console.log("[home] mounted — route=/home");
    console.log("[home] authReady:", authReady);
    console.log("[home] activeChildId:", activeChild.id, "activeChild.name:", activeChild.name);
    console.log("[home] onboardingRequired: false (reached /home)");
    console.log("[home] → no redirect, staying on /home");
  // Run once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
      <ChildProfileHeader
        focus={focus}
        onFocusChange={setFocus}
        onProfileOpen={() => setProfileOpen(true)}
      />

      {/* Intentional spacing rhythm — not uniform */}
      <div className="pt-3 pb-12">
        <SproutNotice />

        <div className="mt-4">
          <ProfileSetupCard />
        </div>

        <div className="mt-5">
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
