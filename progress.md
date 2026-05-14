# Nanny OS — Progress

## Stack
- **Next.js 16.2.6** (App Router, Turbopack)
- **TypeScript + Tailwind CSS v4** (`@tailwindcss/postcss`, no config file)
- **ShadCN** (`@base-ui/react` components: button, badge, avatar, card)
- **Framer Motion** (entrance animations, AnimatePresence)
- **Supabase** (`@supabase/supabase-js` client, `@supabase/ssr` for session middleware)
- **Claude API** (`claude-sonnet-4-6` via raw fetch to `api.anthropic.com/v1/messages`)
- **Lucide React** icons
- GitHub: `stretchmonroe/nanny-os`

---

## Completed

### Foundation
- [x] Next.js project scaffolded with App Router, TypeScript, Tailwind v4, ShadCN
- [x] Supabase client (`src/lib/supabase/client.ts`) with graceful no-key fallback
- [x] Session middleware (`src/proxy.ts`) — Next.js 16 requires function named `proxy`, not `middleware`
- [x] Dark mode auto-detection via inline `<script>` in `<head>`, `suppressHydrationWarning` on `<html>`
- [x] `next.config.ts` with `picsum.photos` remote image pattern
- [x] Demo data fallback throughout — app works without Supabase or Claude keys

### Design System (`src/app/globals.css`)
- [x] CSS custom property layer: `--surface-page/card/raised/header` (light + dark)
- [x] Warm-tinted shadow system: `--shadow-card/elevated/float/deep` via `@utility` classes
- [x] `border-soft` / `border-medium` utilities (rgba, auto dark-switches)
- [x] Deep warm dark mode: `#0D0B09` page, `#181512` card, `#1E1B17` raised
- [x] Updated oklch tokens for richer contrast and muted colors
- [x] Tap highlight removed globally; font antialiasing on body
- [x] `.scroll-hide` carousel utility

### Navigation
- [x] `BottomNav` — floating glass pill, `shadow-float`, `backdrop-blur-24px`, active tab auto-inverts via `bg-foreground text-background`

### Home Screen (`/home`)
- [x] `ChildProfileHeader` — gradient header, avatar with mood badge, focus + weather badges, animated day-progress bar
- [x] `AICard` — live `nextBestAction` fetch with demo fallback; developmental note section (Brain icon, focus label, specific rationale)
- [x] `QuickActions` — Quick Note + Add Item buttons
- [x] `MomentsCarousel` — horizontal snap scroll, photo + note card types
- [x] `TimelineFeed` — timeline with colored dots, active amber bar, NOW badge, done states
- [x] `InsightStrip` — ambient single-sentence AI observation below timeline, fades in at 700ms

### Memory / Journal Screen (`/memory`)
- [x] Three-tab interface: **Today** / **This Week** / **Favorites** with AnimatePresence crossfade
- [x] `JournalSummary` — dark gradient AI summary card with headline, paragraph, highlight pills, care notes section (Sleep / Nutrition / Growth); live `dailySummary` + `insights` fetch
- [x] `TodayJournal` — magazine grid: hero photo → milestone + small photo side-by-side → note card
- [x] `WeekView` — day-separated timeline (Thu → Mon) with photo thumbnails
- [x] `WeeklyInsightCard` — emerald pattern card at top of week view; live insights fetch
- [x] `FavoritesView` — featured hero, 2-column photo grid, milestone quote cards

### Schedule Screen (`/schedule`)
- [x] Two-section layout: Upcoming / Completed
- [x] `ScheduleBlock` — colored left accent bar, time, type pill, NOW badge, check circle

### Lists Screen (`/lists`)
- [x] Grocery list with round checkbox toggle, completed section
- [x] Sticky add-item input bar with arrow-up submit button
- [x] Optimistic UI updates + Supabase sync

### AI Integration (`src/lib/ai/`)
- [x] `src/app/api/ai/route.ts` — unified POST handler for `dailyPlan`, `dailySummary`, `nextBestAction`, `insights`; try/catch, no-key guard, `claude-sonnet-4-6`
- [x] `src/lib/ai/client.ts` — `callAI()` with error handling (returns `null` on failure); `parseAIJson()` helper (strips markdown fences)
- [x] Prompts: `generateDailyPlan`, `dailySummary`, `nextBestAction`, `insights`
- [x] System prompt rewritten: observer voice, specific-to-this-child framing, no "Research shows"
- [x] All AI surfaces render demo data instantly; Claude silently upgrades on success

### Demo Data (`src/lib/data/demo.ts`)
- [x] `child`, `schedule` (6 items with done/active states), `moments` (6 items)
- [x] `groceryItems`, `aiSuggestion` (with `developmentalNote` + `developmentalFocus`)
- [x] `todayInsights`, `weeklyPatterns`, `careNotes`
- [x] `aiJournalSummary`, `weeklyMoments` (4 days, 12 moments), `favoriteMemories` (6 items)
- [x] `typeConfig` (meal/outdoor/play/nap/learning → color + dot + label)

---

### Seeded Demo Environment (`src/lib/data/demo.ts`, `supabase/`)
- [x] `child` — Mateo Rivera, 18 months, born Nov 14 2024; `family` export with Elena Chen + Rivera parents
- [x] `schedule` — 8 items: 3 done (breakfast/park/snack), 1 active (sensory bin), 4 upcoming (lunch/nap/snack/reading)
- [x] `moments` — 6 emotionally rich carousel entries for today
- [x] `groceryItems` — 14 items: 6 completed, 8 pending (avocado, banana, yogurt, etc.)
- [x] `weeklyMoments` — 6 days (May 8–14) with 3–4 moments each; real milestones per day
- [x] `recentMemories` — 31 entries covering May 1–14 with photos, notes, milestones
- [x] `dailySummaries` — 5 past-day summaries (May 8–13) with headlines + highlights
- [x] `supabase/seed.sql` — full schema (`children`, `memory_events`, `schedule_items`, `grocery_items`, `ai_summaries`) + all data inserts
- [x] `supabase/seed.ts` — TypeScript runner using service role key; `npx tsx supabase/seed.ts`

### Security — Row Level Security (`supabase/rls.sql`)
- [x] `households` table — one row per family, fixed demo UUID `11111111-...`
- [x] `household_members` table — maps `auth.users.id` → household + role (`parent` | `nanny`)
- [x] `children` — `household_id` column added, FK to `households`
- [x] Helper functions: `my_household_id()`, `my_role()`, `in_my_household(child_id)` — keep policies readable
- [x] RLS enabled on all 7 tables with per-operation policies
- [x] Nannies: read all, create memories + grocery items, update schedule — no delete
- [x] Parents: full read/write on all tables, manage members
- [x] Cross-household isolation enforced at DB level — no app-level enforcement needed

---

## Known / Deferred

- [ ] Real authentication (Supabase Auth) — currently `child_id: "default"` everywhere; `household_members` inserts needed after auth users created
- [ ] Photo upload to Supabase Storage (`PhotoUploader.tsx` is wired but untested without keys)
- [ ] `.env.local` not in repo — app runs on demo data without it
- [ ] `MemoryCard.tsx` placeholder component not yet used
- [ ] `FloatingActions.tsx` — referenced in earlier build; removed from current home layout
- [ ] Push notifications for nanny → parent updates
- [ ] Multi-child support
