# Ankur — Progress

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
- [x] `BottomNav` — floating glass pill, `shadow-float`, `backdrop-blur-24px`, active tab auto-inverts via `bg-foreground text-background`; 5-item layout (Home / Schedule / Journal / Lists / Together) with even flex-1 spacing to fit narrow viewports
- [x] `GlobalFAB` (`src/components/layout/GlobalFAB.tsx`) — expandable "+" button fixed above the nav pill on every page; expands upward into a stacked tray of 4 actions (Research, Add Item, Quick Note, Voice) with staggered Framer Motion animation; "+" rotates 45° to "×" when open; backdrop closes on tap; each action opens the appropriate bottom sheet; all Supabase writes (memory_events, grocery_items) live inside the component; registered in root layout alongside BottomNav

### Home Screen (`/home`)
- [x] `ChildProfileHeader` — gradient header, avatar with mood badge, focus + weather badges, animated day-progress bar; tappable focus badge opens inline `FocusArea` chip picker (language / sensory / movement / practical-life / creativity); selecting a chip updates `ActivityPlan` in real-time
- [x] `RecommendationCard` — replaces AICard; live `nextBestAction` fetch with guidance layer, expandable "Why this works" section, share/approval action bar (idle → shared | awaiting); AI `flagForApproval` auto-sets awaiting state
- [x] `ActivityPlan` — horizontal snap scroll of 3 Montessori-area activity cards; responds to `focus` prop from page; each card has Start → active → Done state machine + Swap button (swaps to alternativeTitle/alternativeDescription inline); `GuidanceTag` per card; live `activityPlan` AI fetch; falls back to `dailyActivities` demo data
- [x] ~~`QuickActions`~~ — removed from home screen; Quick Note, Add Item, Voice, and Research moved to global `GlobalFAB` accessible on all pages
- [x] `MomentsCarousel` — horizontal snap scroll, photo + note card types
- [x] `TimelineFeed` — timeline with colored dots, active amber bar, NOW badge, done states
- [x] `InsightStrip` — ambient single-sentence AI observation below timeline, fades in at 700ms
- [x] `page.tsx` — converted to `"use client"`, lifts `focus: FocusArea` state shared between `ChildProfileHeader` (selector) and `ActivityPlan` (consumer)

### Memory / Journal Screen (`/memory`)
- [x] Three-tab interface: **Today** / **This Week** / **Favorites** with AnimatePresence crossfade
- [x] Page header — live date display ("Thursday, May 14"), editorial "Mateo's Journal" label, backdrop-blur; no border-b utility look
- [x] `DatePicker` — bottom-sheet modal with "Today / This week" shortcuts + last 4 weeks + last 4 individual days; selects past day or past week view
- [x] `PastDayView` — renders a single past date's journal entries from `dailySummaries` + `recentMemories` demo data; back button returns to tab view
- [x] `PastWeekView` — renders a labeled past week (e.g. "Last week · May 5–11"); back button returns
- [x] View state machine: `{ type: "tab" | "day" | "week" }` drives header title, back button visibility, and AnimatePresence content swap
- [x] `JournalSummary` — dark gradient AI summary card, `24px` headline, highlight pills, care notes (Sleep / Nutrition / Growth); live `dailySummary` + `insights` fetch; subtle AI attribution badge at footer
- [x] `TodayJournal` — full-bleed `3:4` hero photo (no border-radius, edge-to-edge); milestone as centered typographic panel with `36px` ✦ glyph + generous `py-14`; notes with `56px` serif `"` drop mark + no card background; secondary photos inset `mx-4 rounded-[1.5rem]`
- [x] `WeekView` — all photos full-bleed (first per day `3:4` portrait, subsequent `16:9` landscape); milestones + notes rendered as open typographic sections with no card backgrounds; day headers `px-5` inline
- [x] `WeeklyRecap` — replaces `WeeklyInsightCard`; milestone highlights strip (up to 4 ✦ items from `weeklyMoments`); skills-practiced chips derived from activity categories (learning→Language, outdoor→Gross Motor, etc.); retains live AI pattern observations
- [x] `FavoritesView` — `3:4` featured hero, first extra photo full-width, remaining in `2-col` grid; milestone pull-quotes with `56px` serif `"` drop mark + `22px` text in warm cream cards

### Trusted Caregiving Intelligence (`src/lib/ai/guidance.ts`, `src/components/ui/GuidanceTag.tsx`)
- [x] `guidance.ts` — typed `GuidanceSource` registry: CDC 15–18 mo., CDC 18–24 mo., AAP early childhood, WHO nurturing care, General developmental practice; each entry has label, description, ageRange, and honest `disclaimer` ("informed by, not prescribed by"); structured as hook point for future real data
- [x] `GuidanceTag` — tappable framework pill, color-coded by source (emerald/sky/teal/stone); tap expands inline context panel with description + disclaimer; `static` prop disables expansion for nested use
- [x] `nextBestAction` prompt updated to return `developmentalReason`, `guidanceSource`, `ageRange`, `flagForApproval`; model instructed to name the aligning framework, never claim prescription, never flag approval without genuine parent-input need
- [x] `RecommendationCard` guidance layer: `GuidanceTag` below developmental note; "Why this works" toggle reveals `developmentalReason` + "Aligned with…" static tag; `guidanceSource` validated against known values before use
- [x] `demo.ts` `aiSuggestion` enriched with `developmentalReason`, `guidanceSource`, `ageRange`, `flagForApproval`

### Collaborative Journal (`src/components/memory/`)
- [x] `ReactionBar` — 4 emoji reactions (❤️ 🥹 😂 ✨); toggle state with per-author tracking (current user = "nanny"); active chip: amber background; renders on milestone panels and note cards
- [x] `ReplyThread` — threaded reply composer on journal entries; shows last 2 replies collapsed with "N earlier replies" expand; reply input shows Send button only when text present; new replies appended to local state; AuthorBadge dot per reply
- [x] `TodayJournal` — milestone panels and note cards now include `ReactionBar` + `ReplyThread`; photos remain editorial only
- [x] `WeekView` — same interaction model carried into week-view milestones and notes

### Activity Planning (`src/lib/ai/prompts/activityPlan.ts`)
- [x] `activityPlan` AI prompt — returns 3 Montessori-area activities with `title`, `area`, `description`, `duration`, `materials`, `guidanceSource`, `alternativeTitle`, `alternativeDescription`; child-led exploration framing, age-appropriate, no prescriptive language
- [x] `/api/ai` route — added `activityPlan` branch; `max_tokens` raised 512 → 1024

### User Attribution (`src/components/ui/AuthorBadge.tsx`)
- [x] `AuthorBadge` — shared component: `nanny` (amber, "E", "Elena"), `parent` (rose, "S", "Sofia"), `ai` (violet, Sparkles icon, "Claude")
- [x] `inline` variant — circle + name + optional time; `dot` variant — circle only for photo overlays; `light` prop for dark/photo backgrounds
- [x] `TodayJournal` — attribution in hero + inset photo captions, milestone panels, and note card bylines; data-driven from `moment.createdBy`
- [x] `WeekView` — all moment types carry attribution; parent-captured Sunday/Monday evening entries visually distinct from nanny entries
- [x] `FavoritesView` — attribution on featured hero overlay and milestone pull-quote footers
- [x] `JournalSummary` — `opacity-50` AI badge at card footer distinguishes AI-generated content from human entries
- [x] `TimelineFeed` — `opacity-70` author badge below logged notes on done/active schedule items
- [x] `demo.ts` — `createdBy` added to `JournalMoment` interface + all `weeklyMoments`; `favoriteMemories` tagged `parent`; `loggedBy` on done/active schedule items

### Schedule Screen (`/schedule`)
- [x] Two-section layout: Upcoming / Completed
- [x] `ScheduleBlock` — colored left accent bar, time, type pill, NOW badge, check circle
- [x] Converted to `"use client"` with `useEffect` Supabase fetch; typed `ScheduleItem` + safe `normalize()` function
- [x] Date picker integration — calendar icon in header opens `DatePicker`; selecting a past day filters schedule to that date with back-navigation

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
- [x] `MomentReaction` + `MomentReply` interfaces; reactions/replies seeded on `t2` (milestone) and `t4` (note)
- [x] `FocusArea` type + `focusAreas` array; `MontessoriArea` + `PlannedActivity` interfaces; `dailyActivities` (3 activities across language/sensory/practical-life); `areaConfig` with colors + icons per area

---

### Seeded Demo Environment (`src/lib/data/demo.ts`, `supabase/`)
- [x] `child` — Mateo Rivera, 18 months, born Nov 14 2024; `family` export with Elena Chen + Rivera parents
- [x] `schedule` — 8 items: 3 done (breakfast/park/snack), 1 active (sensory bin), 4 upcoming (lunch/nap/snack/reading)
- [x] `moments` — 6 emotionally rich carousel entries for today
- [x] `groceryItems` — 14 items (6 done, 8 pending); `pastGroceryItems` — 12 fully completed items from last week
- [x] `weeklyMoments` — 7 days (May 8–14 including Sunday May 10 family day); correct day labels throughout
- [x] `recentMemories` — 49 entries covering May 1–14 across all 14 days; mixed nanny + parent voices, unique picsum seeds
- [x] `dailySummaries` — 13 past-day summaries (May 1–13); includes harder days, family Sundays, developmental arc
- [x] `favoriteMemories` — 9 entries spanning April 2025–March 2026 (first food, first bath, first Mama, first steps, etc.)
- [x] `supabase/seed.sql` — full schema + 49 memory events, 13 AI summaries, 26 grocery items, all idempotent
- [x] `supabase/seed.ts` — TypeScript runner using service role key; `npx tsx supabase/seed.ts`

### Full 7-Layer Live Seed (`supabase/seed.ts`, `supabase/setup.sql`)
- [x] **Layer 1 — Foundation**: 1 household (Rivera family), 3 auth users (Sofia, Marco, Elena), 3 household_members
- [x] **Layer 2 — Child & Profile**: Mateo + child_profiles, developmental snapshot, sleep profile, 17 activity preferences, 7 sensory preferences, language snapshot, feeding preferences, 2 parent relationships, 1 nanny relationship
- [x] **Layer 3 — Activity Planning**: 25 activity_library entries, 5 schedule_templates, 58 schedule_blocks, 20 activity_recommendations, 54 schedule_items (May 12–20 + milestone day May 14)
- [x] **Layer 4 — Journal & Memory**: 21 journal_entries (j01–j21, May 1–14, Elena/Sofia/Marco voices, multi-paragraph narratives, photos JSONB, mood emoji, is_favorite)
- [x] **Layer 5 — Grocery & Household Ops**: 5 grocery_lists (archived May 5 week, active May 12 week, household/baby/pharmacy), 47 grocery_list_items with category/priority/recurring metadata, 16 household_notes (handoffs, reminders, supply-low, routine-updates)
- [x] **Layer 6 — AI Insights**: 19 ai_insights (pattern/correlation/developmental-observation/language/sleep/feeding/recommendation), 3 extended ai_summaries (May 14–16 with headline + highlights JSONB)
- [x] **Layer 7 — Realism & Interactions**: 28 memory_reactions (emoji reactions on events/journal/summaries), 28 threaded_replies across 10 conversation threads, 16 activity_completions (with replaced/skipped statuses), 6 voice_notes with transcripts, 6 approval_requests (all approved)
- [x] `supabase/setup.sql` — single combined DDL file: drops all tables in dependency order, recreates with correct TEXT ids, installs RLS helper functions + all policies; resolves circular dependency between schema and RLS files
- [x] Live Supabase project seeded at `mgbzsikninkwmlqtastg.supabase.co`

### Voice Input Layer (`src/hooks/`, `src/lib/voice/`, `src/components/voice/`)
- [x] `useVoiceInput` hook — SpeechRecognition wrapper with `idle/listening/done/error/unsupported` states
- [x] `src/lib/voice/speechRecognition.ts` — engine abstraction; `createRecognition()` is the Whisper swap point
- [x] `src/lib/voice/transcriptParser.ts` — grocery item extraction (comma + "and" splitting), activity category detection, time extraction from schedule phrases
- [x] `VoiceButton` — pure UI mic button; `pill` variant (circular, inline) and `row` variant (full-width labeled)
- [x] `VoiceInputModal` — spring-animated bottom sheet: 4-bar waveform, live blinking cursor, editable transcript, haptic `navigator.vibrate` on save, "Saved ✓" auto-dismiss
- [x] `VoiceRecorder` — orchestrator: wires `useVoiceInput` + `transcriptParser` + the two UI components
- [x] Lists page — mic pill in input bar; one utterance adds multiple items with staggered optimistic inserts
- [x] Memory page — mic pill in header next to PhotoUploader; saves note to Supabase `memory_events`
- [x] `GlobalFAB` — Voice action in FAB tray; uses `useVoiceInput` hook directly (not VoiceRecorder), renders `VoiceInputModal` within the FAB component; routes to grocery or memory insert based on parsed transcript

### Security — Row Level Security (`supabase/rls.sql`)
- [x] `households` table — one row per family, fixed demo UUID `11111111-...`
- [x] `household_members` table — maps `auth.users.id` → household + role (`parent` | `nanny`)
- [x] `children` — `household_id` column added, FK to `households`
- [x] Helper functions: `my_household_id()`, `my_role()`, `in_my_household(child_id)` — keep policies readable
- [x] RLS enabled on all 7 tables with per-operation policies
- [x] Nannies: read all, create memories + grocery items, update schedule — no delete
- [x] Parents: full read/write on all tables, manage members
- [x] Cross-household isolation enforced at DB level — no app-level enforcement needed

### Mobile UI Polish
- [x] Bottom sheet padding — all sheets (`QuickCaptureSheet`, `ResearchSheet`, `VoiceInputModal`, `ProfileSheet`, `DatePicker`, `CreateSuggestionSheet`, `PhotoUploader`) use `pb-28` to clear the nav pill; `DatePicker` calendar/week list uses `max(100px, calc(88px + env(safe-area-inset-bottom)))` for safe-area coverage
- [x] BottomNav overflow fix — reduced item padding so all 5 tabs fit on 360px Android viewport without clipping

### Premium Palette Refactor
- [x] Warm 60/30/10 system: `--surface-page/card/raised` (warm linen / off-white / cream); ShadCN oklch tokens shifted warm
- [x] Semantic palette: `--sage/#6A9C80` (growth/health), `--trust/#5B7FA0` (calm/AI), `--lavender/#8A7AB8` (thoughtful)
- [x] Accent: `--accent-primary/#D4694A` (terracotta), warm text browns, no pure dashboard grays
- [x] `@theme inline` registrations: `bg-sage`, `text-trust`, `bg-lavender-light` etc. available as Tailwind utilities
- [x] All components migrated from violet/emerald/indigo defaults: `RecommendationCard`, `WeeklyRecap`, `GuidanceTag`, `ActivityPlan`, `ScheduleBlock`, `TimelineFeed`, `AuthorBadge`, `SwipeableRow`, `SuggestionDetailSheet`, `ChildProfileHeader`, `AICard`, `QuickActions`, `RecentMomentsGrid`, `WeeklyInsightCard`

### Audio Memories (`src/components/memory/AudioMoment.tsx`, `VoiceMemorySheet.tsx`)
- [x] `VoiceMemorySheet` — premium bottom-sheet recorder: idle → recording → review state machine; 36-bar animated waveform (deterministic maxH/minH/dur per bar); live SpeechRecognition transcript preview; optional photo attachment via file input; editable caption; playback before save; spring animation; warm backdrop blur; `onSave` emits `JournalMoment` with audio metadata
- [x] `AudioMoment` — XOR-shift PRNG waveform seeded from moment ID (44 bars, sine envelope taper); real audio via `<audio>` + `timeupdate` or simulated playback via `setInterval`; playhead bar `scaleY` animation while playing; `PhotoStamp` polaroid overlay (deterministic rotation); transcript behind border-t; reactions/replies via type narrowing (`"reactions" in moment`)
- [x] Audio moments seeded in `demo.ts` — 3 entries across Today/May13/May9 with realistic voice content
- [x] Audio type renders in all journal views: `TodayJournal`, `WeekView`, `PastDayView`, `PastWeekView`
- [x] Mic button in memory page header opens `VoiceMemorySheet`; saved moments prepend to Today feed via `localMoments` state + `extras` prop on `TodayJournal`
- [x] `JournalMomentType` extended: `"photo" | "note" | "milestone" | "audio"`; `audioUrl?` and `duration?` on `JournalMoment` and `MemoryEvent`

### AI Storytelling (`src/components/memory/` story cards)
- [x] `WeeklyStory` — editorial narrative opener at top of week view; warm cream card, amber rule, large headline + prose; live `weeklyStory` AI call; demo: "The week he found his voice"
- [x] `MonthlyStory` — monthly theme narrative in Cherished/Favorites tab; "MAY 2026" label, title, flowing body; live `monthlyStory` AI call; demo: "The month he started talking back"
- [x] `MemoryHighlight` — pull-quote editorial card between days in week view; 56px amber `"` glyph, featured moment in italic, AI caption framing why it matters; live `memoryHighlight` AI call
- [x] `DevelopmentStory` — quiet trust-light card in Today tab (between JournalSummary and journal feed); pulsing teal dot, observational growth prose without clinical language; live `developmentStory` AI call
- [x] `OnThisDay` — past memory card above JournalSummary in Today tab; thumbnail or emoji, date chip, moment content, AI reflection connecting past to now; live `onThisDay` AI call
- [x] 5 new prompt files in `src/lib/ai/prompts/` — each crafts warm, narrative, non-clinical prose with specific tone rules; all return JSON
- [x] `api/ai/route.ts` — 5 new branches (`weeklyStory`, `monthlyStory`, `memoryHighlight`, `developmentStory`, `onThisDay`); all added to `needsMoreTokens` (1200 token budget)
- [x] All story cards render compelling demo copy instantly; Claude silently replaces on success — no loading states, no spinners

### Ankur Brand Identity (`src/components/brand/`, `public/ankur-wordmark.png`)
- [x] Primary wordmark PNG (`/public/ankur-wordmark.png`) — deep teal letterforms, seedling sprout on "n", amber smile arc on "ü", tagline "rooted in care, growing together"
- [x] `AnkurWordmark` component — Next.js `Image` wrapper; `width` prop (auto-proportioned 2.7:1); `priority` flag for above-fold use
- [x] `WelcomeSplash` fully rebranded: Ankur wordmark hero (260px) on warm cream `#F4EFE8` matching logo background; `.btn-brand` CTA (teal gradient); pills rewritten to brand values (Rooted in care / Family collaboration / Thoughtfully intelligent / Premium experience)
- [x] `ProfileComplete` hero: brand teal gradient card (`#2A6965 → #3D8480`) with 160px wordmark embedded; Sunny attribution icon updated from orange to teal; CTA uses `.btn-brand`
- [x] `ProfileSheet` brand footer: full-bleed teal card at end of scrollable content — wordmark, tagline, version; primary settings-adjacent surface (accessible via child avatar on home)
- [x] Home page: 30% opacity brand footer at scroll end (88px wordmark + tagline)
- [x] `layout.tsx`: `title: "Ankur"`, `description: "Rooted in care, growing together"`
- [x] CSS brand tokens: `--brand/#2A6965`, `--brand-mid/#3D8480`, `--brand-light/#E2EEEE`, `--brand-amber/#C9912B`, `--brand-amber-light/#F5EAD5` in `:root` + `@theme inline`
- [x] `.btn-brand` global class — teal gradient, matching depth shadow, active/disabled states

---

### Real Supabase Persistence (`src/lib/supabase/`, `src/app/`)
- [x] `moments.ts` — `fetchTodayMoments()` fetches today's `memory_events` + attaches reactions/replies; `insertMoment()` with optimistic fallback; `updateMoment()` and `deleteMoment()` for full CRUD
- [x] `reactions.ts` — `toggleReaction()`: checks for existing row with `maybeSingle()`, deletes or inserts into `memory_reactions`
- [x] `replies.ts` — `addReply()`: inserts to `threaded_replies`, returns real DB id or optimistic fallback
- [x] `suggestions.ts` — `updateSuggestionWorkflow()` persists scheduled day + outcome rating/note to `suggestions` table
- [x] Memory page — `dbMoments` fetched on mount; `QuickWrite` calls `insertMoment()`; voice memos call `insertMoment()`; edit calls `updateMoment()`, delete calls `deleteMoment()`; all optimistic with immediate UI update
- [x] Schedule page — Supabase fetch on mount; toggle done persists; create item inserts to `schedule_items`; edit patches title/time/type/notes; delete removes row
- [x] Lists page — Supabase fetch on mount; add/toggle/delete persist; optimistic ID swap on insert (temp_ → real UUID); inline rename persists via `update`
- [x] `supabase/suggestions.sql` — `suggestions` + `suggestion_replies` tables

### Household Onboarding (`src/components/onboarding/HouseholdFlow.tsx`, `src/lib/supabase/household.ts`)
- [x] `household.ts` — `signUpUser`, `signInUser`, `createHousehold`, `createChild`, `createInvite`, `lookupInvite`, `acceptInvite`, `friendlyAuthError`
- [x] `HouseholdFlow.tsx` — full multi-step onboarding: role picker → name → account (signup/signin) → household name → child name → child age → invite caregiver (optional) → complete; parallel caregiver path: role → join (lookup invite) → name → account → complete
- [x] `create_household_for_user` RPC — SECURITY DEFINER; inserts household + member atomically (bypasses missing INSERT policy for new users)
- [x] `create_child_for_household` RPC — validates membership, creates child
- [x] `create_household_invite` RPC — validates parent role, expires old pending invites, creates new 7-day invite with `household_name` denormalized
- [x] `supabase/invites.sql` — `household_invites` table + all three RPCs

### Caregiver Invitations — Care Circle (`src/app/care-circle/`)
- [x] `/api/care-circle` GET — validates JWT, fetches household members enriched with `admin.auth.admin.getUserById`, fetches pending invites, returns `{ members, invites, household_id, household_name, child_name, is_parent }`
- [x] `/api/care-circle/remove-member` POST — validates caller is parent in same household; deletes nanny membership
- [x] `/api/care-circle/cancel-invite` POST — validates parent ownership; expires invite
- [x] `/api/invites/lookup` POST — service_role bypass; finds pending non-expired invite by email
- [x] `/api/invites/accept` POST — upserts `household_members` with role 'nanny'; marks invite accepted
- [x] `/api/invites/send` POST — fetches household name, expires old pending, inserts new 7-day invite
- [x] `src/app/care-circle/page.tsx` — members list (parents + caregivers), pending invites, `InviteSheet` bottom sheet (email + optional note), optimistic remove/cancel with rollback, parent-only edit actions, empty state
- [x] `GlobalNav.tsx` — "Care circle" and "Invite caregiver" items now route to `/care-circle`

### Full User-Created Content CRUD
- [x] **Journal entries** — `NoteCard` inline edit on tap (textarea replaces text, Done chip + autosave on blur); `⋯` overflow menu on all card types (NoteCard, HeroPhoto, PolaroidPhoto, MilestonePanel, AudioMoment) with Edit / Delete; `AnimatePresence` exit animation on delete
- [x] **Photos** — `PhotoUploader` fires `onSaved` callback after successful upload so photo appears immediately in Today feed without reload; delete via `⋯` menu on polaroid + hero cards
- [x] **Voice memories** — `handleAudioSave` now calls `insertMoment("note", ...)` so voice memos persist; audio blob URL preserved for session playback; transcript stored as content
- [x] **Schedule items** — floating `+` FAB opens `EditSheet` (title, time text input, type pill picker, optional notes); `⋯` menu per block → Edit (reopens sheet pre-filled) or Remove; past-day view is read-only with no edit actions
- [x] **Grocery items** — `SwipeableRow` split tap zones: checkbox tap = toggle, text tap = inline edit (input field replaces label, blur/Enter commits, Escape cancels); `onRename` persists via `supabase.update`; swipe-left delete unchanged

---

## Known / Deferred

- [ ] Audio file upload to Supabase Storage — voice blobs are session-only; transcripts persist but playback requires re-record
- [ ] Push notifications for nanny → parent updates
- [ ] Multi-child support
- [ ] Settings page — accessible via ProfileSheet footer; dedicated `/settings` route not built
- [ ] `MemoryCard.tsx` placeholder component not yet used
- [ ] RLS policies for new tables (`household_invites`, `suggestions`) — currently service_role routes bypass RLS for invite operations
