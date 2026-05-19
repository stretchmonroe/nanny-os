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
    home/           # Home screen — recommendation, activity plan, moments, timeline
    schedule/       # Day schedule with date picker, create/edit/delete activities
    memory/         # Journal — Today / This Week / Cherished + past day/week views
    lists/          # Grocery list with voice input and inline rename
    together/       # Parent–nanny collaboration feed
    care-circle/    # Care circle — members, pending invites, remove/resend/cancel
    onboarding/     # Household onboarding — signup → household → child → invite
    api/
      ai/           # Unified Claude handler (12 prompt types)
      upload/       # Supabase Storage photo upload
      care-circle/  # GET members+invites; POST remove-member, cancel-invite
      invites/      # POST lookup, accept, send
  components/
    brand/          # AnkurWordmark
    layout/         # BottomNav (glass pill), GlobalFAB (expandable action tray), GlobalNav
    home/           # ChildProfileHeader, RecommendationCard, ActivityPlan, TimelineFeed
    memory/         # TodayJournal (edit/delete), WeekView, FavoritesView, JournalSummary,
                    # DatePicker, AudioMoment, VoiceMemorySheet, WeeklyStory, MonthlyStory,
                    # MemoryHighlight, DevelopmentStory, OnThisDay, PhotoUploader
    schedule/       # ScheduleBlock (toggle/edit/delete + overflow menu)
    lists/          # SwipeableRow (swipe-delete + inline rename)
    onboarding/     # HouseholdFlow (parent + caregiver paths)
    profile/        # ProfileSheet
    shared/         # QuickCaptureSheet, ResearchSheet
    voice/          # VoiceRecorder, VoiceButton, VoiceInputModal
    ui/             # GuidanceTag, AuthorBadge
  hooks/
    useVoiceInput.ts
  lib/
    ai/             # callAI(), parseAIJson(), 12 prompt files, guidance registry
    data/demo.ts    # Full demo dataset — app works without Supabase
    voice/          # speechRecognition.ts, transcriptParser.ts
    adaptive-profile.ts
    supabase/       # client.ts, server.ts, moments.ts, reactions.ts, replies.ts,
                    # suggestions.ts, household.ts, activityLogs.ts
public/
  ankur-wordmark.png
supabase/
  setup.sql         # Full DDL — drops + recreates all tables + RLS
  invites.sql       # household_invites table + create_household_for_user/child/invite RPCs
  suggestions.sql   # suggestions + suggestion_replies tables
  seed.ts           # 7-layer TypeScript seed runner
  rls.sql           # Row Level Security policies (reference)
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

**Full CRUD** — all user-created content (journal entries, schedule activities, grocery items, photos, voice memories) supports create, edit, and delete. Optimistic updates throughout — UI changes immediately, Supabase write in background. Edit gestures: tap note text to edit inline, tap `⋯` for overflow menu (edit/delete) on journal cards and schedule blocks, tap grocery item text for inline rename.

**Household & invite system** — `HouseholdFlow` onboarding creates households + children via SECURITY DEFINER RPCs (bypasses RLS for new users). Caregivers join via email invite: parent sends invite → caregiver enters email during onboarding → `lookupInvite` (service_role bypass) finds the invite → caregiver signs up → `acceptInvite` adds them to `household_members`. All invite operations use server-side API routes with the service_role key; nothing invite-related goes through the anon client.

**Care circle API** — `/api/care-circle` enriches household members with display names via `admin.auth.admin.getUserById` (N+1, acceptable at beta scale). Remove and cancel-invite actions are parent-only, validated server-side.

## Deployment

Deployed to Vercel at `nanny-os-two.vercel.app`. Push to `main` auto-deploys.

```bash
git push origin main
```
