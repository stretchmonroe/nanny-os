import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DoneActivity = {
  id:          string;
  title:       string;
  description: string;
  area:        string;
  childId:     string;
  date:        string;        // "YYYY-MM-DD" local date
  completedAt: string;        // ISO timestamp
};

type DailyActivitiesStore = {
  done:              DoneActivity[];
  markDone:          (a: DoneActivity) => void;
  getTodayForChild:  (childId: string) => DoneActivity[];
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const useDailyActivitiesStore = create<DailyActivitiesStore>()(
  persist(
    (set, get) => ({
      done: [],

      markDone: (a) =>
        set((s) => ({
          // deduplicate: same activity + child + date = no-op
          done: s.done.some(
            (d) => d.id === a.id && d.childId === a.childId && d.date === a.date
          )
            ? s.done
            : [...s.done, a],
        })),

      getTodayForChild: (childId) => {
        const today = todayKey();
        return get().done.filter((d) => d.childId === childId && d.date === today);
      },
    }),
    { name: "ankur-daily-activities" }
  )
);
