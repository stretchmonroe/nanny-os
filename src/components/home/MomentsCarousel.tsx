"use client";

import { motion } from "framer-motion";
import { moments } from "@/lib/data/demo";
import Image from "next/image";
import Link from "next/link";

export default function MomentsCarousel() {
  return (
    <div>
      <div className="px-5 flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-stone-100">
            Today's Moments
          </h2>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            {moments.length} memories captured
          </p>
        </div>
        <Link
          href="/memory"
          className="text-xs text-violet-500 dark:text-violet-400 font-semibold"
        >
          See all →
        </Link>
      </div>

      <div className="flex scroll-hide overflow-x-auto snap-x snap-mandatory gap-3 pl-5 pb-2">
        {moments.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 + 0.1, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="w-[72%] max-w-[260px] shrink-0 snap-start last:mr-5"
          >
            {item.type === "photo" ? (
              <div className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-stone-100 dark:bg-stone-800 shadow-md">
                <Image
                  src={item.imageUrl!}
                  alt={item.content}
                  fill
                  className="object-cover"
                  sizes="260px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-semibold bg-black/30 text-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    📸 Photo
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                    {item.content}
                  </p>
                  <p className="text-white/60 text-[11px] mt-1.5 font-medium">
                    {item.time} · by {item.createdBy}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-amber-50 dark:bg-stone-800 border border-amber-100/80 dark:border-stone-700 shadow-md p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    📝 Note
                  </span>
                </div>
                <div>
                  <p className="text-zinc-800 dark:text-stone-100 text-[14px] font-medium leading-relaxed">
                    {item.content}
                  </p>
                  <p className="text-stone-400 dark:text-stone-500 text-[11px] mt-3 font-medium">
                    {item.time} · by {item.createdBy}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
