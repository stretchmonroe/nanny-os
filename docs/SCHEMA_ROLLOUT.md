# Schema reconciliation — 2026-09-18

Status (2026-09-19): invitation and photo privacy implementations prepared;
production untouched; PR remains draft.

## Photo implementation and remaining access requirement

PrivatePhoto now exchanges bucket-relative paths or this project's legacy public
URLs for five-minute signed URLs, refreshes them, and clears them on auth changes.
No fallback to public family-photo URLs is allowed. Explicit picsum demo images
remain supported. Private images bypass the Next optimizer and the Supabase host
has been removed from its allowlist; existing CDN/optimizer/browser cached copies
still require review at cutover. Already issued signed links last until expiry.

Uploads require a selected child, use random filenames, cap size at 10 MB and
allow JPEG/PNG/WebP/GIF. Persisted values are object paths, not signed links.
Existing objects and memory records are not rewritten.

Migration 003 installs active-household storage policies and makes photos private.
It fails transactionally on unknown storage policies, unsupported legacy paths,
or objects whose owner cannot be matched to the path's child's household.
This is intentional: do not guess ownership or skip the guard.

Before applying migrations, run the read-only supabase/security-preflight.sql
in the existing Supabase project and return its JSON output. It contains helper
definitions, grants and aggregate counts, not photo contents or family records.
This environment has no authenticated database access, so staging/production
execution and storage HTTP verification remain blocked on that access.

Deployment order: rehearse 001/002 in staging, deploy the signed-photo application,
then rehearse/apply guarded 003. Test existing photos and uploads with two
households, anonymous requests and removed members. Never deploy old photo clients
after cutover. Do not change the bucket manually as a substitute for the migration.

## Evidence and decisions

The user-provided metadata export contains 38 public tables, all with RLS enabled.
27 have no policies (client access fails closed; server-only usage must be traced).
Memberships have a composite user/household primary key, required user_id,
roles parent/nanny, and active/invited/removed status. They have no id or
invited_email. Existing invitation and Care Circle queries therefore drifted.

Pending invitations now live in household_invitations; existing memberships are
not rewritten. The existing eight-hex household code remains a lookup hint,
not a bearer secret. A claim also requires the matching confirmed email, an
unexpired unclaimed invitation, and an active issuing parent. The server-only
RPC inserts membership and consumes the invitation in one transaction. Removed
members cannot be silently reinstated. Expiry is seven days; resend/revoke UI is
not implemented. Duplicate/expired registrations currently return conflict and
require an administrator-reviewed renewal.

Care Circle no longer selects nonexistent columns. Care Circle and push routes
require active memberships; push recipients must also be active members.
The UI now says registration, not email delivery: no mail provider is wired up.

The AI-plan migration replaces the two observed unrestricted policies with
active-household reads and active-parent inserts. NULL or unmatched child IDs
are denied, not deleted. AI child IDs are UUID while children IDs are text;
comparison casts to text without rewriting existing records.

## Test and release gate

1. Run npm test, npx tsc --noEmit, targeted ESLint, npm run build.
2. Back up the target database and rehearse both migrations on a staging copy.
   Local tests use actual embedded PostgreSQL (PGlite), but do not reproduce
   all production RLS helper functions, Auth, concurrency, or application routes.
3. Inspect my_household_id(), my_role(), in_my_household() and table grants.
   Their definitions were absent from the export. Verify removed members cannot
   access other tables and all required client features have appropriate policies.
4. Apply 202609180001 then 202609180002 only after review/approval. These scripts
   expect the exported baseline and intentionally fail on unexpected existing
   objects. Do not blindly replay old rls.sql or infer an existing migration history.
5. Deploy application changes after the invitation migration. Test parent
   registration, verified caregiver join, wrong email/code, expiration, replay,
   removed members, Care Circle and push with two separate households.
6. Keep PR draft until staging smoke tests and privacy blockers are resolved.

## Still blocking full release

- Production photos remain public until guarded migration 003 is applied.
  Client compatibility and local policy tests are ready; actual object inventory,
  storage HTTP checks and cache review remain required.
- Audit push_subscriptions client policy: it only checks user_id, not household
  and role. Server delivery now intersects active membership, but direct client
  writes and subscription endpoint validation still need dedicated regression tests.
- Review the 27 policy-less tables against actual callers; do not grant all access.
- Rate limiting and full route-level authorization tests remain outstanding.
- Metadata proves neither row integrity nor successful end-to-end restoration.

## Recovery

Both migrations are transactional and additive/non-data-deleting. A failure
inside either transaction rolls that migration back. After a successful rollout,
retain invitation rows and membership data; do not drop the invitation table or
restore broad AI policies as a casual rollback. Prefer a forward fix or temporarily
disable invitation actions. The older app already assumes nonexistent fields,
so deploying it alone is not a working invitation rollback.
