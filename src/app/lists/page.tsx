"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { groceryItems as demoItems } from "@/lib/data/demo";
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import type { VoiceResult } from "@/lib/voice/transcriptParser";

type Item = { id: string; name: string; completed: boolean };

export default function ListsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("grocery_items")
      .select("*")
      .order("created_at", { ascending: true });
    setItems(data && data.length > 0 ? data : demoItems);
    setLoading(false);
  }

  async function addItem(name?: string) {
    const n = (name ?? input).trim();
    if (!n) return;
    const newItem: Item = { id: Date.now().toString() + Math.random(), name: n, completed: false };
    setItems((prev) => [...prev, newItem]);
    if (!name) setInput("");
    await supabase
      .from("grocery_items")
      .insert({ name: n, child_id: "default", created_by: "parent" });
  }

  function handleVoiceSave(result: VoiceResult) {
    if (result.type === "grocery") {
      result.items.forEach((name, i) => {
        setTimeout(() => addItem(name), i * 80);
      });
    }
  }

  async function toggle(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i))
    );
    const item = items.find((i) => i.id === id);
    if (item) {
      await supabase
        .from("grocery_items")
        .update({ completed: !item.completed })
        .eq("id", id);
    }
  }

  const remaining = items.filter((i) => !i.completed).length;
  const pending = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      {/* Header */}
      <div
        className="px-5 pt-7 pb-5 border-b border-soft"
        style={{ background: "var(--surface-header)" }}
      >
        <h1 className="text-[26px] font-extrabold text-foreground tracking-tight">
          Grocery List
        </h1>
        <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">
          {remaining} item{remaining !== 1 ? "s" : ""} remaining
        </p>
      </div>

      {/* List */}
      <div className="flex-1 px-4 pt-4 pb-4 space-y-1.5">
        {!loading && (
          <>
            {pending.map((item) => (
              <ListRow key={item.id} item={item} onToggle={toggle} />
            ))}

            {done.length > 0 && (
              <>
                {pending.length > 0 && <div className="h-4" />}
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1 pb-1">
                  Picked up
                </p>
                {done.map((item) => (
                  <ListRow key={item.id} item={item} onToggle={toggle} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Input bar */}
      <div
        className="sticky bottom-[80px] px-4 pb-3 pt-2.5 border-t border-soft"
        style={{ background: "var(--surface-header)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-surface-card border-soft rounded-2xl px-4 py-2.5 shadow-card">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
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

function ListRow({
  item,
  onToggle,
}: {
  item: Item;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(item.id)}
      className="w-full flex items-center gap-3.5 bg-surface-card rounded-2xl px-4 py-3.5 border-soft shadow-card active:scale-[0.985] transition-all duration-150 text-left select-none"
    >
      {/* Checkbox circle */}
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
          item.completed
            ? "bg-emerald-500 border-emerald-500"
            : "border-border"
        )}
      >
        {item.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <span
        className={cn(
          "text-[14px] font-medium flex-1 transition-all duration-200",
          item.completed
            ? "line-through text-muted-foreground/40"
            : "text-foreground"
        )}
      >
        {item.name}
      </span>
    </button>
  );
}
