import ChildProfileHeader from "@/components/home/ChildProfileHeader";
import RecommendationCard from "@/components/home/RecommendationCard";
import TimelineFeed from "@/components/home/TimelineFeed";
import QuickActions from "@/components/home/QuickActions";
import MomentsCarousel from "@/components/home/MomentsCarousel";
import InsightStrip from "@/components/home/InsightStrip";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
      <ChildProfileHeader />
      <div className="py-4 space-y-5">
        <RecommendationCard />
        <QuickActions />
        <MomentsCarousel />
        <TimelineFeed />
        <InsightStrip />
        <div className="h-2" />
      </div>
    </div>
  );
}
