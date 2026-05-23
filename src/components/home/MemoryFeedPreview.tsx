"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import { moments as demoMoments } from "@/lib/data/demo";

type Item = { id: string; type: string; content: string };

export default function MemoryFeedPreview() {
  const activeChild = useAppStore((s) => s.activeChild);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    async function load() {
      const childId = activeChild?.id ?? null;

      if (!childId) {
        setItems(demoMoments.slice(0, 3).map((m) => ({ id: m.id, type: m.type, content: m.content })));
        return;
      }

      const { data } = await supabase
        .from("memory_events")
        .select("id, type, content")
        .eq("child_id", childId)
        .neq("type", "handoff")
        .order("created_at", { ascending: false })
        .limit(3);

      setItems(data || []);
    }
    load();
  }, [activeChild?.id]);

  return (
    <div className="border border-soft p-4 rounded-xl bg-surface-card">
      <h3 className="font-semibold text-[13px] text-foreground mb-2">Recent Moments</h3>
      {items.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">No moments logged yet.</p>
      ) : (
        items.map((i) => (
          <div key={i.id} className="text-[12px] text-muted-foreground border-b border-soft py-1.5 last:border-0">
            {i.type === "photo" ? "📸" : i.type === "milestone" ? "🌟" : "📝"} {i.content}
          </div>
        ))
      )}
    </div>
  );
}
