"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import AuthorBadge from "@/components/ui/AuthorBadge";
import { useAppStore } from "@/store/useAppStore";
import type { JournalMoment, JournalMomentType, ActivityCategory } from "@/lib/data/demo";

function normalizeMoment(raw: Record<string, unknown>): JournalMoment {
  const ts = raw.created_at as string | undefined;
  return {
    id:         String(raw.id),
    type:       (["photo","note","milestone"].includes(raw.type as string) ? raw.type : "note") as JournalMomentType,
    content:    String(raw.content ?? ""),
    time:       ts ? new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
    createdAt:  ts,
    imageUrl:   raw.image_url as string | undefined,
    category:   (raw.category ?? "play") as ActivityCategory,
    createdBy:  raw.created_by === "parent" ? "parent" : "nanny",
    isFavorite: true,
  };
}

async function unfavorite(id: string) {
  await supabase.from("memory_events").update({ is_favorite: false }).eq("id", id);
}

export default function FavoritesView({ childId }: { childId?: string | null }) {
  const [moments, setMoments] = useState<JournalMoment[]>([]);
  const [status,  setStatus]  = useState<"idle" | "loading" | "done">("idle");
  const { profileFullName, currentUserRole } = useAppStore();

  useEffect(() => {
    if (!childId) { setStatus("idle"); return; }
    setStatus("loading");
    supabase
      .from("memory_events")
      .select("*")
      .eq("child_id", childId)
      .eq("is_favorite", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMoments((data ?? []).map(normalizeMoment));
        setStatus("done");
      });
  }, [childId]);

  function removeFavorite(id: string) {
    unfavorite(id);
    setMoments((prev) => prev.filter((m) => m.id !== id));
  }

  // Demo mode
  if (!childId) {
    return (
      <div className="flex flex-col items-center gap-2 text-center pt-14 pb-8 px-6">
        <span className="text-4xl">⭐️</span>
        <p className="text-[15px] font-semibold text-foreground mt-2">No favourites yet</p>
        <p className="text-[13px] text-muted-foreground max-w-[230px] leading-relaxed">
          Tap the ❤️ on any photo to save it here.
        </p>
      </div>
    );
  }

  if (status !== "done") return null;

  if (moments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 text-center pt-14 pb-8 px-6">
        <span className="text-4xl">🤍</span>
        <p className="text-[15px] font-semibold text-foreground mt-2">No favourites yet</p>
        <p className="text-[13px] text-muted-foreground max-w-[230px] leading-relaxed">
          Tap the ❤️ on any photo or note to save it here.
        </p>
      </div>
    );
  }

  const photos     = moments.filter((m) => m.type === "photo");
  const nonPhotos  = moments.filter((m) => m.type !== "photo");
  const [hero, ...restPhotos] = photos;

  return (
    <div className="pb-8 space-y-4 pt-2">

      {/* Hero photo */}
      {hero && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="px-4"
        >
          <div className="relative w-full rounded-[2rem] overflow-hidden bg-muted shadow-deep" style={{ aspectRatio: "3/4" }}>
            {hero.imageUrl && (
              <Image src={hero.imageUrl} alt={hero.content} fill priority className="object-cover" sizes="(max-width: 448px) 100vw, 448px" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <button
              onClick={() => removeFavorite(hero.id)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/15 active:scale-90 transition-transform"
            >
              <Heart className="w-4 h-4 text-white fill-white" strokeWidth={0} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-[20px] font-extrabold text-white leading-snug tracking-tight mb-3">{hero.content}</p>
              {hero.createdBy && (
                <AuthorBadge
                  author={hero.createdBy}
                  name={hero.createdBy === currentUserRole ? (profileFullName ?? undefined) : undefined}
                  light
                />
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Photo grid */}
      {restPhotos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="px-4 grid grid-cols-2 gap-2"
        >
          {restPhotos.map((m) => (
            <div key={m.id} className="relative rounded-2xl overflow-hidden bg-muted shadow-card" style={{ aspectRatio: "1/1" }}>
              {m.imageUrl && (
                <Image src={m.imageUrl} alt={m.content} fill className="object-cover" sizes="(max-width: 224px) 50vw, 224px" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={() => removeFavorite(m.id)}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
              >
                <Heart className="w-3 h-3 text-white fill-white" strokeWidth={0} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[10px] font-semibold text-white/90 line-clamp-2 leading-snug">{m.content}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Notes + milestones */}
      {nonPhotos.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="mx-4 rounded-[2rem] bg-[#FBF8F2] dark:bg-surface-raised px-8 pt-8 pb-8 shadow-card border border-stone-100/80 dark:border-stone-800/50 relative"
        >
          <button
            onClick={() => removeFavorite(m.id)}
            className="absolute top-4 right-4 text-[18px] active:scale-90 transition-transform"
          >
            ❤️
          </button>
          <p className="text-[52px] leading-[0.7] text-amber-300 dark:text-amber-700 font-serif mb-3 select-none">&ldquo;</p>
          <p className="text-[20px] font-extrabold text-foreground leading-snug tracking-tight mb-4">{m.content}</p>
          {m.createdBy && (
            <AuthorBadge
              author={m.createdBy}
              name={m.createdBy === currentUserRole ? (profileFullName ?? undefined) : undefined}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
