"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const CHILD_ID = "default";

export default function MemoryFeedPreview() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("memory_events")
        .select("*")
        .eq("child_id", CHILD_ID)
        .order("created_at", { ascending: false })
        .limit(3);

      setItems(data || []);
    }

    load();
  }, []);

  return (
    <div className="border p-4 rounded-xl">
      <h3 className="font-semibold mb-2">Recent Moments</h3>

      {items.map((i) => (
        <div key={i.id} className="text-sm border-b py-1">
          {i.type === "photo" ? "📸 Photo" : "📝 Note"} - {i.content}
        </div>
      ))}
    </div>
  );
}
