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

## Known / Deferred

- [ ] Real authentication (Supabase Auth) — currently `child_id: "default"` everywhere
- [ ] Photo upload to Supabase Storage (`PhotoUploader.tsx` is wired but untested without keys)
- [ ] `.env.local` not in repo — app runs on demo data without it
- [ ] `MemoryCard.tsx` placeholder component not yet used
- [ ] `FloatingActions.tsx` — referenced in earlier build; removed from current home layout
- [ ] Push notifications for nanny → parent updates
- [ ] Multi-child support
