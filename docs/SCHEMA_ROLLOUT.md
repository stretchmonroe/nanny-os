# Schema reconciliation — 2026-09-18

Status (2026-09-24): all five migrations and local Auth/Storage HTTP smoke checks passed;
production untouched; PR remains draft.

## Photo implementation and remaining access requirement

Latest preflight reviewed (2026-09-19): 8 photos, zero unmapped paths, zero
missing owners; 6 active membership rows. This passes the exported photo
ownership guard; synthetic Storage HTTP checks also passed. Existing production
objects and a complete database copy still need release validation.

Live helper definitions confirmed missing status checks and unqualified search
paths. Migration 004 fixes them, denies ambiguous multiple-active-household
selection, restricts activity logs and push-subscription writes, and revokes
TRUNCATE/REFERENCES/TRIGGER from client roles on existing public tables.
Existing rows are unchanged. Grants alone do not prove a remotely exposed
TRUNCATE endpoint; removing those privileges is defense in depth.
Review default privileges separately before introducing future tables.

The isolated local fixture in tests/local-supabase/ applies migrations 001
through 005 in order under PGlite. The Docker-backed stack started successfully
on the user's Mac on 2026-09-23 with migrations 001–004. On 2026-09-24 the user
reset only the isolated local database and applied migration 005 as well. Its
guarded unique index prevents one user from holding two active memberships.
The Auth/Storage HTTP smoke check passed again after the reset:
invitation verification and replay, AI plan isolation, private photo access,
cross-household denial, removed-member denial and parent deletion passed.
See its README.
This generated fixture has no production rows, foreign keys, unseen functions
or triggers, so a staging copy or reviewed production backup is still needed
before release. Helpers now intentionally deny users with multiple active
memberships; migrations 004 and 005 abort before changes
if any already exist (the exported total of six memberships does not answer that
question). Resolve those accounts deliberately rather than choosing a household.
No further photo mapping export is needed for the current eight objects.

For a full-database staging rehearsal on the owner's Mac, first use the read-only
`bash scripts/backup-live-for-staging.sh` command from the audit branch. It
prompts privately for the **Nanny App** session-pooler URI and database password,
encoding special password characters automatically, and saves SQL files
in a restricted Downloads folder outside the repository. It does not link,
reset or migrate production. This is a database backup, not yet a staging
restore; Storage object bytes require a separate transfer. Keep the dump,
connection URI and log private. Migration rehearsal on the copied records
still needs review after the restore and managed-schema policy checks.

The owner's SQL export completed on 2026-09-24. Restore this private export to a
**database-only local copy** with
`bash scripts/restore-production-copy.sh "$HOME/Downloads/ankur-staging.XXXXXX"`,
using the actual folder printed by the backup command. The script starts a new
`ankur-production-copy` Docker database on port 56322 and refuses to overwrite
an existing local copy; it never uses a remote URL or a linked project. It
restores all three SQL files in one transaction and prints only counts for Auth
users, memberships, duplicate active users, photos and unmapped paths. Private
restore/check logs remain in the ignored production-staging runtime directory.
If restore fails, run `node scripts/diagnose-local-restore.mjs` from the same
checkout and share only its fixed-category `RESTORE_DIAGNOSIS` line. Do not
paste the SQL or full restore log. The script refuses to reuse an existing
copy; diagnose it before planning a safe fresh retry.
This is a copy for inspection, not a completed migration rehearsal. Database
dumps exclude custom policies/triggers on Supabase-managed auth/storage schemas;
the script reports the restored storage policy count to make that gap visible.
Photo bytes are not included. Review customizations against production before
replaying migration 003, and do not use the copied database to serve app traffic.

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

The read-only supabase/security-preflight.sql export has already been reviewed.
It contains helper definitions, grants and aggregate counts, not photo contents
or family records. A local Supabase rehearsal does not establish production
readiness: the multiple-active-membership guard and existing-photo Storage HTTP flows
need validation against a complete database copy. Production execution remains
blocked on that validation and explicit release review.

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

Both parent setup paths now share an active-parent check. They reject removed
members and caregivers before accessing children. Concurrent first-time home
creation is guarded by migration 005's active-membership unique index once
deployed. The API still requires a household-level transaction to make all
creation steps atomic and avoid partial retries.

Care Circle no longer selects nonexistent columns. Care Circle and push routes
require active memberships; push recipients must also be active members.
The UI now says registration, not email delivery: no mail provider is wired up.

The AI-plan migration replaces the two observed unrestricted policies with
active-household reads and active-parent inserts. NULL or unmatched child IDs
are denied, not deleted. AI child IDs are UUID while children IDs are text;
comparison casts to text without rewriting existing records.

## Test and release gate

1. Run npm test, npx tsc --noEmit, targeted ESLint, npm run build.
2. Back up the target database and rehearse all five migrations on a staging copy.
   Local tests use actual embedded PostgreSQL (PGlite), but do not reproduce
   all production RLS helper functions, Auth, concurrency, or application routes.
3. Inspect my_household_id(), my_role(), in_my_household() and table grants.
   Their definitions were absent from the export. Verify removed members cannot
   access other tables and all required client features have appropriate policies.
4. Apply migrations 001 through 005 in version order only after review/approval. These scripts
   expect the exported baseline and intentionally fail on unexpected existing
   objects. Do not blindly replay old rls.sql or infer an existing migration history.
5. Deploy application changes after the invitation migration. Test parent
   registration, verified caregiver join, wrong email/code, expiration, replay,
   removed members, Care Circle and push with two separate households.
6. Keep PR draft until staging smoke tests and privacy blockers are resolved.

## Still blocking full release

- Production photos remain public until guarded migration 003 is applied.
  Local synthetic HTTP tests pass; existing-photo behavior, production inventory
  and cache review remain required.
- Migration 004 restricts push-subscription client writes by active household
  and role. The server subscription route validates endpoint and keys, checks
  active membership and reports write failures; route regression tests pass.
  The delivery route tests active sender and recipient filtering; delivery to
  actual browser push services and rate limiting remain to be checked.
- Review the 27 policy-less tables against actual callers; do not grant all access.
- Rate limiting and full route-level authorization tests remain outstanding.
- Metadata proves neither row integrity nor successful end-to-end restoration.

## Recovery

All five migrations are transactional; 003 changes bucket privacy and policies,
004 changes access grants and policies, and 005 adds active-household uniqueness. A failure
inside either transaction rolls that migration back. After a successful rollout,
retain invitation rows and membership data; do not drop the invitation table or
restore broad AI policies as a casual rollback. Prefer a forward fix or temporarily
disable invitation actions. The older app already assumes nonexistent fields,
so deploying it alone is not a working invitation rollback.
