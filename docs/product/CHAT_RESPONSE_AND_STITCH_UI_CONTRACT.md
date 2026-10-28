# Vedic AI Chat Response & UI Contract (LOCKED)

Status: Product reference / implementation contract
Source of truth: The two user-supplied Stitch HTML references:
- `vedic.ai_oracle_chat_ultra_luxury (1).html` — luxury cosmic/oracle visual direction
- `vedic.ai_high_tech_precision_chat.html` — high-tech precision/telemetry visual direction

These HTML files are design references, not production React components. Preserve their intended visual language while wiring every control to real Vedic AI functionality. Do not ship the sample astrology claims, sample user name, fake calculations, fake latency/accuracy labels, fake planetary placements, or demo responses as live user data.

## Locked response behaviour

Every user message, including `Hi`, greetings, follow-up questions, and suggested prompts, must go through the actual configured AI conversation endpoint. Do not return hardcoded/predefined astrology responses. Greeting-only messages may receive a natural greeting and ask what the user wants to explore; they must not invent a birth chart or personal reading.

For personalized astrology:
1. Ask for date of birth, exact local birth time, and birthplace (city/country) if missing.
2. Guest users must be offered an easy way to provide these details in-session. Do not pretend their profile/chart exists if it does not.
3. Validate inputs and calculate chart placements using a real deterministic astrology/ephemeris calculation layer before asking the language model to interpret them.
4. Pass the calculated chart context, relevant dasha/transit data, user question, and relevant conversation history to the AI provider.
5. Distinguish calculated astronomical/chart facts from traditional astrological interpretation. Never invent planetary placements, dashas, ayanamsha, transit aspects, chart images, dates, or certainty/probability claims.
6. If chart calculation or required data is unavailable, say so plainly and ask for missing information; do not fabricate a reading.
7. If provider fails, show a clear retry/error state. Do not silently substitute canned astrology text.
8. Astrology is a traditional interpretive system, not scientifically established prediction. Avoid guarantees about health, death, money, relationships, career outcomes, or exact future events.

## Response presentation contract

The AI response should be composed and rendered as structured, readable UI—not a raw Markdown dump or one giant paragraph. Use the user's actual question and available chart context to select relevant sections; do not force irrelevant sections into every reply.

Recommended structure when useful:
- Brief, natural opening that directly addresses the question.
- **Short answer / key takeaway**.
- **Chart factors used**: only verified calculated placements with sign/house/lord/dasha/transit as available.
- **Interpretation**: explain the traditional rule and connect it explicitly to the user's verified chart; label uncertain or missing data.
- **Practical reflection / next steps**: grounded, non-fatalistic suggestions.
- **Limitations / what is still needed** when personal chart data is absent.
- Optional relevant follow-up prompts.

Use visually distinct premium cards, compact metadata, clear headings, readable body copy, lists/tables only when useful, and restrained gold/indigo cosmic accents. Make the content responsive and accessible. Tables from model Markdown must be parsed/rendered as real tables or transformed to readable cards; do not show raw pipe-delimited Markdown.

## Design direction from Stitch references

### Oracle / luxury direction
- Dark cosmic background, subtle animated nebula glows, restrained gold/cream and indigo accents.
- Playfair Display-style editorial headings paired with Plus Jakarta Sans-style body typography.
- Ambient floating/pulsing effects, premium rounded cards, clear assistant identity.
- Rich response cards for chart factors, transits, remedies/reflections and action utilities where supported by real data.
- Compact suggested prompts and a bottom composer with attachment, microphone, and send controls.

### High-tech precision direction
- Deep charcoal/navy surfaces, gold and cool blue accents, Geist-style UI typography and JetBrains Mono-style metadata.
- A compact status/calibration strip only when values are real and verified.
- Clean conversation clusters, strong hierarchy, subtle telemetry-inspired metadata, compact quick-action cards.
- Desktop/mobile responsive header, chat history, composer, and bottom navigation.
- Never display fake labels such as "99.98% accuracy", "Swiss Ephemeris synchronized", "computed 12ms", or named engine/version unless the application actually measures and verifies them.

## Interaction and quality requirements
- All visible buttons and suggested prompts must work; no decorative dead controls.
- Keep conversation history visible and preserve context across turns where supported.
- Input supports keyboard Enter-to-send, multiline composition where appropriate, attachment upload, and voice dictation. Voice permissions/errors must be handled explicitly with a fallback to typing; don't claim the microphone works if browser permissions or SpeechRecognition are unavailable.
- Mobile safe-area insets, sticky/fixed composer that does not cover content, no horizontal overflow, and a polished desktop layout.
- Respect reduced-motion preferences and avoid animations that interfere with reading.
- Render generated/verified Kundli charts from real calculated placements; never use a static sample chart as the user's chart.
- Any palm-reading feature must inspect the uploaded image quality first. If unclear, request a clearer retake; describe palmistry as traditional/entertainment interpretation, not factual prediction.

## Acceptance checklist
- [ ] `Hi` reaches the live AI endpoint and returns a natural response; no canned demo response.
- [ ] Career/relationship/etc. prompts request missing birth data before claiming personal chart analysis.
- [ ] With birth details, chart calculator output is injected into the model context and can be traced to verified calculations.
- [ ] Missing/failed calculation or provider errors are transparent; no fabricated fallback answer.
- [ ] Markdown tables/lists render cleanly.
- [ ] Both mobile and desktop match the premium Stitch design direction.
- [ ] Voice, upload, send, copy/save/share, history, profile, and navigation controls work or are hidden until implemented.
- [ ] No fake planetary facts, accuracy metrics, engine status, or sample names leak into production.

This contract is intentionally locked as the design/behaviour reference. Changes require an explicit product decision; implementation must preserve the contract while adapting the HTML mockups into the existing Next.js app, components, authentication, data model, and API routes.
