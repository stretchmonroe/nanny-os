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
          <h2 className="text-[15px] font-bold text-foreground tracking-tight">
            Today&rsquo;s Moments
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {moments.length} captured
          </p>
        </div>
        <Link
          href="/memory"
          className="text-[12px] text-violet-500 dark:text-violet-400 font-bold active:opacity-60 transition-opacity"
        >
          See all →
        </Link>
      </div>

      <div className="flex scroll-hide overflow-x-auto snap-x snap-mandatory gap-2.5 pl-5 pb-1">
        {moments.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 + 0.1, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="w-[70%] max-w-[248px] shrink-0 snap-start last:mr-5"
          >
            {item.type === "photo" ? (
              <div className="relative rounded-[1.3rem] overflow-hidden aspect-[3/4] bg-muted shadow-elevated">
                <Image
                  src={item.imageUrl!}
                  alt={item.content}
                  fill
                  className="object-cover"
                  sizes="248px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-bold bg-black/25 text-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    📸
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-[13px] font-semibold leading-snug line-clamp-2">
                    {item.content}
                  </p>
                  <p className="text-white/55 text-[11px] mt-1.5 font-medium">
                    {item.time}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-[1.3rem] overflow-hidden aspect-[3/4] bg-amber-50 dark:bg-surface-raised border-soft shadow-card p-5 flex flex-col justify-between">
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full self-start">
                  📝 Note
                </span>
                <div>
                  <p className="text-foreground text-[14px] font-medium leading-relaxed">
                    {item.content}
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-3 font-medium">
                    {item.time}
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
