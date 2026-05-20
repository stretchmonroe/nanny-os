"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Heart } from "lucide-react";
import { fetchFavoriteMoments } from "@/lib/supabase/moments";
import type { FavoriteEvent } from "@/lib/supabase/moments";
import AuthorBadge from "@/components/ui/AuthorBadge";
import ReactionBar from "@/components/memory/ReactionBar";
import ReplyThread from "@/components/memory/ReplyThread";
import MonthlyStory from "@/components/memory/MonthlyStory";

// ── Helpers ───────────────────────────────────────────────────────────────────

function stableN(id: string) {
  return id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
}

function idRotation(id: string, scale = 1): number {
  const rots = [-2.5, 1.4, -1.1, 2.7, -1.7, 1.3];
  return rots[stableN(id) % rots.length] * scale;
}

const PHOTO_ASPECTS = ["3/4", "4/3", "1/1"] as const;
function photoAspect(id: string): string {
  return PHOTO_ASPECTS[stableN(id) % PHOTO_ASPECTS.length];
}

// ── TapeStrip ─────────────────────────────────────────────────────────────────

function TapeStrip({ id }: { id: string }) {
  const n    = stableN(id);
  const rot  = [-3, 2, -1.5, 3.5, -2.2, 1.8][(n + 1) % 6];
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

// ── FeaturedHero ──────────────────────────────────────────────────────────────

function FeaturedHero({ item }: { item: FavoriteEvent }) {
  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
      whileTap={{ scale: 0.99 }}
      className="relative mx-5 overflow-hidden rounded-2xl bg-muted"
      style={{ aspectRatio: "3/4", minHeight: 360 }}
    >
      {item.imageUrl && (
        <Image
          src={item.imageUrl}
          alt={item.content}
          fill priority
          className="object-cover"
          sizes="(max-width: 448px) 90vw, 400px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/25 to-transparent" />

      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
        <Heart className="w-3.5 h-3.5 text-white fill-white" strokeWidth={0} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-6 pb-7">
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2">
          {item.dateLabel} · Cherished
        </p>
        <p className="text-[20px] font-extrabold text-white leading-snug tracking-tight mb-3">
          {item.content}
        </p>
        {item.createdBy && (
          <AuthorBadge author={item.createdBy} light showRole={false} />
        )}
      </div>
    </motion.div>
    <div className="px-7 pt-5 pb-2 space-y-4">
      <ReactionBar initialReactions={item.reactions} momentId={item.id} />
      <ReplyThread initialReplies={item.replies} momentId={item.id} />
    </div>
    </>
  );
}

// ── PolaroidPhoto ─────────────────────────────────────────────────────────────

function PolaroidPhoto({ item, index }: { item: FavoriteEvent; index: number }) {
  const rot    = idRotation(item.id);
  const isLeft = index % 2 === 0;
  const aspect = photoAspect(item.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
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
          className="rounded-[3px] pt-2.5 px-2.5 pb-4"
          style={{
            background: "#fff",
            rotate: rot,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="w-full rounded-[2px] overflow-hidden bg-muted relative"
            style={{ aspectRatio: aspect }}
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
            {item.createdBy && (
              <div className="mt-1.5 opacity-50">
                <AuthorBadge author={item.createdBy} showRole={false} />
              </div>
            )}
            <p className="text-[9px] text-stone-400 mt-1 font-medium">{item.dateLabel}</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-stone-100/70">
            <ReactionBar initialReactions={item.reactions} momentId={item.id} />
          </div>
        </motion.div>
      </div>
      <div className="mt-3">
        <ReplyThread initialReplies={item.replies} momentId={item.id} />
      </div>
    </motion.div>
  );
}

// ── MilestoneQuote ────────────────────────────────────────────────────────────

function MilestoneQuote({ item, index }: { item: FavoriteEvent; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 + index * 0.09, duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      className="px-5 py-3"
      style={{ rotate: idRotation(item.id, 0.35) }}
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
        <div className="flex items-center justify-between gap-3 mb-5">
          <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            {item.dateLabel}
          </p>
          {item.createdBy && <AuthorBadge author={item.createdBy} />}
        </div>
        <div className="space-y-4">
          <ReactionBar initialReactions={item.reactions} momentId={item.id} />
          <ReplyThread initialReplies={item.replies} momentId={item.id} />
        </div>
      </div>
    </motion.div>
  );
}

// ── EmptyFavorites ────────────────────────────────────────────────────────────

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--surface-raised)", border: "1.5px solid var(--border-soft)" }}
      >
        <Heart className="w-6 h-6 text-muted-foreground/30" />
      </div>
      <p className="text-[15px] font-semibold text-foreground/55 mb-1.5">No cherished memories yet</p>
      <p className="text-[13px] text-muted-foreground/40 leading-snug max-w-[220px]">
        Heart a moment in the journal to save it here forever
      </p>
    </div>
  );
}

// ── FavoritesView ─────────────────────────────────────────────────────────────

export default function FavoritesView() {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFavoriteMoments().then((result) => {
      setFavorites(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="pb-12 pt-2 space-y-4 px-5">
        <div className="h-[360px] rounded-2xl bg-muted/40 animate-pulse" />
        {[0, 1].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse" style={{ opacity: 1 - i * 0.3 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-12 pt-2">
      <MonthlyStory />

      {favorites.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <>
          <FeaturedHero item={favorites[0]} />

          {favorites.length > 1 && (() => {
            const rest      = favorites.slice(1);
            const photos    = rest.filter((m) => m.type === "photo");
            const milestone = rest.filter((m) => m.type === "milestone");
            return (
              <>
                {photos.length > 0 && (
                  <div className="pt-6 pb-2">
                    {photos.map((item, i) => (
                      <PolaroidPhoto key={item.id} item={item} index={i} />
                    ))}
                  </div>
                )}
                {milestone.map((item, i) => (
                  <MilestoneQuote key={item.id} item={item} index={i} />
                ))}
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
