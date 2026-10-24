# Vedic AI

**A premium, chat-first Vedic astrology web platform.** Explore Jyotish concepts, calculate a sidereal birth chart, and ask follow-up questions grounded in structured chart data.

> **Build status:** MVP code and deployment documentation are in place. GitHub Actions checks cover lint, TypeScript, tests, and production build. External integrations (Supabase and an AI provider) must be configured in the deployment dashboard before account persistence and live AI replies work. The chart calculation engine is an early implementation and is not yet validated against a trusted professional ephemeris.

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
- Supabase Auth with Google OAuth and passwordless email sign-in.
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

3. Configure one AI provider if you want live assistant replies:

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

Without an AI key, chart calculation and JSON export can still be tried; AI responses will show a configuration message. Supabase features require the public project URL/key, the migration, and correct Auth redirect URLs.

## Environment variables

See [`.env.example`](.env.example). Never commit `.env.local`, AI provider keys, or Supabase service-role keys. Only the public Supabase URL and public anon/publishable key belong in `NEXT_PUBLIC_*` variables.

| Variable | Required for | Notes |
| --- | --- | --- |
| `AI_PROVIDER` | AI chat | `gemini` or `openai` |
| `GEMINI_API_KEY` | Gemini chat | Server-side secret |
| `OPENAI_API_KEY` | OpenAI chat | Server-side secret |
| `AI_MODEL` | Optional model override | Defaults depend on provider |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth and saved reports | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth and saved reports | Public anon/publishable key |
| `NEXT_PUBLIC_APP_URL` | Deployment configuration | Full app URL, e.g. `https://your-project.vercel.app` |

## Supabase setup

1. Create a Supabase project.
2. Run [the schema migration](supabase/migrations/202610240001_initial_schema.sql) in Supabase SQL Editor.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel environment variables.
4. In Supabase Auth URL configuration, set the Site URL to the production domain and allow `/auth/callback` for local and production sign-in.
5. Configure Google OAuth by following [the Google OAuth setup guide](docs/GOOGLE_OAUTH_SETUP.md) if you want the **Continue with Google** option enabled.
6. Test sign-in, account isolation, saving a kundli, and report retrieval before launch.

The migration enables Row Level Security. Do not disable RLS to fix a permissions error. Never expose a Supabase service-role/secret key to the browser.

## API routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | App/integration readiness snapshot |
| `/api/geocode` | POST | Search and return candidate birthplaces |
| `/api/kundli` | POST | Calculate chart payload from date/time/coordinates |
| `/api/chat` | POST | Validated Gemini/OpenAI chat completion |
| `/api/saved-kundli` | GET | List the signed-in user's saved reports |
| `/api/saved-kundli` | POST | Save a birth profile and chart report for the signed-in user |
| `/api/saved-kundli?id=...` | DELETE | Delete a saved report owned by the signed-in user |
| `/api/conversations` | GET/POST/DELETE | Load, save, and delete the signed-in user's chat history |

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs these checks on pushes and pull requests to `main`. Check the latest workflow before treating a commit as build-verified.

## Accuracy, privacy, and production boundaries

- The current engine uses Astronomy Engine, an approximate Lahiri ayanamsha formula, and a simplified mean-node formula. It is a calculation scaffold, not yet certified against an authoritative Jyotish ephemeris.
- Validate ascendant, planetary longitudes, historical timezone/DST cases, nakshatra/pada boundaries, Navamsa, and Vimshottari dasha boundaries against trusted reference charts before using it for paid readings.
- Review dependency licences and suitability before commercial release. Astronomy accuracy alone does not make Jyotish interpretation scientifically validated.
- Nominatim's public service has usage limits and attribution/policy requirements. For meaningful production traffic, use a compliant geocoding provider; do not treat process-local caching as durable rate limiting.
- Add durable shared-store/edge rate limiting, abuse controls, provider quotas, observability, backups, account deletion/export, retention controls, and accessibility/security testing before public launch.
- Birth details are sensitive personal data. The unauthenticated calculation endpoint processes them to produce a chart but does not intentionally persist them. Saving is available through authenticated Supabase routes.
- Astrology is a cultural/traditional interpretive system, not a substitute for medical, legal, financial, or mental-health professionals.

## Project documentation

- [Product specification](docs/PRODUCT_SPEC.md)
- [Architecture and production boundaries](docs/ARCHITECTURE.md)
- [Vercel deployment runbook](docs/DEPLOYMENT_VERCEL.md)
- [Google OAuth setup](docs/GOOGLE_OAUTH_SETUP.md)
- [Beta readiness checklist](docs/BETA_READINESS_CHECKLIST.md)
- [Security and privacy checklist](docs/SECURITY_AND_PRIVACY.md)
- [Privacy policy page](app/privacy/page.tsx)
- [Terms of use page](app/terms/page.tsx)
- [Supabase schema and RLS](supabase/migrations/202610240001_initial_schema.sql)

## Licence

No project-level open-source licence has been added yet. Do not assume the repository is open source for reuse until the owner chooses and adds a licence.
