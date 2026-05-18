"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart } from "lucide-react";
import { favoriteMemories } from "@/lib/data/demo";
import AuthorBadge from "@/components/ui/AuthorBadge";

function stableN(id: string) {
  return id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
}

function idRotation(id: string, scale = 1): number {
  const rots = [-2.5, 1.4, -1.1, 2.7, -1.7, 1.3];
  return rots[stableN(id) % rots.length] * scale;
}

function TapeStrip({ id }: { id: string }) {
  const n = stableN(id);
  const rot = [-3, 2, -1.5, 3.5, -2.2, 1.8][(n + 1) % 6];
  const left = [40, 54, 36, 58, 45, 51][n % 6];
  return (
    <div
      className="absolute -top-3.5 z-10 w-12 h-5 rounded-sm"
      style={{
        left: `${left}%`,
        transform: `translateX(-50%) rotate(${rot}deg)`,
        background: "rgba(255, 216, 120, 0.65)",
        boxShadow: "inset 0 0 0 1px rgba(180,130,40,0.09)",
      }}
    />
  );
}

export default function FavoritesView() {
  const [featured, ...rest] = favoriteMemories;
  const photos    = rest.filter((m) => m.type === "photo");
  const milestones = rest.filter((m) => m.type === "milestone");

  return (
    <div className="pb-12 pt-2">

      {/* Featured — large polaroid, gentle rotation */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        className="px-7 pt-2 pb-2"
      >
        <div className="relative mt-5">
          <TapeStrip id={featured.id} />
          <motion.div
            whileTap={{ scale: 0.98 }}
            animate={{ y: [0, -2.5, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-[3px] pt-3 px-3 pb-11"
            style={{
              background: "#fff",
              rotate: idRotation(featured.id, 0.65),
              boxShadow: "0 10px 48px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.07)",
            }}
          >
            <div
              className="w-full rounded-[2px] overflow-hidden bg-muted relative"
              style={{ aspectRatio: "3/4" }}
            >
              {featured.imageUrl && (
                <Image
                  src={featured.imageUrl}
                  alt={featured.content}
                  fill priority
                  className="object-cover"
                  sizes="(max-width: 448px) 100vw, 448px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-white fill-white" strokeWidth={0} />
              </div>
            </div>
            <div className="mt-4 px-1.5 pb-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
                {featured.date} · Cherished
              </p>
              <p className="text-[14px] text-stone-800 font-semibold leading-snug">
                {featured.content}
              </p>
              {featured.createdBy && (
                <div className="mt-2.5 opacity-50">
                  <AuthorBadge author={featured.createdBy} showRole={false} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scrapbook polaroid board — staggered left/right */}
      {photos.length > 0 && (
        <div className="pt-6 pb-2">
          {photos.map((item, i) => {
            const rot = idRotation(item.id);
            const n = stableN(item.id);
            const isLeft = i % 2 === 0;
            const isPortrait = n % 3 !== 1;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
                className="py-3"
                style={{
                  paddingLeft:  isLeft ? "18px" : "52px",
                  paddingRight: isLeft ? "52px" : "18px",
                }}
              >
                <div className="relative mt-4">
                  <TapeStrip id={item.id} />
                  <motion.div
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.97 }}
                    className="rounded-[3px] pt-2.5 px-2.5 pb-8"
                    style={{
                      background: "#fff",
                      rotate: rot,
                      boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div
                      className="w-full rounded-[2px] overflow-hidden bg-muted relative"
                      style={{ aspectRatio: isPortrait ? "3/4" : "4/3" }}
                    >
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.content}
                          fill
                          className="object-cover"
                          sizes="(max-width: 380px) 80vw, 380px"
                        />
                      )}
                    </div>
                    <div className="mt-2.5 px-0.5">
                      <p className="text-[11px] text-stone-700 font-medium leading-snug">
                        {item.content}
                      </p>
                      <p className="text-[9px] text-stone-400 mt-1 font-medium">{item.date}</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Milestone pull-quotes — paper cards, slight rotation */}
      {milestones.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 + i * 0.09, duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
          className="px-5 py-3"
          style={{ transform: `rotate(${idRotation(item.id, 0.35)}deg)` }}
        >
          <div
            className="rounded-[2rem] px-8 pt-8 pb-9"
            style={{
              background: "var(--surface-card)",
              border: "1.5px solid var(--border-soft)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }}
          >
            <p className="text-[52px] leading-[0.7] text-amber-300 dark:text-amber-700 font-serif mb-4 select-none">
              &ldquo;
            </p>
            <p className="text-[23px] font-extrabold text-foreground leading-snug tracking-tight mb-5 -mt-1">
              {item.content}
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                {item.date}
              </p>
              {item.createdBy && <AuthorBadge author={item.createdBy} />}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
