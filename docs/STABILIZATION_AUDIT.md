# Stabilization audit

Date: 2026-09-18  
Baseline commit: `63ff249`

## Current state

- Production build: passes
- TypeScript: passes
- Dependency audit: 0 known vulnerabilities after upgrading Next.js and safe transitive fixes
- Lint: passes with no errors or warnings after correcting effect-driven state,
  child-specific loading snapshots, navigation and unused values
- Automated tests: 49 passing, including local PostgreSQL invitation/AI/storage,
  photo-path validation, and isolated API-handler tests
- Local Supabase on user's Mac: migrations 001–005 and synthetic Auth/Storage HTTP smoke checks passed on 2026-09-24
- Restored local copy of the Nanny App SQL export: migrations 001–005 passed on
  six Auth users, six active memberships and eight photo metadata rows; no
  duplicate active user memberships or unmapped photo paths; bucket private
  after migration. Production was not changed.
- Live read-only preflight: photos bucket remains public; eight photo metadata
  rows, six active memberships, zero users with multiple active households,
  three legacy photo policies with expected names, roles and exact expressions.
  The one managed-schema custom trigger is the Auth trigger named
  `auth.users:on_auth_user_created:public.handle_new_user`; review its body and
  live registration behavior. All eight existing photo objects returned image
  bytes from their public URLs; private signed-photo access remains untested.
- Restored signup function is `SECURITY DEFINER` with an explicit search path;
  its body mentions profiles but not household members, households or Storage
  directly. A live new-user test is still needed.
- Signup UI now shows email-confirmation instructions when account creation
  returns no session, with a sign-in path after verification.
- Isolated local Next.js app started and served onboarding/home; profile update
  and home setup routes returned 200. Parent created a child and saw it on Home.
  Caregiver testing exposed that signup previously redirected to Home, where a
  setup card could create another parent household. New accounts without a
  membership now open the create-or-join choice on Setup; Home offers that
  choice rather than a one-click parent setup. Caregiver claim remains to verify.
- Local app rehearsal exposed a dummy AI key reaching the external provider and
  receiving 401. The launcher and client now skip AI requests in local rehearsal;
  the server also rejects them, and no key prefix or provider body is logged.
- Caregiver onboarding now offers "I was invited" before signup, then requests
  a parent-generated 12-character share code and the caregiver's name before
  showing Home. Migration 006 adds an expiring, parent-rotatable code and a
  server-only claim RPC. Legacy email-registered claims remain compatible.
  PGlite invitation tests passed; the new migration and browser flow still
  need testing on the owner's isolated local Supabase database and then on a
  refreshed staging copy before any production rollout.
- True email-link invitations are not yet implemented: existing email
  registration did not send email. The planned link should carry a one-time
  random token bound to the invited email and expiry; after sign-in and email
  confirmation, the server should verify the token and email, consume the
  invitation atomically, then request the caregiver's name. Do not silently
  join merely because someone typed the invited email in an unverified account.
- AI route now verifies the bearer session and an active household membership
  before provider calls; anonymous and removed-member requests are denied.
- Migration 005 prevents concurrent active-household duplicates; PGlite and local Docker rehearsals passed
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

The live export confirms roles `parent | nanny`, a composite membership key, required user_id, and status. Membership id and invited_email do not exist. The revised implementation uses a separate invitation table and transactional server-only claim function. No migration has been applied to production. The local restored-row migration rehearsal and live legacy photo-policy expression comparison passed; the Auth signup hook and end-to-end flows remain open.

Acceptance criteria:

- One canonical role vocabulary is used in database constraints, RLS, APIs, and client types.
- Invitation columns and indexes are represented by versioned migrations.
- Existing memberships are migrated without losing household access.
- A fresh parent and invited caregiver can complete onboarding end to end.

### P0 — Make child-photo storage private

The production bucket remains public. Signed-photo rendering, safe object paths
and guarded migration 003 are now implemented on the draft branch. Live inventory
and public-byte availability checks passed for all eight photos; private
existing-photo HTTP flows require validation after cutover; see SCHEMA_ROLLOUT.md.

Acceptance criteria:

- Anonymous requests cannot fetch a stored family photo.
- Members can access only photos belonging to their household.
- Upload, render, and deletion flows pass for parent and caregiver roles.

### P0 — Add authorization regression tests

Every service-role route needs tests proving that users cannot act on another household. Cover invite claiming, push sending/subscribing, profile updates, care-circle reads, setup, and together notes.

Both setup paths now share a guarded parent workflow. Regression tests cover
removed membership, caregiver rejection, parent retry and birth date handling.
Push registration validates subscriptions, denies removed members and preserves
existing subscriptions on failed writes. Push delivery now has tests for
cross-household denial and active target-role recipients. Profile edits use the
verified identity and can create a missing profile; handoff notes reject users
outside the child's household and use the database role. Care Circle reads
scope active members and profiles to the verified household, and only an active
parent can create an invite. Complete live browser flows remain open.

### P0 — Restrict and meter AI requests

The earlier AI endpoint accepted unauthenticated calls. It now checks the
verified Supabase user and active household membership before sending a prompt,
bounds request and prompt size, and logs no API key prefix or provider response
body. Local development disables outbound AI; regression tests cover anonymous,
removed and active users. Add durable per-user rate limiting before production
exposes a paid AI key, and review input fields against child-level authorization.
The existing public production deployment may still run the older endpoint until
these application changes are deployed; the status of its AI key is unverified.

### P1 — Keep the lint and CI gates green

The full lint command passes without disabling the React rules. The draft branch
now runs lint, typecheck, build, tests and dependency audit in GitHub Actions.
The first hosted run passed. Live browser checks for
child switching, edit sheets, voice input and theme toggling are still needed.

### P1 — Consolidate privileged server access

Create a server-only data-access layer for environment validation, token verification, membership lookup, and safe DTOs. This removes duplicated service-role initialization and makes authorization consistent.

### P1 — Remove duplicate onboarding/setup paths

`/api/setup` now forwards its legacy card input to the guarded `/api/create-home`
workflow. Consolidate the UI caller later and remove the compatibility route
after verifying no deployed clients still use it.

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
5. Verify the CI run and UI changes in a browser.
6. Resume feature development only after these controls are green.
