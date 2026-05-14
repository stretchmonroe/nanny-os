"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart } from "lucide-react";
import { favoriteMemories } from "@/lib/data/demo";

export default function FavoritesView() {
  const [featured, ...rest] = favoriteMemories;
  const photos = rest.filter((m) => m.type === "photo");
  const milestones = rest.filter((m) => m.type === "milestone");

  return (
    <div className="px-4 pb-8 space-y-4">
      {/* Featured hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="relative w-full h-80 rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-800 shadow-lg">
          {featured.imageUrl && (
            <Image
              src={featured.imageUrl}
              alt={featured.content}
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" strokeWidth={0} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/55 mb-1 block">
              {featured.date} · Featured Moment
            </span>
            <p className="text-[17px] font-bold text-white leading-snug">
              {featured.content}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Photo grid */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
        {photos.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 shadow-sm"
          >
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.content}
                fill
                className="object-cover"
                sizes="(max-width: 224px) 50vw, 224px"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <p className="text-[10px] font-medium text-white/90 line-clamp-2 leading-snug">
                {item.content}
              </p>
              <p className="text-[9px] text-white/55 mt-0.5">{item.date}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Milestone quote cards */}
      {milestones.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 + i * 0.07, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="rounded-3xl bg-gradient-to-br from-violet-50 to-purple-50/60 dark:from-violet-950/40 dark:to-stone-800 border border-violet-100/70 dark:border-violet-900/30 p-5 shadow-sm"
        >
          <div className="text-2xl mb-3">⭐</div>
          <p className="text-[15px] font-semibold text-zinc-800 dark:text-stone-100 leading-relaxed">
            {item.content}
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-3 font-medium">
            {item.date}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
