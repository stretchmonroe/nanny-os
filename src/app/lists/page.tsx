"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import { ArrowUp } from "lucide-react";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import SwipeableRow from "@/components/lists/SwipeableRow";
import { NavMenuButton } from "@/components/layout/NavMenuButton";
import type { VoiceResult } from "@/lib/voice/transcriptParser";

const CHIPS = ["Bananas", "Milk", "Eggs", "Avocado", "Yogurt", "Blueberries", "Cheese", "Crackers"];

type Item = {
  id: string;
  name: string;
  completed: boolean;
  created_by: "nanny" | "parent";
  created_at: string;
};

export default function ListsPage() {
  const { activeChildId, activeChild, currentUserRole } = useAppStore();
  const authorType = (currentUserRole ?? "nanny") as "nanny" | "parent";

  const [items,   setItems]   = useState<Item[]>([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(true);

  // Stable ref so callbacks always see the latest items without re-creating load()
  const itemsRef = useRef<Item[]>(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  async function load(childId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("child_id", childId)
      .order("created_at", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load(activeChildId);
  }, [activeChildId]);

  async function addItem(name?: string) {
    const n = (name ?? input).trim();
    if (!n) return;
    const tempId = `temp_${Date.now()}`;
    const optimistic: Item = {
      id: tempId,
      name: n,
      completed: false,
      created_by: authorType,
      created_at: new Date().toISOString(),
    };
    setItems(prev => [...prev, optimistic]);
    if (!name) setInput("");

    const { data, error } = await supabase
      .from("grocery_items")
      .insert({ name: n, child_id: activeChildId, created_by: authorType })
      .select()
      .single();
    if (error || !data) {
      setItems(prev => prev.filter(i => i.id !== tempId));
    } else {
      setItems(prev => prev.map(i => i.id === tempId ? (data as Item) : i));
    }
  }

  function handleVoiceSave(result: VoiceResult) {
    if (result.type === "grocery") {
      result.items.forEach((name, i) => {
        setTimeout(() => addItem(name), i * 80);
      });
    }
  }

  async function toggle(id: string) {
    const item = itemsRef.current.find(i => i.id === id);
    if (!item) return;
    const next = !item.completed;
    setItems(prev => prev.map(i => i.id === id ? { ...i, completed: next } : i));
    const { error } = await supabase.from("grocery_items").update({ completed: next }).eq("id", id);
    if (error) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, completed: item.completed } : i));
    }
  }

  async function deleteItem(id: string) {
    const snapshot = itemsRef.current.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from("grocery_items").delete().eq("id", id);
    if (error && snapshot) {
      setItems(prev => [...prev, snapshot].sort((a, b) => a.created_at.localeCompare(b.created_at)));
    }
  }

  async function renameItem(id: string, name: string) {
    const prev = itemsRef.current.find(i => i.id === id);
    setItems(curr => curr.map(i => i.id === id ? { ...i, name } : i));
    const { error } = await supabase.from("grocery_items").update({ name }).eq("id", id);
    if (error && prev) {
      setItems(curr => curr.map(i => i.id === id ? { ...i, name: prev.name } : i));
    }
  }

  const pending   = items.filter(i => !i.completed);
  const done      = items.filter(i => i.completed);

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      {/* Header */}
      <div
        className="px-5 pt-7 pb-5 border-b border-soft"
        style={{ background: "var(--surface-header)" }}
      >
        <div className="flex items-center gap-2.5 -ml-1.5 mb-0.5">
          <NavMenuButton />
          <h1 className="text-[26px] font-extrabold text-foreground tracking-tight">
            This week
          </h1>
        </div>
        <p className="text-[12px] text-muted-foreground/50 mt-0.5 font-medium">
          {activeChild.name}&apos;s favorites + household staples
        </p>
      </div>

      {/* List */}
      <div className="flex-1 px-4 pt-4 pb-4">
        {!loading && (
          <>
            {pending.length === 0 && done.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-[36px] mb-3">🛒</p>
                <p className="text-[14px] font-semibold text-foreground/50 mb-1">
                  List is empty
                </p>
                <p className="text-[12px] text-muted-foreground/40">
                  Add something above or tap a chip
                </p>
              </div>
            )}

            {pending.map(item => (
              <SwipeableRow
                key={item.id}
                item={item}
                createdBy={item.created_by}
                onToggle={toggle}
                onDelete={deleteItem}
                onRename={renameItem}
              />
            ))}

            {done.length > 0 && (
              <>
                {pending.length > 0 && <div className="h-4" />}
                <p className="text-[10px] font-semibold text-muted-foreground/40 tracking-wide px-1 pb-1">
                  Got it
                </p>
                {done.map(item => (
                  <SwipeableRow
                    key={item.id}
                    item={item}
                    onToggle={toggle}
                    onDelete={deleteItem}
                    onRename={renameItem}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Input + chips bar */}
      <div
        className="sticky bottom-[80px] px-4 pb-3 pt-2.5 border-t border-soft"
        style={{ background: "var(--surface-header)" }}
      >
        {/* Suggestion chips */}
        <div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-hide">
          {CHIPS.map(chip => (
            <motion.button
              key={chip}
              whileTap={{ scale: 0.88 }}
              onClick={() => addItem(chip)}
              className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold select-none"
              style={{
                background: "var(--surface-card)",
                color:      "var(--foreground)",
                border:     "1.5px solid var(--border-medium)",
              }}
            >
              {chip}
            </motion.button>
          ))}
        </div>

        {/* Text input row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface-card border-soft rounded-2xl px-4 py-2.5 shadow-card">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem()}
              placeholder="Add item…"
              className="flex-1 text-[14px] bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none font-medium"
            />
            <button
              onClick={() => addItem()}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center disabled:opacity-25 transition-all active:scale-90 duration-150"
            >
              <ArrowUp size={14} strokeWidth={2.5} />
            </button>
          </div>
          <VoiceRecorder
            context="grocery"
            onSave={handleVoiceSave}
            className="w-11 h-11"
          />
        </div>
      </div>
    </div>
  );
}
