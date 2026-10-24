# Vedic AI — Beta Readiness Checklist

Last reviewed: 2026-10-24

Status key: **Implemented (needs deployment verification)**, **Partial**, **Not started / blocked**. Code presence does not prove production security or correctness.

## P1 — Core product correctness

- [x] **Conversation persistence primitives** — authenticated conversation create/list/load/delete routes exist; messages are user-scoped. Migration 003 updates conversation recency when messages are inserted. Verify create → reload → load → delete on the deployed Supabase project.
- [x] **Editable cross-chat memory** — `/api/memory` supports read/update/delete and the chat UI provides an editable memory panel. The chat API reads memory only from the authenticated server session. Apply migration 002 and test across two sessions.
- [x] **Chart-grounded AI input** — the chat API recalculates the chart server-side from validated birth inputs and derives timezone from coordinates; client-supplied chart JSON is not trusted as the AI chart payload.
- [x] **DST nonexistent-time guard** — local date/time conversion now rejects a local time that fails exact timezone round-trip validation; tests cover a New York spring-forward gap and a valid post-transition time.
- [x] **Saved report primitives** — save/list/delete endpoints and an authenticated reports page exist. End-to-end deployment verification remains outstanding.
- [ ] **Reference-chart validation** — compare ascendant, planetary longitudes, Lahiri ayanamsha, and Rahu/Ketu against named, reproducible trusted reference fixtures. Do not claim validated accuracy until fixtures and tolerances are reviewed.
- [x] **Ambiguous DST fall-back times** — the calculation engine rejects repeated local wall times during a fall-back transition rather than silently choosing one instant; verify the UX presents the actionable error clearly in the deployed app.
- [ ] **Nakshatra/Navamsa/Dasha fixtures** — test exact boundary values, D9 placements, dasha start/end and date boundaries against independent reference calculations.
- [ ] **Chart-grounded AI regression tests** — add mocked-provider tests proving fabricated client chart values cannot influence answers, and that unsupported yogas/divisional charts are described as not computed.
- [ ] **Save/retrieve reports E2E** — sign in, save, refresh, verify reports page, delete, and verify removal.
- [ ] **Conversation ownership tests** — run two-account forged conversation/report/birth-profile ID tests against Supabase RLS and API routes.
- [ ] **Responsive/accessibility audit** — test keyboard-only navigation, visible focus, contrast, Hindi long messages, screen readers, loading/error states, and actual device sizes.

## P1 — Security, privacy, and cost

- [ ] **RLS audit with two real test accounts** — policy presence is not proof; execute read/write/update/delete and forged-ID tests for every table.
- [x] **Durable shared rate limits (code)** — migration 004 adds a service-role-only atomic Postgres RPC and the API helper hashes identities before storage. **Still blocked on applying migration 004, setting `SUPABASE_SERVICE_ROLE_KEY`, and verifying shared behavior on the deployed environment.** The process-local fallback is not production-grade.
- [x] **Per-user AI request quotas (code)** — signed-in chat is capped at 12 requests/hour and 40/day, and total submitted chat context is capped at 24,000 characters. **Still requires migration 004/service-role configuration and deployed verification.** Monetary spend alerts and concurrent in-flight request limits remain outstanding.
- [x] **Birth-data consent/disclosure** — birth details modal now explicitly requires consent before automatic AI interpretation and explains that details/chart are sent to the configured AI provider.
- [x] **Google OAuth UI and callback handling** — the login page now offers Google OAuth through Supabase and handles provider cancellation/errors. **Blocked on dashboard setup:** configure the Google provider credentials and exact redirect allow-list using `docs/GOOGLE_OAUTH_SETUP.md`, then verify on the deployed domain.
- [ ] **Retention policy and provider review** — define retention periods, deletion timing, AI provider terms, and geocoding provider policy.
- [x] **Personal-data export** — authenticated `GET /api/account-data` exports stored Vedic AI data as JSON.
- [x] **Delete saved personal data** — authenticated `DELETE /api/account-data` removes stored app data, subject to migrations/RLS. This does **not** delete the Supabase Auth account.
- [x] **Full auth-account deletion (code)** — `POST /api/account` requires a recent sign-in, exact confirmation phrase, same-origin request, rate limit, and server-only Supabase Admin API. **Still requires service-role configuration and disposable-account cascade/session tests.**
- [ ] **Secret/dependency scanning** — enable repository secret scanning and dependency alerts; review and remediate findings.
- [x] **Monitoring/backups/recovery runbook** — documented in `docs/OPERATIONS_RUNBOOK.md`. **Dashboard alerts, actual backup plan, and restore drill remain operator actions.**

## P2 — Features and production readiness

- [ ] **Google OAuth deployment verification** — code and setup guide are present; enable/configure the provider in Supabase and Google Cloud, add exact redirect allow-lists, and test success/cancel/session persistence on the deployed domain. This requires dashboard access.

- [x] **Printable report export** — chart/report pages open a print-ready report with browser `Print / Save as PDF`. A dedicated generated PDF file, Hindi font embedding, and page-break QA remain outstanding.
- [ ] **D9/D10 and other divisional charts** — do not mark complete until the ephemeris/license decision and independent reference fixtures are approved; see `docs/ASTROLOGY_ACCURACY_AND_LICENSING.md`.
- [ ] **Yoga rules** — implement deterministic rule definitions with cited Jyotish sources and false-positive/reference tests after the engine accuracy and rule-convention review.
- [ ] **Panchang/transits** — only after validated timezone/location/date calculations and explicit ayanamsha/astronomical conventions.
- [ ] **Subscriptions/paid access** — payment provider, server-side entitlements, refund and webhook verification.
- [ ] **SEO/legal** — metadata, sitemap, robots, canonical URLs, privacy/terms/contact pages reviewed for launch.
- [ ] **Automated end-to-end journey** — login → birth details → chart → AI → save → reload → delete. Print-to-PDF is implemented, but end-to-end browser tests are not yet executed.
- [ ] **Commercial release review** — dependencies, licenses/attribution, provider terms, privacy/legal requirements. Include the ephemeris engine decision before enabling advanced astrology features.

## Required Supabase migrations

Run in order in Supabase SQL Editor:

1. `supabase/migrations/202610240001_initial_schema.sql`
2. `supabase/migrations/202610240002_user_memory.sql`
3. `supabase/migrations/202610240003_persistence_security_hardening.sql`

## Important deployment caveats

- Guest chats are not persisted; sign in to save history and use persistent memory.
- Memory is explicit, user-editable text, not automatic extraction from all prior conversations.
- Data export/deletion endpoints require the migrations above and must be verified against the live project.
- Current in-process rate limiting is only a best-effort guard, not a production abuse-control system.
- The calculation engine remains approximate until independently validated.
- Never advertise public beta or commercial-grade astrology accuracy until the outstanding tests pass.
