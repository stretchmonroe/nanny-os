import { aiSuggestion } from "@/lib/data/demo";
import { Sparkles } from "lucide-react";

export default function AICard() {
  return (
    <div className="mx-4 rounded-3xl bg-gradient-to-br from-violet-50 via-white to-amber-50/60 dark:from-violet-950/60 dark:via-stone-900 dark:to-amber-950/40 border border-violet-100/80 dark:border-violet-900/40 p-5 shadow-sm">
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700 flex items-center justify-center shrink-0 shadow-md shadow-violet-200/50 dark:shadow-violet-900/50">
          <Sparkles size={16} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider mb-1">
            AI Suggestion · Right now
          </p>
          <p className="text-[15px] font-semibold text-zinc-900 dark:text-stone-100 leading-snug">
            {aiSuggestion.title}
          </p>
          <p className="text-[13px] text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
            {aiSuggestion.body}
          </p>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-stone-800 border border-violet-200 dark:border-violet-800/50 text-violet-700 dark:text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              🎯 {aiSuggestion.activity}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
              {aiSuggestion.duration}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
