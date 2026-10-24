# Product Specification — Vedic AI

## Product statement

Vedic AI is a web-first, chat-native Vedic astrology platform. It pairs the familiar conversational flow of modern AI assistants with structured Jyotish calculations and clear, user-friendly explanations. It is not a mobile app, an astrologer marketplace, or a generic prompt wrapper.

## Primary experience

1. A visitor opens a premium, uncluttered chat workspace.
2. They can ask general Jyotish questions or add a birth profile.
3. The profile captures name (optional), date, exact local birth time, and birthplace.
4. The system resolves location/timezone and asks the user to confirm ambiguous matches.
5. The calculation service produces a reproducible chart payload.
6. The AI explains the payload and supports follow-up questions using the same context.
7. Signed-in users can save profiles, conversations, and PDF reports after privacy controls are implemented.

## Core chart data

The chart payload should include:
- Calculation metadata: UTC instant, original local time, IANA timezone, coordinates, ayanamsha, zodiac and house system, engine name/version.
- Nine grahas: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
- Sidereal longitude and sign; retrograde/combust status only when the selected engine and definitions support it.
- Ascendant degree, lagna sign, whole-sign house assignment, and house lord.
- Nakshatra and pada for relevant points, with the selected nakshatra system documented.
- Planetary aspects/conjunctions and rule-based yoga flags, each tied to explicit rules.
- D1 chart first; D9, D10 and other vargas phased in with test fixtures.
- Vimshottari dasha periods with start/end instants and boundary conventions.
- Panchang values and transit data only after a tested implementation exists.

## AI behaviour

- AI can explain general Jyotish concepts even before the calculation engine is enabled.
- Personalised claims about a user's chart must cite the structured chart context supplied to the model.
- Never fabricate exact placements, dasha dates, doshas, or auspicious timings.
- Use cautious language and present interpretations as traditional beliefs rather than guarantees.
- Answer in Hindi or English based on the user's message/preference.
- For high-stakes medical, legal, financial, or mental-health questions, clarify that astrology is not professional advice.
- Provider calls must be server-side, validated, timed out, and subject to durable rate limits and usage quotas.

## UX and visual system

- Premium dark-first palette: near-black charcoal, warm ivory, muted antique gold, subtle sage status accent.
- Chat-first desktop layout with a collapsible conversation sidebar; responsive mobile web navigation.
- Message history, keyboard-friendly composer, suggested prompts, loading and error states.
- Birth details in a focused dialog with explicit local-time labeling and privacy note.
- Structured rich responses: chart cards, planet tables, nakshatra and dasha timelines, expandable explanations.
- Avoid visual clutter, excessive gradients, fake live data, and misleading claims of calculation accuracy.
- Meet accessible contrast and keyboard/focus expectations; respect reduced-motion preference.

## MVP boundaries

### In progress / scaffolded
- Next.js App Router, TypeScript, Tailwind CSS.
- Premium chat-first UI and responsive birth-detail form.
- Server-side Gemini/OpenAI provider adapter.
- Basic health endpoint and environment template.
- Initial Supabase relational schema with RLS policies.
- Project overview and architecture docs.

### Not yet production-ready
- Real ephemeris-backed kundli calculations.
- Birthplace geocoding and historical timezone resolution.
- Supabase authentication and persistence wired into UI.
- Durable rate limiting, quotas, abuse prevention, and observability.
- Calculation test suite and reference-chart validation.
- PDF report generation, subscriptions, matching, panchang, transits, and divisional charts.

## Acceptance criteria for first usable beta

- Users can chat with the configured server-side AI without exposing provider keys.
- Missing or invalid provider configuration produces a clear error.
- Birth details are validated and never mistaken for a calculated chart.
- No personal planetary position is shown until a calculation payload exists.
- Desktop and mobile web layouts remain usable at common viewport widths.
- RLS tests prove users cannot read or mutate another user's profiles, messages, or reports.
- Calculation fixtures match the chosen engine/settings and are versioned.
- Production build, lint, typecheck, and automated tests pass before release.
