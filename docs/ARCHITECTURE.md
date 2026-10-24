# Architecture & Implementation Boundaries

## Current shape

The repository is a Next.js App Router application intended to deploy to Vercel.

- `app/page.tsx`: chat-first web interface and birth-detail form.
- `app/globals.css`: custom dark celestial design system and responsive layout.
- `app/api/chat/route.ts`: server-side Gemini/OpenAI adapter with structured chart context. Provider keys remain server-side.
- `app/api/geocode/route.ts`: Nominatim birthplace candidate lookup.
- `app/api/kundli/route.ts`: validates birth inputs, resolves an IANA timezone from coordinates, and invokes the calculation engine.
- `lib/astrology.ts`: sidereal chart calculations, whole-sign houses, nakshatra/pada, Navamsa sign, mean lunar nodes, and Vimshottari scaffold.
- `app/login/` and `app/auth/callback/`: passwordless Supabase authentication.
- `app/api/saved-kundli/route.ts` and `app/reports/`: authenticated report persistence and private library.
- `lib/supabase/` and `middleware.ts`: server/browser clients and session refresh.
- `supabase/migrations/`: PostgreSQL schema and Row Level Security policies.
- `.env.example`: documented environment variable names without real secrets.

## Request flow

1. The browser sends chat messages to `POST /api/chat`.
2. The route validates request shape and size with Zod.
3. The selected provider adapter calls Gemini or OpenAI from the server.
4. The system instruction prohibits fabricating chart placements when no chart payload is present and asks the model to acknowledge the current engine limitations.
5. The response is returned to the browser.

## Astrology calculation boundary

An initial calculation engine is implemented in `lib/astrology.ts`, using Astronomy Engine with an approximate Lahiri ayanamsha, a simplified mean lunar node, and whole-sign houses. It is an MVP scaffold, not yet reference-chart validated. Do not treat an LLM response as a source of astronomical positions. Before production, the calculation pipeline must:

1. Resolve a birthplace to latitude/longitude and an IANA timezone; require user confirmation where the match is ambiguous.
2. Convert the entered local birth time to a UTC instant using historical timezone rules.
3. Calculate planetary positions using a reviewed ephemeris library and explicit sidereal/ayanamsha settings.
4. Derive ascendant, whole-sign houses, nakshatra/pada, aspects, divisional charts, and dasha periods with unit tests.
5. Store the engine/version/settings alongside chart output so readings are reproducible.
6. Pass only structured calculated results to the AI interpretation layer.

## Security and production checklist

- Add durable per-user/per-IP rate limiting at an edge or shared store; serverless in-memory counters are not sufficient.
- Authenticated report persistence is scaffolded; audit and test authorization before storing any private birth details or conversations.
- Keep provider keys and Supabase service-role credentials in server environment variables only.
- Enable and test RLS for every user-owned table; test cross-user access explicitly.
- Add input limits, provider timeouts, error sanitisation, usage quotas, and abuse monitoring.
- Add privacy/retention, export, and deletion flows for birth information.
- Review Swiss Ephemeris licensing before selecting it for a hosted/commercial product.
- Validate calculations against trusted reference charts before describing results as accurate; current unit tests check invariants and timezone conversion, not professional ephemeris accuracy.
- Add automated unit, integration, accessibility, and production-build checks.

## Environment

Copy `.env.example` to `.env.local` for local development. For Vercel, add the required variables in Project Settings → Environment Variables. Never commit `.env.local` or real API keys.
