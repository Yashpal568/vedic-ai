# Security and Privacy Checklist

## Data handled

- Birth date, local birth time, birthplace, coordinates, timezone, and derived chart data can be highly personal.
- The chart endpoint processes submitted birth data to calculate a report. It does not intentionally persist that request.
- AI requests may send the supplied birth profile and calculated chart payload to the configured AI provider. Review the provider's terms, data handling, retention, and regional requirements before public release.
- Saved reports are stored in Supabase only after authentication. The database schema uses Row Level Security; test it rather than relying on policy names alone.

## Required before public launch

- [ ] Configure Supabase Auth email templates, site URL, and exact callback URLs.
- [ ] Test cross-account access for every table and route, including forged report IDs and conversation IDs.
- [ ] Add durable rate limiting at an edge/shared store for chat, geocoding, and chart calculation endpoints.
- [ ] Add per-account usage quotas, provider cost limits, abuse monitoring, and request timeouts.
- [ ] Add account deletion, birth-profile deletion, report deletion, data export, and retention policies.
- [ ] Decide whether birth data is included in AI requests and offer clear consent/disclosure.
- [ ] Keep AI keys and any service-role key server-only. Never put them in a `NEXT_PUBLIC_*` variable.
- [ ] Apply security headers, dependency scanning, secret scanning, and regular dependency updates.
- [ ] Review Nominatim's current usage policy and attribution requirements; public geocoding is not an unlimited production API.
- [ ] Run accessibility, penetration, RLS, and integration tests before launch.

## Current limits

This repository is an MVP implementation. The in-process Nominatim cache is not a durable rate limiter. Supabase policies and auth routes need deployment-specific verification. The calculation engine is not reference-chart validated. Do not store real users' sensitive data or charge for accuracy-critical readings until these checks are completed.
