# Vedic AI operations runbook

## Runtime monitoring

Configure these in the project dashboards before a public beta:

- **Vercel:** enable deployment notifications; review Function Logs for 5xx spikes, timeouts, 429s, failed OAuth callbacks, and errors in `/api/chat`, `/api/kundli`, `/api/saved-kundli`, and `/api/account`.
- **Supabase:** monitor Auth failures, database CPU/connections, storage, API errors, and database size. Alert on unusual Auth sign-up volume and query failures.
- **AI provider:** configure spend/budget alerts and inspect request/token usage. App request quotas are not a hard currency cap; provider billing alerts remain necessary.
- **External geocoding:** respect Nominatim's current usage policy; do not treat it as an unlimited production geocoder.
- **Health endpoint:** `/api/health` is a non-secret readiness snapshot. It does not test a real AI completion, OAuth login, database query, or astrology accuracy.

Never log full birth profiles, full chat content, provider keys, cookies, authorization headers, or raw IP addresses. Prefer request IDs, route, status, elapsed time, provider HTTP status, and hashed identifiers where necessary.

## Backups and recovery

1. Confirm the Supabase plan's database backup and point-in-time recovery options; document the retention window and actual restore capability.
2. Schedule an owner-reviewed backup/restore drill at least quarterly and before major schema changes.
3. Keep migrations in version control. Apply them to staging first, verify, then production.
4. Record which migration SHA/version was applied and keep a rollback/forward-fix plan. Do not blindly run destructive rollback SQL against user data.
5. Export a database backup using the supported Supabase procedure and store it encrypted with least-privilege access. Do not store production backups in the public GitHub repository.
6. Verify recovery by restoring to a separate staging project and checking RLS, Auth-linked records, report payloads, and conversation ownership.

## Data retention and deletion

- Publish a clear retention schedule before launch; do not promise automatic expiration until it is implemented.
- User-initiated saved-data deletion removes app rows; permanent account deletion uses the server-side Supabase Admin API and database foreign-key cascades.
- Deletion from Vedic AI does not guarantee immediate deletion of provider-side logs or backups; document applicable vendor retention terms and backup expiry.
- Review the configured AI provider, OpenStreetMap Nominatim use, Supabase, and Vercel terms/privacy documents before commercial release.

## Incident response

1. Triage severity, affected routes/data, first observed time, and the deployment SHA.
2. Rotate any exposed secret immediately in the provider dashboard and redeploy; never commit replacement keys.
3. If user data may be exposed, preserve sanitized logs, stop the affected route if needed, investigate RLS and ownership checks, and follow applicable notification obligations.
4. Roll forward with a reviewed fix, run the two-account security plan, and document the incident and prevention actions.

## Commercial launch gate

Do not announce production readiness until the following are evidenced: Google and email auth smoke tests, migrations applied, RLS two-account tests passed, durable rate limiting confirmed, AI provider budgets configured, calculation reference fixtures reviewed, accessibility checks run, backup restore drill completed, privacy/terms/contact details reviewed by qualified counsel, and all required third-party licences verified.
