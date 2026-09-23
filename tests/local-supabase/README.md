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
It does not complete the release gate: synthetic Auth users, two-household
API/Storage tests and application smoke tests must follow. Production remains
unchanged. Restarting does not automatically apply edits to existing databases;
never use reset commands against a linked project.

To stop without deleting local data:

```bash
npx --yes supabase@2.117.0 stop --workdir tests/local-supabase/runtime
```
