"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { weeklyMoments } from "@/lib/data/demo";
import type { JournalMoment } from "@/lib/data/demo";
import AuthorBadge from "@/components/ui/AuthorBadge";

const today = weeklyMoments[0];

function HeroPhoto({ moment }: { moment: JournalMoment }) {
  return (
    <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "3/4" }}>
      {moment.imageUrl && (
        <Image
          src={moment.imageUrl}
          alt={moment.content}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 px-7 pb-9">
        <p className="text-[22px] font-extrabold text-white leading-snug tracking-tight mb-3">
          {moment.content}
        </p>
        {moment.createdBy && (
          <AuthorBadge author={moment.createdBy} time={moment.time} light />
        )}
      </div>
    </div>
  );
}

function InsetPhoto({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-4 py-4">
      <div
        className="relative w-full rounded-[1.5rem] overflow-hidden bg-muted shadow-elevated"
        style={{ aspectRatio: "4/3" }}
      >
        {moment.imageUrl && (
          <Image
            src={moment.imageUrl}
            alt={moment.content}
            fill
            className="object-cover"
            sizes="(max-width: 416px) 100vw, 416px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-[17px] font-bold text-white leading-snug tracking-tight mb-2.5">
            {moment.content}
          </p>
          {moment.createdBy && (
            <AuthorBadge author={moment.createdBy} time={moment.time} light />
          )}
        </div>
      </div>
    </div>
  );
}

function MilestonePanel({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-7 py-14 text-center">
      <div className="text-[36px] text-amber-400 dark:text-amber-500 mb-5 leading-none">✦</div>
      <p className="text-[26px] font-extrabold text-foreground leading-snug tracking-tight mb-4 max-w-[280px] mx-auto">
        {moment.content}
      </p>
      {moment.createdBy ? (
        <AuthorBadge author={moment.createdBy} time={moment.time} className="justify-center" />
      ) : (
        <p className="text-[11px] font-bold text-muted-foreground/55 uppercase tracking-widest">
          {moment.time}
        </p>
      )}
    </div>
  );
}

function NoteCard({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-7 py-8">
      <p className="text-[56px] leading-[0.7] text-amber-300 dark:text-amber-700 font-serif mb-4">&ldquo;</p>
      <p className="text-[19px] font-medium text-foreground leading-[1.65] mb-5">
        {moment.content}
      </p>
      {moment.createdBy ? (
        <AuthorBadge author={moment.createdBy} time={moment.time} />
      ) : (
        <p className="text-[12px] text-muted-foreground font-semibold">{moment.time}</p>
      )}
    </div>
  );
}

export default function TodayJournal() {
  const firstPhotoId = today.moments.find((m) => m.type === "photo")?.id;

  return (
    <div className="pb-8">
      {today.moments.map((moment, i) => (
        <motion.div
          key={moment.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 + i * 0.09, duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
        >
          {moment.type === "photo" && moment.id === firstPhotoId && <HeroPhoto moment={moment} />}
          {moment.type === "photo" && moment.id !== firstPhotoId && <InsetPhoto moment={moment} />}
          {moment.type === "milestone" && <MilestonePanel moment={moment} />}
          {moment.type === "note" && <NoteCard moment={moment} />}
        </motion.div>
      ))}
    </div>
  );
}
