# Vedic AI — Your Personal Vedic Astrology Companion

Vedic AI is a chat-first web platform for exploring traditional Vedic astrology through a thoughtful, modern AI experience. It is designed to combine a premium conversational interface with structured birth-chart calculations, clear explanations, and a user-controlled personal astrology profile.

> **Project status:** Early development. The current repository establishes the product foundation and interface direction. Birth-chart calculations, AI provider integration, authentication, and persistent storage must be configured and validated before production use.

## Product vision

Create a polished, accessible web experience inspired by the simplicity of modern AI chat products and the depth of Vedic astrology. Users will be able to share birth details, generate a structured kundli, and ask follow-up questions without repeatedly entering the same context.

## Planned capabilities

- **Conversational AI astrologer** — chat-first workflow with conversation history and suggested questions.
- **Birth profile** — date, local birth time, birthplace, coordinates, and timezone with confirmation before calculation.
- **Vedic birth chart** — D1/Rashi chart, planetary longitudes, signs, houses, nakshatra and pada.
- **Dasha and divisional charts** — phased support for Vimshottari dasha, Navamsa (D9), Dashamsa (D10), and additional vargas.
- **Grounded interpretations** — AI explanations based on structured calculation output rather than invented planetary positions.
- **Reports and saved readings** — planned PDF export, user accounts, and saved kundlis.
- **Bilingual experience** — Hindi and English support planned.

## Technology direction

- **Web:** Next.js App Router, React, TypeScript
- **Styling:** Tailwind CSS with a custom premium design system
- **AI:** Provider abstraction for Gemini or OpenAI, called only from server-side routes
- **Data and auth:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Astrology calculations:** A dedicated, testable calculation engine with explicit sidereal/ayanamsha settings and a licensing review before commercial use
- **Deployment:** Vercel for the web app; any calculation service will be deployed separately if its runtime or licensing requires it

## Design principles

- Premium, calm visual language: midnight navy, warm ivory, muted antique gold, and restrained celestial motifs.
- Chat-first navigation with responsive sidebar and a focused conversation canvas.
- Clear distinction between calculated astronomical data and interpretive astrological content.
- Accessible contrast, keyboard-friendly controls, responsive layouts, and helpful empty/error states.
- Never expose API secrets in client-side code or commit real credentials.

## Getting started

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The initial interface can be explored without provider credentials. AI, database persistence, and verified chart calculations will remain unavailable until their respective environment variables and services are configured.

## Environment variables

See `.env.example`. Keep all private keys server-side. Never prefix secrets with `NEXT_PUBLIC_`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Important accuracy and licensing notes

Vedic AI is an informational and educational astrology product, not a substitute for professional medical, legal, financial, or mental-health advice. Predictions should not be presented as guaranteed facts. Birth time, timezone history, location coordinates, calculation settings, and engine version can affect results and should be recorded for reproducibility.

Before using Swiss Ephemeris or another ephemeris in a public or commercial service, review the applicable license and distribution terms. Do not ship an unverified calculation engine as production-accurate.

## Roadmap

1. Premium chat UI and accessible responsive shell.
2. Server-side AI provider adapter with rate limits and safe error handling.
3. Birth-profile form and location/timezone validation.
4. Calculation engine integration and reference-chart tests.
5. Supabase schema, authentication, and row-level access policies.
6. Dasha, divisional charts, report export, and deployment hardening.

## License

No license has been selected yet. Until a license is added, all rights are reserved by the repository owner. Review third-party dependencies and ephemeris licensing before public distribution.
