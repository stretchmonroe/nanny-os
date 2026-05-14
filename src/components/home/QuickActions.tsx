"use client";

import { supabase } from "@/lib/supabase/client";
import { PenLine, Plus } from "lucide-react";

export default function QuickActions() {
  async function addNote() {
    const note = prompt("What's happening right now?");
    if (!note) return;
    await supabase.from("memory_events").insert({
      content: note,
      type: "note",
      child_id: "default",
      created_by: "parent",
    });
  }

  async function addGrocery() {
    const item = prompt("Add grocery item");
    if (!item) return;
    await supabase.from("grocery_items").insert({
      name: item,
      child_id: "default",
      created_by: "parent",
    });
  }

  return (
    <div className="mx-4 flex gap-2.5">
      <button
        onClick={addNote}
        className="flex-1 flex items-center justify-center gap-2 bg-surface-card border-soft shadow-card rounded-2xl py-3.5 text-[13px] font-semibold text-foreground active:scale-[0.97] transition-all duration-150 select-none"
      >
        <PenLine size={14} className="text-amber-500" strokeWidth={2.2} />
        Quick Note
      </button>
      <button
        onClick={addGrocery}
        className="flex-1 flex items-center justify-center gap-2 bg-surface-card border-soft shadow-card rounded-2xl py-3.5 text-[13px] font-semibold text-foreground active:scale-[0.97] transition-all duration-150 select-none"
      >
        <Plus size={15} className="text-violet-500" strokeWidth={2.5} />
        Add Item
      </button>
    </div>
  );
}
