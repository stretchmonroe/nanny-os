# Local Supabase rehearsal

Run from the checkout with Docker Desktop running and Node.js 24 LTS installed:

```bash
bash scripts/start-local-supabase.sh
```

No Supabase login, access token, link, db push or remote database URL is used.
The dedicated project ID is ankur-isolated-rehearsal; ports are 55320–55324.
Do not expose these local development services to an untrusted network.
Logs can include local development keys; do not post the complete log.

baseline.sql reconstructs the 38 public tables' columns, checks, indexes, policies
and three inspected helpers from the supplied metadata. It contains no user rows.
It deliberately omits foreign keys, unseen functions and triggers. It is a
migration/security fixture, not a production backup or a complete schema dump.
Migration files 001–007 run after this fixture on first startup. Migration 007
adds durable AI rate limits; local app rehearsal disables all AI calls, so its
existing browser accounts do not need that migration to keep testing.

If the app and its local test accounts already exist, apply only the additive
share-code migration while preserving the local data:

```bash
bash scripts/apply-local-join-codes.sh
```

It verifies the isolated project's ID, checks that it is not linked to a remote
project, and uses only its dedicated local Docker database. Running the script
again is safe. Restart the app after pulling the code; do not reset the local
database if you want to keep your test accounts.

If you already started this isolated stack before migration 005 was added,
refresh only its local database and rerun the Auth/Storage checks:

```bash
bash scripts/rehearse-local-supabase.sh
```

This clears the isolated local database and its test records. The script checks
the dedicated project ID, refuses a linked project and passes `--local` to the
Supabase CLI. It never resets the live Supabase project.

Successful startup validates migration application on the real local stack.
Run the Auth and Storage HTTP checks next, from the same checkout:

```bash
node scripts/smoke-local-supabase.mjs
```

This script reads local keys directly from the CLI status output without
printing them. It creates temporary synthetic users, two households and an
invitation, then checks the claim flow, AI plan policies, private photos,
cross-household access and removed-member access. It attempts to remove the
synthetic records at the end, including after a failed assertion. It refuses a
linked project or an API address other than localhost port 55321. Do not post
full logs or keys.

The HTTP smoke test still does not cover the running Next.js app or a complete
production database copy. Production remains unchanged. Restarting does not
automatically apply edits to existing databases; never use reset commands
against a linked project.

To stop without deleting local data:

```bash
npx --yes supabase@2.117.0 stop --workdir tests/local-supabase/runtime
```
