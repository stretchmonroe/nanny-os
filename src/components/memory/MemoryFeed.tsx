"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { moments as demoMoments } from "@/lib/data/demo";
import Image from "next/image";

type Moment = {
  id: string;
  type: "photo" | "note";
  content: string;
  time: string;
  imageUrl?: string;
  createdBy: string;
  created_at?: string;
  created_by?: string;
  image_url?: string;
};

function normalize(raw: any): Moment {
  return {
    id: raw.id,
    type: raw.type,
    content: raw.content,
    time: raw.created_at
      ? new Date(raw.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : raw.time ?? "",
    imageUrl: raw.image_url ?? raw.imageUrl,
    createdBy: raw.created_by ?? raw.createdBy ?? "nanny",
  };
}

export default function MemoryFeed({ filter = "all" }: { filter?: "all" | "photos" | "notes" }) {
  const [items, setItems] = useState<Moment[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("memory_events")
        .select("*")
        .eq("child_id", "default")
        .order("created_at", { ascending: false });

      const raw = data && data.length > 0 ? data : demoMoments;
      setItems(raw.map(normalize));
    }
    load();
  }, []);

  const filtered = items.filter((i) => {
    if (filter === "photos") return i.type === "photo";
    if (filter === "notes") return i.type === "note";
    return true;
  });

  return (
    <div className="space-y-4 px-4 pb-6">
      {filtered.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {item.type === "photo" ? (
            <div>
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-800 shadow-md">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.content}
                    fill
                    className="object-cover"
                    sizes="(max-width: 448px) 100vw, 448px"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              <div className="mt-2.5 px-1">
                <p className="text-[14px] font-medium text-zinc-800 dark:text-stone-100 leading-snug">
                  {item.content}
                </p>
                <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-1 font-medium">
                  {item.time} · {item.createdBy}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/80 dark:bg-stone-800 border border-amber-100/60 dark:border-stone-700 rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                  <span className="text-sm">📝</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-zinc-800 dark:text-stone-100 leading-relaxed">
                    {item.content}
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-2 font-medium">
                    {item.time} · by {item.createdBy}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
