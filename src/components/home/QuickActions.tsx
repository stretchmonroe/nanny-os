"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { BookOpen, PenLine, Plus } from "lucide-react";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import QuickCaptureSheet from "@/components/shared/QuickCaptureSheet";
import ResearchSheet from "@/components/shared/ResearchSheet";
import type { VoiceResult } from "@/lib/voice/transcriptParser";
import { useAppStore } from "@/store/useAppStore";

export default function QuickActions() {
  const [noteOpen,     setNoteOpen]     = useState(false);
  const [groceryOpen,  setGroceryOpen]  = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const { activeChildId } = useAppStore();

  async function handleNoteSave(text: string) {
    await supabase.from("memory_events").insert({
      content:    text,
      type:       "note",
      child_id:   activeChildId,
      created_by: "parent",
    });
  }

  async function handleInstantAdd(name: string) {
    await supabase.from("grocery_items").insert({
      name,
      child_id:   activeChildId,
      created_by: "parent",
    });
  }

  async function handleVoiceSave(result: VoiceResult) {
    if (result.type === "grocery") {
      await Promise.all(
        result.items.map(name =>
          supabase.from("grocery_items").insert({ name, child_id: activeChildId, created_by: "nanny" })
        )
      );
    } else {
      await supabase.from("memory_events").insert({
        type:       "note",
        content:    result.content,
        category:   result.type === "schedule" ? result.category : "play",
        child_id:   activeChildId,
        created_by: "nanny",
        created_at: new Date().toISOString(),
      });
    }
  }

  return (
    <>
      <div className="mx-5 space-y-2.5">
        <div className="flex gap-2.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setNoteOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-card border-soft shadow-card rounded-2xl py-4 text-[13px] font-semibold text-foreground select-none"
          >
            <PenLine size={14} strokeWidth={2.2} style={{ color: "var(--accent-primary)" }} />
            Quick Note
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setGroceryOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-card border-soft shadow-card rounded-2xl py-4 text-[13px] font-semibold text-foreground select-none"
          >
            <Plus size={15} className="text-trust opacity-90" strokeWidth={2.5} />
            Add Item
          </motion.button>
        </div>

        <VoiceRecorder
          context="schedule"
          onSave={handleVoiceSave}
          variant="row"
        />

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setResearchOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-surface-card border-soft shadow-card rounded-2xl py-3.5 text-[13px] font-semibold text-foreground select-none"
        >
          <BookOpen size={13} className="text-muted-foreground/50" strokeWidth={2} />
          Research a topic
        </motion.button>
      </div>

      <QuickCaptureSheet
        mode="note"
        open={noteOpen}
        onSave={handleNoteSave}
        onClose={() => setNoteOpen(false)}
      />

      <QuickCaptureSheet
        mode="grocery"
        open={groceryOpen}
        onSave={text => handleInstantAdd(text)}
        onInstantAdd={handleInstantAdd}
        onClose={() => setGroceryOpen(false)}
      />

      <ResearchSheet
        open={researchOpen}
        onClose={() => setResearchOpen(false)}
      />
    </>
  );
}
