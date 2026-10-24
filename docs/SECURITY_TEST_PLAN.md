# Vedic AI security verification plan

Run this plan against a non-production Supabase project first. Use two disposable accounts you control (Account A and Account B). Never use real customer data for the first pass.

## Required migrations and configuration

- [ ] Apply migrations 001, 002, 003, and 004 in order.
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` only in server-side Vercel environment variables; never prefix it with `NEXT_PUBLIC_`.
- [ ] Run `supabase/tests/rls_audit.sql` in the Supabase SQL Editor and confirm it completes without an exception.
- [ ] Configure Google OAuth by following [Google OAuth setup](./GOOGLE_OAUTH_SETUP.md).

## Two-account data-isolation test

1. Sign in as Account A. Create a birth profile, save a Kundli report, create a conversation, and save some context memory.
2. Record the report ID and conversation ID from the browser's own network responses. Do not share them publicly.
3. Sign out and sign in as Account B.
4. Verify Account B sees no Account A reports, conversations, birth profiles, or memory.
5. As Account B, send GET requests for Account A's conversation ID and report ID. Expect not-found/unauthorized behavior with no record contents.
6. As Account B, attempt DELETE against Account A's conversation/report IDs. Verify Account A's records still exist when you sign back in.
7. As Account B, attempt to POST a conversation with Account A's conversation ID and verify it is rejected.
8. Verify guest/unauthenticated requests cannot read saved reports, conversation details, or saved memory.
9. Verify Account A can read, update, and delete only its own records.
10. Check the database directly as an administrator to confirm each row's `user_id` is correct and RLS remains enabled.

Record test date, deployment SHA, test account labels (not email addresses), endpoint, expected result, actual result, and pass/fail. Do not mark this checklist complete until it is run on the target deployment.

## Rate limit and AI cost tests

- [ ] Apply migration 004 and set the server-only service-role key.
- [ ] Send requests from multiple app instances or repeated deployments and verify counters are shared.
- [ ] Verify unauthenticated traffic is limited by IP digest and signed-in AI traffic is limited to 12 requests/hour and 40/day per account.
- [ ] Verify an exceeded limit returns HTTP 429 and a `Retry-After` header.
- [ ] Verify no raw IP or user ID is stored in `rate_limit_buckets`.
- [ ] Configure budget/spend alerts at the AI provider; request quotas are not a monetary billing cap.
- [ ] Confirm no service-role key is present in built client assets, source maps, browser requests, or logs.

## Permanent account deletion

Use a disposable test account only.

- [ ] Sign in again within the previous 10 minutes.
- [ ] From the account memory panel, choose **Delete account permanently**.
- [ ] Enter exactly `DELETE MY ACCOUNT`.
- [ ] Verify the Auth user is removed and related profile, birth profiles, conversations, messages, reports, and memory cascade away.
- [ ] Verify the old session cannot access private APIs and the UI returns to the public home page.
- [ ] Verify an old session is rejected with a re-authentication instruction.
- [ ] Verify missing service-role configuration fails safely without claiming deletion succeeded.

## Authentication smoke test

- [ ] Google sign-in success, cancel/deny, invalid provider config, and expired OAuth state.
- [ ] Email magic-link sign-in, expiry, callback, refresh, logout, and session persistence.
- [ ] Verify redirects only go to allow-listed URLs.
- [ ] Test mobile Safari/Chrome and keyboard navigation.

## Release evidence

Save sanitized build logs, test results, the exact commit SHA, migration state, and a screenshot/video of critical flows. Do not include access tokens, cookies, API keys, birth details, or account emails.
