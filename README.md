# Ankur

*Rooted in care, growing together.*

A premium mobile-first childcare coordination app for the Rivera family — Elena (nanny), Sofia and Marco (parents), Mateo (18 months). One place to log moments, coordinate schedules, manage groceries, surface AI-powered developmental insights, and preserve the story of Mateo's days.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (no config file, `@tailwindcss/postcss`) |
| Animation | Framer Motion |
| Database | Supabase (Postgres + RLS + Storage) |
| AI | Claude `claude-sonnet-4-6` via Anthropic API |
| Icons | Lucide React |
| Components | Base UI (ShadCN) |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs fully on demo data without any environment keys.

### Environment (optional — for live data)

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # seeding only, never exposed client-side
ANTHROPIC_API_KEY=...
```

### Seeding the database

```bash
npx tsx supabase/seed.ts
```

Runs the 7-layer seed: household → child profile → activity library → journal entries → grocery lists → AI insights → reactions/replies/voice notes.

If the schema needs a full reset first:

1. Open the Supabase SQL editor
2. Run `supabase/setup.sql` (drops all tables in dependency order, recreates clean)
3. Then run `npx tsx supabase/seed.ts`

## Project Structure

```
src/
  app/
    home/         # Home screen — recommendation, activity plan, moments, timeline
    schedule/     # Day schedule with date picker
    memory/       # Journal — Today / This Week / Cherished + past day/week views
    lists/        # Grocery list with voice input
    together/     # Parent–nanny collaboration feed
    api/ai/       # Unified Claude handler (12 prompt types)
    api/upload/   # Supabase Storage photo upload
  components/
    brand/        # AnkurWordmark — reusable wordmark component
    layout/       # BottomNav (glass pill), GlobalFAB (expandable action tray)
    home/         # ChildProfileHeader, RecommendationCard, ActivityPlan, TimelineFeed
    memory/       # TodayJournal, WeekView, FavoritesView, JournalSummary, DatePicker,
                  # AudioMoment, VoiceMemorySheet, WeeklyStory, MonthlyStory,
                  # MemoryHighlight, DevelopmentStory, OnThisDay, PhotoUploader
    onboarding/   # WelcomeSplash (Ankur brand), OnboardingFlow, ProfileComplete
    profile/      # ProfileSheet (adaptive child learning profile + brand footer)
    shared/       # QuickCaptureSheet, ResearchSheet
    voice/        # VoiceRecorder, VoiceButton, VoiceInputModal
    ui/           # GuidanceTag, AuthorBadge
  hooks/
    useVoiceInput.ts   # SpeechRecognition wrapper
  lib/
    ai/           # callAI(), parseAIJson(), 12 prompt files, guidance registry
    data/demo.ts  # Full demo dataset — app works without Supabase
    voice/        # speechRecognition.ts, transcriptParser.ts
    adaptive-profile.ts  # localStorage-cached AI child profile
    supabase/     # client.ts, server.ts
public/
  ankur-wordmark.png   # Primary brand wordmark
supabase/
  setup.sql       # Full DDL — drops + recreates all tables + RLS
  seed.ts         # 7-layer TypeScript seed runner
  rls.sql         # Row Level Security policies (reference)
```

## Key Patterns

**Demo data first** — every screen renders immediately from `src/lib/data/demo.ts`. Supabase and Claude quietly upgrade data on success. No loading skeletons visible to the user.

**AI storytelling** — five storytelling surfaces (WeeklyStory, MonthlyStory, MemoryHighlight, DevelopmentStory, OnThisDay) each render warm demo copy instantly and silently replace it when Claude responds. Prompts enforce narrative, non-clinical, human prose.

**Bottom sheets** — all capture/display sheets use `fixed bottom-0` Framer Motion slide-up with `pb-28` interior padding to clear the nav pill. Safe-area insets handled via `env(safe-area-inset-bottom)`.

**Global FAB** — renders in the root layout above the nav bar. Tapping "+" expands a tray: Quick Note, Add Item, Voice, Research. Accessible from every page.

**Trusted intelligence layer** — AI responses cite a `guidanceSource` (CDC, AAP, WHO, etc.) rendered as tappable `GuidanceTag` pills. Copy is observer-voice ("Mateo tends to…"), never prescriptive.

**Warm palette** — 60/30/10 system: warm linen surfaces (`--surface-page/card/raised`), sage/trust-blue structure, terracotta-coral accents. No pure grays or default Tailwind semantics.

**Ankur brand** — `AnkurWordmark` component drops in anywhere. Primary surfaces: WelcomeSplash (splash/auth), ProfileComplete (onboarding close), ProfileSheet footer (settings-adjacent), home page footer. Brand tokens (`--brand`, `--brand-amber`, `.btn-brand`) available globally.

**RLS** — all tables have row-level security. Nannies can read everything, create memories/grocery items, update schedule. Parents have full write access. Cross-household isolation enforced at DB level.

## Deployment

Deployed to Vercel at `nanny-os-two.vercel.app`. Push to `main` auto-deploys.

```bash
git push origin main
```
