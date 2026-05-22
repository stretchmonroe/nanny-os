"use client";

import { supabase } from "@/lib/supabase/client";
import { PenLine, Plus } from "lucide-react";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import type { VoiceResult } from "@/lib/voice/transcriptParser";

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

  async function handleVoiceSave(result: VoiceResult) {
    if (result.type === "grocery") {
      await Promise.all(
        result.items.map(name =>
          supabase.from("grocery_items").insert({ name, child_id: "default", created_by: "nanny" })
        )
      );
    } else {
      await supabase.from("memory_events").insert({
        type: "note",
        content: result.content,
        category: result.type === "schedule" ? result.category : "play",
        child_id: "default",
        created_by: "nanny",
        created_at: new Date().toISOString(),
      });
    }
  }

  return (
    <div className="mx-5 space-y-2.5">
      <div className="flex gap-2.5">
        <button
          onClick={addNote}
          className="flex-1 flex items-center justify-center gap-2 bg-surface-card border-soft shadow-card rounded-2xl py-4 text-[13px] font-semibold text-foreground active:scale-[0.97] transition-all duration-150 select-none"
        >
          <PenLine size={14} className="text-amber-500 opacity-90" strokeWidth={2.2} />
          Quick Note
        </button>
        <button
          onClick={addGrocery}
          className="flex-1 flex items-center justify-center gap-2 bg-surface-card border-soft shadow-card rounded-2xl py-4 text-[13px] font-semibold text-foreground active:scale-[0.97] transition-all duration-150 select-none"
        >
          <Plus size={15} className="text-violet-500 opacity-90" strokeWidth={2.5} />
          Add Item
        </button>
      </div>

      <VoiceRecorder
        context="schedule"
        onSave={handleVoiceSave}
        variant="row"
      />
    </div>
  );
}
