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
Migration files 001–004 run after this fixture on first startup.

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
