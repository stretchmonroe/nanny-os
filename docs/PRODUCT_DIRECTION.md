# Ankur: product direction hypothesis

Status: proposal, 2026-09-25. This is a decision framework, not a commitment to
ship new features. The safety and release gates in [REMAINING_WORK](REMAINING_WORK.md)
still apply. See [COMPETITIVE_LANDSCAPE](COMPETITIVE_LANDSCAPE.md) for competitors.

## Decision

Continue building for a short, focused validation period. Stop expanding the
generic feature list. Parent/nanny shared logs, photos, schedules, invite codes
and AI summaries are already advertised elsewhere. Daily Nanny includes AI day
summaries; Handoff advertises activity ideas, requests and translations; Nestly
advertises a shared grocery list. Do not claim to be the first at any of these.

## Hypothesis to test

A family with an in-home caregiver needs **a clear handoff and the next useful
action** with less work than a chat thread plus a baby tracker. The caregiver
should be able to share only the meaningful change; parents should see what
happened, what needs a decision and what tomorrow's caregiver needs to know.
The app must not turn daily care into constant reporting or surveillance.

This is a product hypothesis. Competitor pages do not establish that their
flows fail at it. Caregiver accounts online describe mixed feelings about
logging workload and micromanagement, but anecdotes are not market sizing:
https://www.reddit.com/r/Nanny/comments/1vnji5u/is_a_daily_nanny_log_normal_for_toddlers_or_is/

Example: “Toddler used the potty at the park; baby finished a bottle; diapers
are nearly gone.” A parent gets a quick view of the day, a suggested shopping
item and an optional update to tomorrow's outing instructions. The caregiver
can correct each suggestion, and the parent approves a routine change.

## Three candidate experiences

1. **A brief end-of-day handoff.** The caregiver can say or tap what changed,
   attach a photo, and skip categories that do not matter today. A parent sees
   a few concrete observations and questions. Use AI only to draft from actual
   entries, show what it used, and let the caregiver correct the result. Do
   not invent child-care facts or present medical advice as a conclusion.
2. **Turn a handoff into an action.** “Almost out of diapers” can become a
   shared shopping item; a requested schedule change can await parent approval;
   a changed routine can appear in tomorrow's instructions. Show who owns an
   action and whether it was done. Handoff already advertises supply requests,
   so the differentiator to test is the complete path from observation to a
   resolved household action, not the presence of a request button.
3. **A current child-care playbook.** Keep routines, preferences, contacts,
   allergies and pickup rules available to the right caregiver. Suggest updates
   based on repeated observations, but require a parent to approve a change and
   preserve its history. Competitors already store some of these facts; test
   whether connecting them to tomorrow's care actually saves coordination.

Adapt the capture to age: precise feeds/naps for an infant when useful;
highlights, exceptions and decisions for a toddler. Give the caregiver clear
quiet hours and a choice of which updates are necessary. Avoid default live
location tracking or activity scorecards.

## Validation before significant new build

- Interview both sides of 6–10 parent/caregiver pairs separately. Observe a
  normal handoff, their current messages/logs, a missed or repeated task, and
  what they would refuse to record. Ask about frequency, trust and payment.
- Prototype the three experiences with existing Ankur screens or a clickable
  mockup. Have the caregiver enter a real example and the parent act on it;
  compare with their current workflow. Do not collect real child records in an
  unapproved Preview environment: it currently points to production Supabase.
- After the privacy release gates, run a two-week opt-in pilot. Track paired
  usage, time to enter a handoff, parent actions completed, repeated questions,
  caregiver burden and whether either person returns without prompting.
- Proposed decision rule (to refine before testing): continue if most pairs
  independently prefer this handoff to their current process by week two and
  caregivers say the capture takes less effort. Rework if parents love the
  reports but caregivers experience extra work. Stop expanding the concept if
  both sides keep their existing tools after the trial.

Delay payroll, broad family calendars, generic chatbot features and a large
activity library until interviews show they drive this adoption. They are
already represented in the market and would spread the small team thin.
