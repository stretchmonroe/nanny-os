"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, PenLine, ShoppingBasket, Mic, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import QuickCaptureSheet from "@/components/shared/QuickCaptureSheet";
import ResearchSheet from "@/components/shared/ResearchSheet";
import VoiceInputModal from "@/components/voice/VoiceInputModal";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { parseVoice } from "@/lib/voice/transcriptParser";

const ACTIONS = [
  { id: "research", icon: BookOpen,       label: "Research",   color: "#10B981" },
  { id: "grocery",  icon: ShoppingBasket, label: "Add Item",   color: "#8B5CF6" },
  { id: "note",     icon: PenLine,        label: "Quick Note", color: "#FF7B54" },
];

export default function GlobalFAB() {
  const [expanded,     setExpanded]     = useState(false);
  const [noteOpen,     setNoteOpen]     = useState(false);
  const [groceryOpen,  setGroceryOpen]  = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);

  const voice = useVoiceInput({ continuous: true });
  const { activeChildId } = useAppStore();

  function handleAction(id: string) {
    setExpanded(false);
    setTimeout(() => {
      if      (id === "note")     setNoteOpen(true);
      else if (id === "grocery")  setGroceryOpen(true);
      else if (id === "research") setResearchOpen(true);
    }, 120);
  }

  function handleMicPress() {
    if (voice.state === "idle" || voice.state === "error") {
      navigator.vibrate?.(40);
      voice.start();
    } else if (voice.state === "listening") {
      voice.stop();
    }
  }

  async function handleNoteSave(text: string) {
    await supabase.from("memory_events").insert({
      content: text, type: "note", child_id: activeChildId, created_by: "parent",
    });
  }

  async function handleInstantAdd(name: string) {
    await supabase.from("grocery_items").insert({
      name, child_id: activeChildId, created_by: "parent",
    });
  }

  async function handleVoiceSave(text: string) {
    const result = parseVoice(text, "note");
    if (result.type === "grocery") {
      await Promise.all(
        result.items.map(name =>
          supabase.from("grocery_items").insert({ name, child_id: activeChildId, created_by: "nanny" })
        )
      );
    } else {
      await supabase.from("memory_events").insert({
        type: "note",
        content: result.content,
        category: "play",
        child_id: activeChildId,
        created_by: "nanny",
        created_at: new Date().toISOString(),
      });
    }
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[45] bg-black/25"
            onClick={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB + tray — anchored above the nav pill */}
      <div className="fixed bottom-0 left-0 right-0 z-[46] pointer-events-none">
        <div className="max-w-md mx-auto h-0 relative">
          <div className="absolute bottom-[88px] right-4 pointer-events-auto flex flex-col items-end gap-2.5">

            {/* Tray items */}
            <AnimatePresence>
              {expanded && ACTIONS.map(({ id, icon: Icon, label, color }, i) => (
                <motion.button
                  key={id}
                  initial={{ opacity: 0, y: 10, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.92, transition: { duration: 0.12 } }}
                  transition={{ delay: i * 0.045, duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                  onClick={() => handleAction(id)}
                  className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-[1.1rem] select-none active:scale-95 transition-transform"
                  style={{
                    background: "var(--surface-card)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
                  }}
                >
                  <span className="text-[13px] font-semibold text-foreground/80">{label}</span>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}1A` }}
                  >
                    <Icon size={15} strokeWidth={2.2} style={{ color }} />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>

            {/* Bottom row: mic + FAB */}
            <div className="flex items-center gap-2.5">
              {/* Persistent mic button */}
              <motion.button
                onClick={handleMicPress}
                whileTap={{ scale: 0.88 }}
                className="w-10 h-10 rounded-full flex items-center justify-center select-none relative"
                style={{
                  background: "var(--surface-card)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.07)",
                  border: voice.state === "listening"
                    ? "1.5px solid var(--accent-primary)"
                    : "1.5px solid var(--border-soft)",
                }}
                aria-label="Voice input"
              >
                {voice.state === "listening" && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ border: "1.5px solid var(--accent-primary)", opacity: 0.4 }}
                    animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <Mic
                  size={15}
                  strokeWidth={2}
                  style={{
                    color: voice.state === "listening"
                      ? "var(--accent-primary)"
                      : "var(--text-secondary)",
                  }}
                />
              </motion.button>

              {/* FAB button */}
              <motion.button
                onClick={() => setExpanded(e => !e)}
                className="w-12 h-12 rounded-full flex items-center justify-center select-none"
                style={{
                  background: "linear-gradient(135deg, var(--accent-primary), var(--accent-soft))",
                  boxShadow: "0 4px 16px rgba(255,123,84,0.4), 0 2px 6px rgba(0,0,0,0.12)",
                }}
                animate={{ rotate: expanded ? 45 : 0 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                whileTap={{ scale: 0.9 }}
              >
                <Plus size={22} strokeWidth={2.5} className="text-white" />
              </motion.button>
            </div>

          </div>
        </div>
      </div>

      {/* Sheets */}
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
      <VoiceInputModal
        state={voice.state}
        transcript={voice.transcript}
        interim={voice.interim}
        context="note"
        onStop={voice.stop}
        onSave={handleVoiceSave}
        onCancel={voice.reset}
      />
    </>
  );
}
