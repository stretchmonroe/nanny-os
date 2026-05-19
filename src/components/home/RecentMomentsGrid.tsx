"use client";

import { motion } from "framer-motion";
import { moments } from "@/lib/data/demo";
import Image from "next/image";
import Link from "next/link";

export default function RecentMomentsGrid() {
  return (
    <div className="mx-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-900">Recent Moments</h2>
        <Link href="/memory" className="text-xs text-trust font-medium">
          See all →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {moments.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 + 0.2, duration: 0.35 }}
          >
            {item.type === "photo" ? (
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-100 shadow-sm">
                <Image
                  src={item.imageUrl!}
                  alt={item.content}
                  fill
                  className="object-cover"
                  sizes="(max-width: 448px) 45vw, 200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-[10px] text-white/90 leading-tight line-clamp-2">
                    {item.content}
                  </p>
                  <p className="text-[9px] text-white/60 mt-0.5">{item.time}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-stone-100 shadow-sm p-3 aspect-[4/3] flex flex-col justify-between">
                <p className="text-xs text-zinc-700 leading-relaxed line-clamp-4">
                  {item.content}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] text-zinc-400">{item.time}</span>
                  <span className="text-[9px] text-zinc-400 capitalize">{item.createdBy}</span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
