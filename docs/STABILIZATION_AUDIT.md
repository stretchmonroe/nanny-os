# Stabilization audit

Date: 2026-09-18  
Baseline commit: `63ff249`

## Current state

- Production build: passes
- TypeScript: passes
- Dependency audit: 0 known vulnerabilities after upgrading Next.js and safe transitive fixes
- Lint: fails on legacy React hook rules, two unescaped strings, one explicit `any`, and several unused values
- Automated tests: local PostgreSQL invitation/AI/storage tests, photo-path validation, and isolated API-handler tests
- Local Supabase on user's Mac: migrations 001–004 and synthetic Auth/Storage HTTP smoke checks passed on 2026-09-23
- Production schema: user export reviewed; incompatible invitation assumptions confirmed and revised
- Rollout: see SCHEMA_ROLLOUT.md; production migrations and end-to-end verification pending

## Changes in this stabilization pass

1. Upgraded Next.js and `eslint-config-next` from 16.2.6 to 16.3.5.
2. Applied safe transitive dependency fixes; `npm audit` now reports zero vulnerabilities.
3. Bound caregiver invite claims to an outstanding invitation for the signed-in email instead of treating a household-code prefix as sufficient authorization.
4. Added an explicit household-membership check before a user can send push notifications for a child.
5. Added validation for push target roles, message fields, and internal notification URLs.
6. Replaced the scaffold README and documented required environment variables.

## Highest-priority remaining work

### P0 — Verify and reconcile the live Supabase schema

The live export confirms roles `parent | nanny`, a composite membership key, required user_id, and status. Membership id and invited_email do not exist. The revised implementation uses a separate invitation table and transactional server-only claim function. Neither migration has been applied to production. Staging verification remains required.

Acceptance criteria:

- One canonical role vocabulary is used in database constraints, RLS, APIs, and client types.
- Invitation columns and indexes are represented by versioned migrations.
- Existing memberships are migrated without losing household access.
- A fresh parent and invited caregiver can complete onboarding end to end.

### P0 — Make child-photo storage private

The production bucket remains public. Signed-photo rendering, safe object paths
and guarded migration 003 are now implemented on the draft branch. Live inventory
and staging HTTP checks are required before cutover; see SCHEMA_ROLLOUT.md.

Acceptance criteria:

- Anonymous requests cannot fetch a stored family photo.
- Members can access only photos belonging to their household.
- Upload, render, and deletion flows pass for parent and caregiver roles.

### P0 — Add authorization regression tests

Every service-role route needs tests proving that users cannot act on another household. Cover invite claiming, push sending/subscribing, profile updates, care-circle reads, setup, and together notes.

Both setup paths now share a guarded parent workflow. Regression tests cover
removed membership, caregiver rejection, parent retry and birth date handling.
Push registration validates subscriptions, denies removed members and preserves
existing subscriptions on failed writes. Push delivery and the other route-level
cases above remain open.

### P1 — Restore a green lint gate

Fix the current React hook lifecycle violations rather than disabling the rules globally. Then add CI requiring lint, typecheck, build, tests, and dependency audit.

### P1 — Consolidate privileged server access

Create a server-only data-access layer for environment validation, token verification, membership lookup, and safe DTOs. This removes duplicated service-role initialization and makes authorization consistent.

### P1 — Remove duplicate onboarding/setup paths

`/api/create-home` and `/api/setup` overlap but differ in defaults and membership status handling. Select one canonical workflow and migrate callers.

### P2 — Production readiness

- Add structured error reporting and privacy-safe observability.
- Add request throttling for AI, invite, upload, and push endpoints.
- Verify VAPID, Anthropic, Supabase, redirect URLs, and allowed origins in Vercel.
- Replace the placeholder upload route or remove it.
- Add backup/restore and data-retention guidance.

## Recommended sequence

1. Export and reconcile the live Supabase schema.
2. Add authorization tests around the current behavior.
3. Deploy the invitation and push authorization fixes.
4. Migrate photo storage from public to private.
5. Clear lint debt and install CI gates.
6. Resume feature development only after these controls are green.
