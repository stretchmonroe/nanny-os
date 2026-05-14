"use client";

import { useState } from "react";
import MemoryFeed from "@/components/memory/MemoryFeed";
import PhotoUploader from "@/components/memory/PhotoUploader";
import { cn } from "@/lib/utils";
import { moments } from "@/lib/data/demo";

type Filter = "all" | "photos" | "notes";

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Photos", value: "photos" },
  { label: "Notes", value: "notes" },
];

export default function MemoryPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const count = filter === "all"
    ? moments.length
    : moments.filter((m) => (filter === "photos" ? m.type === "photo" : m.type === "note")).length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[22px] font-bold text-zinc-900 dark:text-stone-100 tracking-tight">
              Moments
            </h1>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
              {count} {filter === "all" ? "memories" : filter} today
            </p>
          </div>
          <PhotoUploader />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {filters.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                filter === value
                  ? "bg-zinc-900 dark:bg-stone-100 text-white dark:text-zinc-900"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="pt-5">
        <MemoryFeed filter={filter} />
      </div>
    </div>
  );
}
