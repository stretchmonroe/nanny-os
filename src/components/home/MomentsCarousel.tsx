"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { moments } from "@/lib/data/demo";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Moment = {
  id: string;
  type: "photo" | "note";
  content: string;
  imageUrl?: string;
  time: string;
};

function normalize(raw: Record<string, unknown>): Moment {
  const ts = raw.created_at as string | undefined;
  return {
    id:       String(raw.id),
    type:     raw.type === "photo" ? "photo" : "note",
    content:  String(raw.content ?? ""),
    imageUrl: raw.image_url as string | undefined,
    time:     ts ? new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
  };
}

function MomentCard({ item, i }: { item: Moment; i: number }) {
  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.07 + 0.1, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="w-[78%] max-w-[296px] shrink-0 snap-start last:mr-5"
    >
      {item.type === "photo" ? (
        <div className="relative rounded-[1.4rem] overflow-hidden aspect-[3/4] bg-muted shadow-elevated">
          {item.imageUrl && (
            <Image src={item.imageUrl} alt={item.content} fill className="object-cover" sizes="296px" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-white text-[14px] font-bold leading-tight line-clamp-2 mb-1.5">{item.content}</p>
            <p className="text-white/50 text-[11px] font-medium">{item.time}</p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-[1.4rem] overflow-hidden aspect-[3/4] bg-gradient-to-b from-amber-50 to-orange-50/50 dark:from-stone-800 dark:to-stone-900 border-soft shadow-card p-5 flex flex-col justify-between">
          <p className="text-[40px] leading-none font-serif text-amber-300/70 dark:text-amber-700/60 select-none">&ldquo;</p>
          <div>
            <p className="text-foreground text-[15px] font-medium leading-relaxed">{item.content}</p>
            <p className="text-muted-foreground/60 text-[11px] mt-3 font-medium">{item.time}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function MomentsCarousel({ childId }: { childId?: string | null }) {
  const [realMoments, setRealMoments] = useState<Moment[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!childId) { setLoaded(true); return; }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    supabase
      .from("memory_events")
      .select("id, type, content, image_url, created_at")
      .eq("child_id", childId)
      .in("type", ["photo", "note", "milestone"])
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRealMoments((data ?? []).map(normalize));
        setLoaded(true);
      });
  }, [childId]);

  const items   = childId ? realMoments : moments.map(normalize);
  const isReal  = !!childId && loaded;
  const count   = items.length;

  if (isReal && count === 0) return null;

  return (
    <div>
      <div className="px-5 flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-bold text-foreground tracking-tight">Today&rsquo;s Moments</h2>
          <p className="text-[12px] text-muted-foreground/60 mt-0.5">
            {count} {count === 1 ? "moment" : "moments"} today
          </p>
        </div>
        <Link href="/memory" className="text-[12px] text-trust font-bold active:opacity-60 transition-opacity">
          See all →
        </Link>
      </div>

      <div className="flex scroll-hide overflow-x-auto snap-x snap-mandatory gap-3 pl-5 pb-1">
        {items.map((item, i) => <MomentCard key={item.id} item={item} i={i} />)}
      </div>
    </div>
  );
}
