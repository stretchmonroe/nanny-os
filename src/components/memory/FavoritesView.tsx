"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart } from "lucide-react";
import { favoriteMemories } from "@/lib/data/demo";
import AuthorBadge from "@/components/ui/AuthorBadge";

export default function FavoritesView() {
  const [featured, ...rest] = favoriteMemories;
  const photos    = rest.filter((m) => m.type === "photo");
  const milestones = rest.filter((m) => m.type === "milestone");

  return (
    <div className="px-4 pb-8 space-y-4">

      {/* Featured hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="relative w-full rounded-[2rem] overflow-hidden bg-muted shadow-elevated"
        style={{ aspectRatio: "3/4" }}
      >
        {featured.imageUrl && (
          <Image
            src={featured.imageUrl}
            alt={featured.content}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Heart className="w-4 h-4 text-white fill-white" strokeWidth={0} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-7">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-2.5">
            {featured.date} · Featured Memory
          </p>
          <p className="text-[20px] font-extrabold text-white leading-snug tracking-tight mb-4">
            {featured.content}
          </p>
          {featured.createdBy && (
            <AuthorBadge author={featured.createdBy} light />
          )}
        </div>
      </motion.div>

      {/* Photo grid — alternates full-width and paired */}
      {photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="space-y-3"
        >
          {/* First photo full-width */}
          {photos[0] && (
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-muted shadow-elevated"
              style={{ aspectRatio: "4/3" }}
            >
              {photos[0].imageUrl && (
                <Image
                  src={photos[0].imageUrl}
                  alt={photos[0].content}
                  fill
                  className="object-cover"
                  sizes="(max-width: 448px) 100vw, 448px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[13px] font-semibold text-white leading-snug">{photos[0].content}</p>
                <p className="text-[10px] text-white/50 mt-1 font-medium">{photos[0].date}</p>
              </div>
            </div>
          )}

          {/* Remaining photos in 2-column grid */}
          {photos.length > 1 && (
            <div className="grid grid-cols-2 gap-3">
              {photos.slice(1, 5).map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-2xl overflow-hidden bg-muted shadow-card"
                  style={{ aspectRatio: "1/1" }}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[10px] font-semibold text-white/90 line-clamp-2 leading-snug">
                      {item.content}
                    </p>
                    <p className="text-[9px] text-white/45 mt-0.5 font-medium">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Milestone pull-quotes */}
      {milestones.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 + i * 0.08, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
          className="rounded-[2rem] bg-[#FBF8F2] dark:bg-surface-raised px-7 pt-7 pb-9 shadow-card border border-stone-100/80 dark:border-stone-800/50"
        >
          <p className="text-[56px] leading-[0.7] text-amber-300 dark:text-amber-700 font-serif mb-4">&ldquo;</p>
          <p className="text-[22px] font-extrabold text-foreground leading-snug tracking-tight mb-5 -mt-1">
            {item.content}
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {item.date}
            </p>
            {item.createdBy && <AuthorBadge author={item.createdBy} />}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
