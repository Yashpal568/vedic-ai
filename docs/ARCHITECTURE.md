# Architecture & Implementation Boundaries

## Current shape

The repository is a Next.js App Router application intended to deploy to Vercel.

- `app/page.tsx`: chat-first web interface and birth-detail form.
- `app/globals.css`: custom dark celestial design system and responsive layout.
- `app/api/chat/route.ts`: server-side Gemini/OpenAI adapter. Provider keys remain server-side.
- `supabase/migrations/`: initial PostgreSQL schema and Row Level Security policies.
- `.env.example`: documented environment variable names without real secrets.

## Request flow

1. The browser sends chat messages to `POST /api/chat`.
2. The route validates request shape and size with Zod.
3. The selected provider adapter calls Gemini or OpenAI from the server.
4. The system instruction prohibits fabricating chart placements without calculated chart JSON.
5. The response is returned to the browser.

## Astrology calculation boundary

The calculation engine is intentionally not yet implemented. Do not treat an LLM response as a source of astronomical positions. A production chart pipeline should:

1. Resolve a birthplace to latitude/longitude and an IANA timezone; require user confirmation where the match is ambiguous.
2. Convert the entered local birth time to a UTC instant using historical timezone rules.
3. Calculate planetary positions using a reviewed ephemeris library and explicit sidereal/ayanamsha settings.
4. Derive ascendant, whole-sign houses, nakshatra/pada, aspects, divisional charts, and dasha periods with unit tests.
5. Store the engine/version/settings alongside chart output so readings are reproducible.
6. Pass only structured calculated results to the AI interpretation layer.

## Security and production checklist

- Add durable per-user/per-IP rate limiting at an edge or shared store; serverless in-memory counters are not sufficient.
- Add auth and authorization before persisting private birth details or conversations.
- Keep provider keys and Supabase service-role credentials in server environment variables only.
- Enable and test RLS for every user-owned table; test cross-user access explicitly.
- Add input limits, provider timeouts, error sanitisation, usage quotas, and abuse monitoring.
- Add privacy/retention, export, and deletion flows for birth information.
- Review Swiss Ephemeris licensing before selecting it for a hosted/commercial product.
- Validate calculations against trusted reference charts before describing results as accurate.
- Add automated unit, integration, accessibility, and production-build checks.

## Environment

Copy `.env.example` to `.env.local` for local development. For Vercel, add the required variables in Project Settings → Environment Variables. Never commit `.env.local` or real API keys.
