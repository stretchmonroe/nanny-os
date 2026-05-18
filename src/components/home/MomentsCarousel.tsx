"use client";

import { motion } from "framer-motion";
import { moments } from "@/lib/data/demo";
import Image from "next/image";
import Link from "next/link";

export default function MomentsCarousel() {
  return (
    <div>
      <div className="px-5 flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-bold text-foreground tracking-tight">
          From today
        </h2>
        <Link
          href="/memory"
          className="text-[12px] text-muted-foreground/45 font-semibold active:opacity-60 transition-opacity"
        >
          Journal →
        </Link>
      </div>

      <div className="flex scroll-hide overflow-x-auto snap-x snap-mandatory gap-3 pl-5 pb-1">
        {moments.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -5, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            transition={{ delay: i * 0.07 + 0.1, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
            className="w-[78%] max-w-[296px] shrink-0 snap-start last:mr-5 cursor-pointer"
          >
            {item.type === "photo" ? (
              <div className="relative rounded-[1.4rem] overflow-hidden aspect-[3/4] bg-muted shadow-elevated">
                <Image
                  src={item.imageUrl!}
                  alt={item.content}
                  fill
                  className="object-cover"
                  sizes="296px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white text-[14px] font-bold leading-tight line-clamp-2 mb-1.5">
                    {item.content}
                  </p>
                  <p className="text-white/50 text-[11px] font-medium">
                    {item.time}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-[1.4rem] overflow-hidden aspect-[3/4] bg-gradient-to-b from-amber-50 to-orange-50/50 dark:from-stone-800 dark:to-stone-900 border-soft shadow-card p-5 flex flex-col justify-between">
                <p className="text-[40px] leading-none font-serif text-amber-300/70 dark:text-amber-700/60 select-none">
                  &ldquo;
                </p>
                <div>
                  <p className="text-foreground text-[15px] font-medium leading-relaxed">
                    {item.content}
                  </p>
                  <p className="text-muted-foreground/60 text-[11px] mt-3 font-medium">
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
