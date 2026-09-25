# Ankur: remaining work

Status: 2026-09-25. Draft PR: https://github.com/stretchmonroe/nanny-os/pull/1

## Verified so far

- Local parent signup, child creation and caregiver signup with a parent-issued
  code completed in separate browser sessions. The caregiver saw the household.
- The owner applied migration 006 only to the isolated local Supabase project.
  The owner then refreshed the read-only backup and passed a separate local
  rehearsal of all seven migrations on six Auth users, six active memberships
  and eight photo metadata rows. Neither local app accounts nor production
  changed.
- All 56 automated tests, lint, production build and GitHub Actions passed at
  the current draft-branch head. Production schema and app are unchanged.

## 1. Complete the release rehearsal (blocking)

- Refreshed-copy rehearsal of **all seven** migrations passed. Immediately
  before any production release, take another backup and preflight to account
  for live changes since the rehearsal. Keep SQL and credentials private.
- Review the live `public.handle_new_user()` signup hook and confirm a genuine
  parent and caregiver signup behaves correctly in a safe test environment.
- Confirm Vercel Preview's Supabase target before creating Preview accounts;
  review service-role, Anthropic, redirect and push/VAPID configuration.
- Run real browser checks for private existing-photo rendering, upload,
  deletion, anonymous denial, removed caregiver denial and cross-household
  denial. Synthetic Storage checks already pass but did not copy photo bytes.
- Trace callers of the 27 policy-less public tables, check current helper
  functions and grants, and finish the remaining privileged route review.

## 2. Controlled production release (blocking)

- Agree on the coordinated application/database order for signed-photo clients
  and private-bucket migration 003 so existing photos do not break mid-release.
- Capture a fresh backup and live preflight, apply reviewed migrations 001–007
  and deploy the audited app under that plan. Keep paid AI disabled until
  migration 007 is active. The draft PR is not ready to merge until this gate.
- Verify both roles with separate households, all eight existing photo objects
  via signed URLs, invite-code expiration/rotation, push delivery and the AI
  quota behavior. Check that public photo URLs are denied after the bucket
  becomes private and monitor errors following the release.

## 3. Product and maintenance work after the safety gates

- Build true email invitations: deliver a single-use link bound to the invited
  address, verify the signed-in email before consuming it, then collect the
  caregiver's name. The current UI supports share codes; email is not sent.
- Consolidate the two home-setup UI/API paths, make parent home creation fully
  transactional, and simplify the older email-registration compatibility path.
- Verify child switching, editing, voice input, theme and real browser push;
  add privacy-safe error reporting and throttling for invite, upload and push.
- Trace AI input fields to the selected child and centralize service-role
  authorization. Maintain backup, restore and data-retention procedures.

**Next concrete action:** verify live managed photo-policy parity, image-byte
availability and the deployment environment, then prepare the coordinated
private-photo release order for review. The SQL export omits managed policy
customizations and Storage object bytes. No production write is authorized by
the rehearsal result.
