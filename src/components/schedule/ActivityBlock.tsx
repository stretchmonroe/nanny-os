"use client";

import { useState } from "react";
import { Check, SkipForward, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import GuidanceTag from "@/components/ui/GuidanceTag";
import { isValidGuidanceSource } from "@/lib/ai/guidance";
import type { PlannedActivity, MontessoriArea } from "@/lib/data/demo";

const areaConfig: Record<MontessoriArea, {
  emoji: string; label: string; goal: string; bg: string; border: string;
}> = {
  "language":       { emoji: "🗣️", label: "Language",       goal: "Vocabulary and intentional communication",        bg: "bg-lavender-light/60 dark:bg-lavender/8", border: "border border-lavender-light dark:border-lavender/15" },
  "sensory":        { emoji: "🫧", label: "Sensory",         goal: "Sensory integration and cause-effect thinking",   bg: "bg-amber-50/60 dark:bg-amber-950/15",   border: "border border-amber-100/80 dark:border-amber-900/20"  },
  "movement":       { emoji: "🏃", label: "Movement",        goal: "Gross motor coordination and body awareness",     bg: "bg-sky-50/60 dark:bg-sky-950/15",       border: "border border-sky-100/80 dark:border-sky-900/20"      },
  "practical-life": { emoji: "🏠", label: "Practical Life",  goal: "Independence, concentration, and fine motor",     bg: "bg-orange-50/60 dark:bg-orange-950/15", border: "border border-orange-100/80 dark:border-orange-900/20" },
  "creativity":     { emoji: "🎨", label: "Creativity",      goal: "Imagination, self-expression, open-ended play",   bg: "bg-rose-50/60 dark:bg-rose-950/15",     border: "border border-rose-100/80 dark:border-rose-900/20"    },
};

type LocalStatus = "pending" | "done" | "skipped" | "replacing";

interface ReplaceData { what: string; startTime: string; endTime: string; note: string; }

export default function ActivityBlock({ activity }: { activity: PlannedActivity }) {
  const [status, setStatus] = useState<LocalStatus>(
    activity.status === "done" ? "done" : activity.status === "skipped" ? "skipped" : "pending"
  );
  const [rep, setRep] = useState<ReplaceData>({ what: "", startTime: "", endTime: "", note: "" });
  const [repSaved, setRepSaved] = useState(false);

  const cfg = areaConfig[activity.area] ?? areaConfig["language"];
  const resolved = status === "done" || status === "skipped" || repSaved;

  function saveReplacement() {
    if (!rep.what.trim()) return;
    setRepSaved(true);
    setStatus("done");
  }

  // Resolved — compact muted state
  if (resolved) {
    return (
      <div className={cn("rounded-2xl px-4 py-3 flex items-center gap-3 opacity-50", cfg.bg, cfg.border)}>
        <span className="text-[16px]">{cfg.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground line-through truncate">{activity.title}</p>
          {repSaved && rep.what && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Instead: {rep.what}</p>
          )}
        </div>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
          repSaved                     && "text-amber-700 dark:text-amber-400",
          status === "done" && !repSaved && "text-sage",
          status === "skipped"         && "text-muted-foreground",
        )}>
          {repSaved ? "Replaced" : status === "done" ? "Done" : "Skipped"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl overflow-hidden", cfg.bg, cfg.border)}>
      {/* Label strip */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-0.5">
        <span className="text-[10px] font-bold text-muted-foreground/45 uppercase tracking-[0.12em]">
          Suggested activity
        </span>
        <div className="flex-1 h-px bg-muted-foreground/10" />
      </div>

      <div className="px-4 pt-2 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-[24px] leading-none mt-0.5 shrink-0">{cfg.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground/45 uppercase tracking-widest">{cfg.label}</p>
            <p className="text-[16px] font-bold text-foreground leading-snug tracking-tight mt-0.5">{activity.title}</p>
            <p className="text-[11px] text-muted-foreground/65 mt-0.5 font-medium">{cfg.goal}</p>
          </div>
          <p className="text-[12px] font-semibold text-muted-foreground shrink-0 mt-1">{activity.duration}</p>
        </div>

        {/* Description */}
        <p className="text-[13px] text-foreground/65 leading-relaxed">{activity.description}</p>

        {/* Materials */}
        {activity.materials.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] font-semibold text-muted-foreground/45 mr-0.5">Needs:</span>
            {activity.materials.map((m) => (
              <span key={m} className="text-[10px] font-medium text-muted-foreground bg-white/60 dark:bg-black/15 px-2 py-0.5 rounded-full border border-white/40 dark:border-white/8">
                {m}
              </span>
            ))}
          </div>
        )}

        {/* Why it matters */}
        {activity.guidanceSource && isValidGuidanceSource(activity.guidanceSource) && (
          <GuidanceTag source={activity.guidanceSource} size="xs" />
        )}

        {/* Replace form */}
        {status === "replacing" && (
          <div className="bg-white/50 dark:bg-black/10 rounded-xl p-3 space-y-2.5 border border-white/40 dark:border-white/5">
            <p className="text-[12px] font-semibold text-foreground">What did you do instead?</p>
            <textarea
              value={rep.what}
              onChange={(e) => setRep((r) => ({ ...r, what: e.target.value }))}
              placeholder="e.g. Dry bean pouring — he loved it"
              rows={2}
              className="w-full bg-white/80 dark:bg-black/20 rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/35 outline-none resize-none"
            />
            <div className="flex gap-2">
              <label className="flex-1">
                <span className="block text-[10px] font-semibold text-muted-foreground mb-1">Started</span>
                <input
                  type="time"
                  value={rep.startTime}
                  onChange={(e) => setRep((r) => ({ ...r, startTime: e.target.value }))}
                  className="w-full bg-white/80 dark:bg-black/20 rounded-lg px-3 py-2 text-[13px] text-foreground outline-none"
                />
              </label>
              <label className="flex-1">
                <span className="block text-[10px] font-semibold text-muted-foreground mb-1">Ended</span>
                <input
                  type="time"
                  value={rep.endTime}
                  onChange={(e) => setRep((r) => ({ ...r, endTime: e.target.value }))}
                  className="w-full bg-white/80 dark:bg-black/20 rounded-lg px-3 py-2 text-[13px] text-foreground outline-none"
                />
              </label>
            </div>
            <textarea
              value={rep.note}
              onChange={(e) => setRep((r) => ({ ...r, note: e.target.value }))}
              placeholder="Note (optional)"
              rows={1}
              className="w-full bg-white/80 dark:bg-black/20 rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/35 outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={saveReplacement}
                disabled={!rep.what.trim()}
                className="flex-1 bg-foreground text-background text-[12px] font-bold py-2.5 rounded-xl disabled:opacity-40 transition-opacity"
              >
                Save
              </button>
              <button
                onClick={() => setStatus("pending")}
                className="px-4 text-[12px] font-semibold text-muted-foreground bg-white/60 dark:bg-black/20 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {status !== "replacing" && (
          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
            <button
              onClick={() => setStatus("done")}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-sage bg-white/70 dark:bg-black/20 border border-white/50 dark:border-white/8 px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
            >
              <Check size={11} strokeWidth={2.5} />
              Done
            </button>
            <button
              onClick={() => setStatus("skipped")}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground bg-white/50 dark:bg-black/15 border border-white/30 dark:border-white/5 px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
            >
              <SkipForward size={11} />
              Skip
            </button>
            <button
              onClick={() => setStatus("replacing")}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground bg-white/50 dark:bg-black/15 border border-white/30 dark:border-white/5 px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
            >
              <ArrowLeftRight size={11} />
              Did something else
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
