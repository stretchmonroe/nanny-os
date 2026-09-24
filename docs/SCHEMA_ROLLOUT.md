# Schema reconciliation — 2026-09-18

Status (2026-09-24): migrations 001–005 passed on both the synthetic fixture
and the restored local SQL copy. The copied six Auth users, six active
memberships and eight photo metadata rows remained intact; no user had two
active memberships, no photo path was unmapped, and the local photos bucket
became private. Synthetic Auth/Storage HTTP smoke checks passed. Production
was untouched. All eight live photo objects returned image bytes from their
public URLs; PR remains draft.

## Release gate snapshot

| Gate | Result | Remaining action |
| --- | --- | --- |
| Migrations 001–005 on copied records | Passed locally; six users, six active memberships, eight photo metadata rows retained | Refresh the private backup before release |
| Existing photo policy baseline | Live names, roles and exact expressions match | Apply guarded migration 003 only after the signed-photo client is deployed |
| Existing photo objects | All eight publicly served image bytes | Test those objects using private signed URLs, and verify anonymous denial after cutover |
| Auth signup hook | Restored function present; direct reference to profiles, none to household membership or Storage | Review the function body and test a fresh parent/caregiver signup |
| App build | GitHub checks and Vercel preview deployment passed on the draft branch | Confirm Preview's Supabase project binding before entering test data; complete browser and push flows |
| AI endpoint | Now checks verified user and active membership; local rehearsal skips outbound AI | Add per-user rate limiting and confirm live AI key configuration before release |

The Vercel preview deployment is associated with the stabilization branch, but
its Supabase Preview environment has not been verified. The isolated restored
copy is database-only and cannot serve Auth or Storage to that deployment.
Do not use the preview to create test accounts until its database target is
confirmed as a non-production test project. Continue UI checks against an
isolated local full stack if Preview points at the live Nanny App project.
From the same checkout on the owner's Mac, run `npm ci` once if dependencies
are not installed, then `node scripts/run-app-with-local-supabase.mjs` with
the isolated Supabase stack running. The launcher refuses remote project links,
checks the expected local API on port 55321, overrides any inherited Supabase
environment with local keys, and serves the app at
`http://localhost:3000/onboarding`. It disables live AI and push credentials
and skips AI requests in the browser and server for this rehearsal. The owner's
first local run loaded onboarding/home and returned 200 for profile and setup;
its dummy AI key inadvertently reached the provider and got 401. The launcher
now leaves that key empty and disables outbound AI. Create throwaway local
parent and caregiver accounts,
complete setup and invite claiming in separate browser sessions, and exercise
photo upload/display and wrong-household access. Stop the app with Ctrl+C.
This UI run uses synthetic local data; it does not test the copied photo bytes
or the live Auth trigger.

## Photo implementation and remaining access requirement

Latest preflight reviewed (2026-09-24): 8 photos, zero unmapped paths, zero
missing owners; 6 active membership rows. This passes the exported photo
ownership guard; synthetic Storage HTTP checks also passed. A read-only check
fetched image bytes for all eight existing live objects from their public URLs.
Private signed-photo access and live browser behavior still need release validation.

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
The generated fixture has no production rows, foreign keys, unseen functions
or triggers. A restored SQL copy has now exercised the migrations against
copied production rows. Helpers intentionally deny users with multiple active
memberships; migrations 004 and 005 abort if any exist. The restored snapshot
had none. A later change to live memberships would require a fresh check.
No further photo mapping export is needed for the current eight objects.

For a full-database staging rehearsal on the owner's Mac, first use the read-only
`bash scripts/backup-live-for-staging.sh` command from the audit branch. It
prompts privately for the **Nanny App** session-pooler URI and database password,
encoding special password characters automatically, and saves SQL files
in a restricted Downloads folder outside the repository. It does not link,
reset or migrate production. Storage object bytes require a separate transfer.
Keep the dump, connection URI and log private. The SQL copy and local migration
rehearsal completed; the legacy photo-policy expressions were also verified live.

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
checkout and share only its fixed-category `RESTORE_DIAGNOSIS` and
`RESTORE_ERROR_TERMS` lines. Do not
paste the SQL or full restore log. The script refuses to reuse an existing
copy; diagnose it before planning a safe fresh retry.
If the first error is the known reserved-role restriction, use
`bash scripts/retry-local-restore-as-admin.sh "$HOME/Downloads/ankur-staging.XXXXXX"`
with the actual backup folder. The retry script checks that precise error,
requires the isolated local container and an empty app schema, and uses the
local `supabase_admin` superuser. It leaves production and the original backup
untouched. It refuses all other error types and repeated retries.
If this admin retry fails, run
`node scripts/diagnose-local-restore.mjs --retry "$HOME/Downloads/ankur-staging.XXXXXX"`
with the actual backup folder. Share only its `RESTORE_DIAGNOSIS` and
`RESTORE_ERROR_SHAPE` lines, plus `RESTORE_MISSING_RELATION` when present. The
output replaces row values with `[redacted]`, identifies which SQL file failed,
and prints the missing table name only for known Supabase/app schemas. Never
share the raw log.
When data restore stops on a managed table absent from the local Supabase
catalog (such as `auth.mfa_recovery_code_sets`), use
`node scripts/audit-backup-compatibility.mjs "$HOME/Downloads/ankur-staging.XXXXXX"`
with the actual backup folder to compare all `COPY` headers with the isolated
database and count rows in absent tables without printing their values. A
missing table with rows requires a compatible local schema; never discard its
records to get a passing rehearsal. Empty managed-table `COPY` blocks can be
omitted from a local-only rehearsal after all missing tables are identified;
the original backup remains complete.
The owner's compatibility audit found 38 public app tables absent only because
the failed transaction rolled back, and four newer, empty managed Auth tables
(`mfa_recovery_code_sets`, `mfa_recovery_codes`, `scim_tokens`, `scim_users`)
absent from the local image and schema export. No nonempty managed table is
missing. `bash scripts/restore-compatible-local-copy.sh "$HOME/Downloads/ankur-staging.XXXXXX"`
validates the current local catalog and `schema.sql` declarations, omits only
those four zero-row Auth COPY blocks in a private local-only file, and retries
the complete transactional restore as the local admin. This is a migration
rehearsal copy; it must not be used as an Auth service or as a full fidelity
managed-schema backup. Retain the untouched original SQL export.
After `LOCAL DATABASE COPY READY`, use
`bash scripts/rehearse-restored-production-copy.sh` from the same checkout to
apply 001–005 against the isolated copy. It guards the observed six users,
six active memberships, eight photos, expected public policy names and the
absence of active-membership duplicates. The platform SQL backup omitted
custom Storage policies, so the script creates the three photo policies from
the reviewed baseline **only locally** before migration 003 replaces them.
Each migration has its own private log; an unexpected baseline or migration
error stops the rehearsal. A successful run preserves copied row counts and
verifies that the photos bucket is private, but does not validate live policy
parity, existing object bytes or client application flows.
For a failure of that compatible retry, run
`node scripts/diagnose-local-restore.mjs --compatible "$HOME/Downloads/ankur-staging.XXXXXX"`
with the real folder. Share only the fixed diagnostic lines; `RESTORE_COPY_TARGET`
identifies the table in the private data file without exposing its rows.
If a backup `COPY` references an Auth/Storage column absent locally, use
`node scripts/audit-managed-column-drift.mjs "$HOME/Downloads/ankur-staging.XXXXXX"`
with the actual folder. This compares all managed-table COPY column names to
the isolated local catalog in one read-only pass and counts affected rows.
Do not add an unknown-typed column or omit nonempty Auth rows to bypass this
incompatibility; align the managed schema with the backup first.
The owner's audit found only `auth.one_time_tokens.expires_at` (zero rows) and
two columns in `storage.buckets` (two rows). Supabase Storage's upstream
`0068-bucket-lifecycle-configuration.sql` defines the bucket fields as `jsonb`
and `uuid`. Run
`bash scripts/restore-aligned-local-copy.sh "$HOME/Downloads/ankur-staging.XXXXXX"`
with the actual folder to omit the five empty Auth `COPY` blocks in a private
local-only file, add exactly those two Storage columns within the restore
transaction, and preserve the two bucket rows. This still does not reproduce
managed Auth/Storage triggers, policies or photo bytes; keep the original
backup intact.
The local copy passed the migration rehearsal. Database dumps exclude custom
policies/triggers on Supabase-managed auth/storage schemas; the three legacy
photo policies used for migration 003 were locally reconstructed from the
reviewed baseline. Photo bytes are not included. Verify the live managed
policies and existing-object behavior before a production cutover, and do not
use the copied database to serve app traffic.

The owner's live read-only preflight confirmed a public bucket, eight photo
metadata rows, six active memberships, zero duplicate active users and three
legacy policies with the expected names, roles and exact expressions. The one
custom managed-schema trigger is
`auth.users:on_auth_user_created:public.handle_new_user`. None of the five
migrations replaces it or writes to `auth.users`; it remains live but was not
recreated on the isolated copy. Review its function body and test actual new
user registration before release; the trigger name alone does not prove its
behavior. This check did not verify Storage bytes or actual access behavior.
Run `bash scripts/check-local-signup-hook.sh` from the updated checkout on the
owner's Mac. It reads the restored `public.handle_new_user()` definition and
prints only presence, security configuration and table-reference flags. It
does not print the function body or connect to production. Text-reference
flags cannot prove the full behavior of the trigger; a live new-user flow
remains necessary before release.
The owner's local check found the function present with `SECURITY DEFINER`
and an explicit search path. Its body mentions profiles but has no direct text
references to household members, households or Storage. This reduces the risk
of an immediate conflict with migrations 001–005; indirect calls and actual
registration behavior remain unverified.

On the owner's Mac, run `node scripts/check-live-photo-bytes.mjs` from the
updated checkout to check whether the eight metadata paths in the isolated
local copy still serve image bytes from the live **public** bucket. It makes
read-only, tiny-range HTTP requests without needing a password, does not save
images, and prints only aggregate counts. Share just `LIVE_PHOTO_BYTE_CHECK`.
The owner's check returned `expected=8 readable=8 missing=0 denied=0 other=0`.
Public-byte availability does not exercise private signed URLs or prove that
browsers have cleared cached public copies after a private cutover.

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
or family records. The restored local copy validated the active-membership
guard and photo-path ownership checks on copied metadata. Existing-photo
Storage HTTP flows with existing objects under private policies still require
end-to-end validation. The eight live objects are readable today, and legacy
policy definitions match. Production execution remains blocked on actual
private-photo behavior, Auth registration and explicit release review.

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
The sign-up screen now prompts users to confirm their email when Supabase
returns no session, with an explicit path to sign in afterward; it no longer
leaves that case on a perpetual setup screen.

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
   Completed on the isolated SQL copy on 2026-09-24; refresh the backup at release.
   Local tests use actual embedded PostgreSQL (PGlite), but do not reproduce
   all production RLS helper functions, Auth, concurrency, or application routes.
3. Inspect my_household_id(), my_role(), in_my_household() and table grants.
   Verify removed members cannot access other tables and all required client
   features have appropriate policies.
4. Apply migrations 001 through 005 in version order only after review/approval. These scripts
   expect the exported baseline and intentionally fail on unexpected existing
   objects. Do not blindly replay old rls.sql or infer an existing migration history.
5. Deploy application changes after the invitation migration. Test parent
   registration, verified caregiver join, wrong email/code, expiration, replay,
   removed members, Care Circle and push with two separate households.
6. Keep PR draft until staging smoke tests and privacy blockers are resolved.

## Still blocking full release

- Production photos remain public until guarded migration 003 is applied.
  Local synthetic HTTP tests, live metadata inventory and public image-byte
  checks pass; private existing-photo behavior and cache review remain required.
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
