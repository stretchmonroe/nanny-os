# Ankur

Ankur is a shared care workspace for parents and caregivers. It combines a daily schedule, journal and photos, household lists, care-circle membership, AI-assisted summaries, voice capture, and web push notifications.

## Stack

- Next.js 16 App Router with TypeScript
- React 19, Tailwind CSS 4, and Base UI/ShadCN components
- Supabase Auth, Postgres, Storage, and row-level security
- Anthropic API for optional AI-assisted plans and summaries
- Vercel deployment

The app has demo fallbacks for much of the UI, but authenticated household flows require Supabase configuration.

## Local setup

1. Install Node.js 20.9 or later.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env.local` and supply the required values.
4. Start the app with `npm run dev`.

Do not commit `.env.local` or any service-role, VAPID private, or Anthropic keys.

## Quality gates

```bash
npm run lint
npx tsc --noEmit
npm run build
npm audit
```

The production build and TypeScript checks pass. The full lint gate currently has legacy React-hook and cleanup debt; see `docs/STABILIZATION_AUDIT.md`.

## Data and authorization

Supabase setup assets live under `supabase/`. Server routes using the service-role key must explicitly authenticate and authorize every request because the service role bypasses RLS. Never trust a child ID, household ID, role, or invite code supplied by the client without checking it against the authenticated user.

## Project map

- `src/app/` — pages and server route handlers
- `src/components/` — product and design-system components
- `src/lib/` — Supabase, AI, push, voice, and utility modules
- `src/store/` — persisted client state
- `supabase/` — seed data and RLS definitions
- `progress.md` — historical feature inventory from the original build
- `docs/STABILIZATION_AUDIT.md` — current takeover findings and priorities

## Deployment

The live app is deployed on Vercel and redirects to `https://ankurcare.vercel.app`. Supabase project configuration and Vercel environment values must stay aligned. Validate authenticated flows in a non-production household before promoting authorization or schema changes.
# Schema stabilization status

Invitation/schema reconciliation is prepared on the draft stabilization PR, not
deployed. See [rollout and remaining blockers](docs/SCHEMA_ROLLOUT.md).
Run `npm test` for local PostgreSQL authorization regression tests.
