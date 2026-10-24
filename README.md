# Vedic AI

**A premium, chat-first Vedic astrology web platform.** Explore Jyotish concepts, calculate a sidereal birth chart, and ask follow-up questions grounded in structured chart data.

> **Build status:** Active MVP development. The chart calculation pipeline, AI adapter, Supabase auth scaffolding, and report-saving endpoints are being implemented. Do not treat the early chart engine as a validated professional ephemeris until the included calculation method has been compared with trusted reference charts.

## Product

Vedic AI is designed as a web-only product with a calm, premium workspace inspired by modern AI chat interfaces. It is not a mobile app or an astrologer marketplace.

### Core experience

- Chat-first assistant with English/Hindi-aware system instructions and suggested prompts.
- Birth profile using date, exact local birth time, and selected birthplace.
- Birthplace search with coordinate selection and timezone lookup.
- Vedic sidereal chart using whole-sign houses and a Lahiri ayanamsha approximation.
- Nine grahas: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu.
- Ascendant, sign, degree, house, nakshatra/pada, Navamsa sign, retrograde estimate, and Vimshottari mahadasha timeline.
- AI answers grounded in the generated chart payload when an AI key is configured.
- Export calculated chart JSON and save reports to a signed-in Supabase account.
- Passwordless email sign-in scaffold using Supabase Auth.
- Responsive desktop and mobile-web interface, keyboard-friendly composer, markdown responses, and explicit accuracy/privacy notes.

## Tech stack

| Area | Technology |
| --- | --- |
| Web application | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS v4 with custom CSS design system |
| AI | Gemini or OpenAI, called from server routes only |
| Astrology | Astronomy Engine + sidereal conversion logic |
| Timezone | `tz-lookup` and IANA timezone conversion |
| Birthplace lookup | OpenStreetMap Nominatim (subject to its usage policy) |
| Auth and persistence | Supabase Auth, PostgreSQL, Row Level Security |
| Deployment target | Vercel |

## Quick start

**Requirements:** Node.js 20 or newer, npm, and (optionally) a Supabase project and an AI provider key.

1. Clone the repository and install packages.

   ```bash
   git clone https://github.com/Yashpal568/vedic-ai.git
   cd vedic-ai
   npm install
   ```

2. Create a local environment file.

   ```bash
   cp .env.example .env.local
   ```

3. Configure at least one AI provider if you want live assistant replies:

   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_server_side_key
   AI_MODEL=gemini-2.5-flash
   ```

   Or choose OpenAI:

   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_server_side_key
   AI_MODEL=gpt-4.1-mini
   ```

4. Start the development server.

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

Without an AI key, the chart calculation and JSON export can still be tried; AI responses show a configuration message. Supabase features require the public project URL/anon key, the migration below, and the correct Auth redirect URLs.

## Environment variables

See [`.env.example`](.env.example). Never commit `.env.local`, AI provider keys, or Supabase service-role keys. Only the public Supabase URL and anon key may use the `NEXT_PUBLIC_` prefix.

| Variable | Required for | Notes |
| --- | --- | --- |
| `AI_PROVIDER` | AI chat | `gemini` or `openai` |
| `GEMINI_API_KEY` | Gemini chat | Server-side secret |
| `OPENAI_API_KEY` | OpenAI chat | Server-side secret |
| `AI_MODEL` | Optional model override | Defaults depend on provider |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth and saved reports | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth and saved reports | Public anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Not used by the current routes | Keep server-only; never expose in browser |

## Supabase setup

1. Create a Supabase project.
2. Run [`supabase/migrations/202610240001_initial_schema.sql`](supabase/migrations/202610240001_initial_schema.sql) in the Supabase SQL Editor.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to local/Vercel environments.
4. In Supabase Auth URL configuration, allow the local callback `http://localhost:3000/auth/callback` and your production callback `https://YOUR_DOMAIN/auth/callback`.
5. Test sign-in, user isolation, saving a kundli, and report retrieval before production.

The migration enables Row Level Security. Re-run policy tests after any schema changes. The current UI saves a kundli report; full conversation-history sync is a subsequent implementation step.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | App/integration readiness snapshot |
| `/api/geocode` | POST | Search and return candidate birthplaces |
| `/api/kundli` | POST | Calculate chart payload from date/time/coordinates |
| `/api/chat` | POST | Validated Gemini/OpenAI chat completion |
| `/api/saved-kundli` | GET | List the signed-in user's saved reports |
| `/api/saved-kundli` | POST | Save a birth profile and chart report for the signed-in user |

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

GitHub Actions runs these checks on pushes and pull requests to `main`. A green run is required before describing the latest code as build-verified.

## Accuracy, privacy, and production boundaries

- The current engine uses Astronomy Engine, an approximate Lahiri ayanamsha formula, and a simplified mean-node formula. It is a calculation scaffold, not yet certified against an authoritative Jyotish ephemeris.
- Validate ascendant, planetary longitudes, historical timezone/DST cases, nakshatra/pada boundaries, Navamsa, and Vimshottari dasha boundaries against trusted reference charts before using it for paid readings.
- Review the Astronomy Engine and other dependency licences and suitability before commercial release. Do not assume astronomy accuracy alone makes Jyotish interpretation scientifically validated.
- Nominatim's public service has usage limits and attribution/policy requirements. For meaningful production traffic, use a compliant geocoding provider or self-hosted service; don't treat process-local caching as a durable rate limiter.
- Add durable edge/shared-store rate limiting, abuse controls, provider quotas, observability, backups, account deletion/export, retention controls, and accessibility/security testing before public launch.
- Birth details are sensitive personal data. The unauthenticated calculation endpoint processes them to produce a chart but does not intentionally persist them. Saving is only available through authenticated Supabase routes.
- Astrology is a cultural/traditional interpretive system, not a substitute for medical, legal, financial, or mental-health professionals.

## Project documentation

- [Product specification](docs/PRODUCT_SPEC.md)
- [Architecture and production boundaries](docs/ARCHITECTURE.md)
- [Supabase schema and RLS](supabase/migrations/202610240001_initial_schema.sql)

## Licence

No project-level open-source licence has been added yet. Do not assume the repository is open source for reuse until the owner chooses and adds a licence.
