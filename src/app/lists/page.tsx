"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { groceryItems as demoItems } from "@/lib/data/demo";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

type Item = { id: string; name: string; completed: boolean };

export default function ListsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("grocery_items").select("*").order("created_at", { ascending: true });
    setItems(data && data.length > 0 ? data : demoItems);
    setLoading(false);
  }

  async function addItem() {
    const name = input.trim();
    if (!name) return;
    const newItem: Item = { id: Date.now().toString(), name, completed: false };
    setItems((prev) => [...prev, newItem]);
    setInput("");
    await supabase.from("grocery_items").insert({ name, child_id: "default", created_by: "parent" });
  }

  async function toggle(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i))
    );
    const item = items.find((i) => i.id === id);
    if (item) {
      await supabase.from("grocery_items").update({ completed: !item.completed }).eq("id", id);
    }
  }

  const remaining = items.filter((i) => !i.completed).length;
  const pending = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
        <h1 className="text-[22px] font-bold text-zinc-900 dark:text-stone-100 tracking-tight">
          Grocery List
        </h1>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
          {remaining} item{remaining !== 1 ? "s" : ""} remaining
        </p>
      </div>

      {/* List */}
      <div className="flex-1 p-4 space-y-1.5">
        {!loading && (
          <>
            {pending.map((item) => (
              <ListRow key={item.id} item={item} onToggle={toggle} />
            ))}

            {done.length > 0 && (
              <>
                {pending.length > 0 && <div className="h-3" />}
                <p className="text-[11px] font-bold text-stone-300 dark:text-stone-600 uppercase tracking-wider px-1 pb-1">
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

      {/* Sticky input */}
      <div className="sticky bottom-[68px] left-0 right-0 px-4 pb-3 pt-2 bg-[#FDFBF7]/90 dark:bg-[#1A1714]/90 backdrop-blur-sm border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl px-4 py-2.5 shadow-sm">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add item…"
            className="flex-1 text-[14px] bg-transparent text-zinc-800 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600 outline-none"
          />
          <button
            onClick={addItem}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-stone-100 text-white dark:text-zinc-900 flex items-center justify-center disabled:opacity-30 transition-opacity active:scale-90"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ListRow({ item, onToggle }: { item: Item; onToggle: (id: string) => void }) {
  return (
    <button
      onClick={() => onToggle(item.id)}
      className="w-full flex items-center gap-3.5 bg-white dark:bg-stone-900 rounded-2xl px-4 py-3.5 border border-stone-100 dark:border-stone-800 shadow-sm active:scale-[0.98] transition-all duration-150 text-left"
    >
      {/* Checkbox */}
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
          item.completed
            ? "bg-emerald-500 border-emerald-500"
            : "border-stone-300 dark:border-stone-600"
        )}
      >
        {item.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span
        className={cn(
          "text-[14px] font-medium flex-1",
          item.completed
            ? "line-through text-stone-300 dark:text-stone-600"
            : "text-zinc-800 dark:text-stone-100"
        )}
      >
        {item.name}
      </span>
    </button>
  );
}
