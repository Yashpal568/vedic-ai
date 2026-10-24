# Astrology accuracy and engine licensing decision

## Current implementation status

Vedic AI currently uses Astronomy Engine plus an approximate Lahiri ayanamsha and simplified mean lunar node calculations. Unit tests validate input/timezone invariants and output shape, but these are not independent accuracy validation. The current chart must not be advertised as professional-grade or commercial-grade Jyotish calculation.

## Why not silently swap engines

Independent Vedic calculation projects document Swiss Ephemeris as their astronomy engine, but licensing varies by integration. Some public projects use AGPL-3.0 and explicitly describe the source-disclosure/network-use obligations; Swiss Ephemeris also has a commercial licensing path. Do not copy AGPL engine code or add a network dependency without deciding whether Vedic AI will comply with the applicable license or buy an appropriate commercial license.

Research references (review current terms before deciding):
- [Official Swiss Ephemeris licensing overview](https://www.astro.com/swisseph/swephinfo_e.htm) — the vendor says developers must choose AGPL or a Professional License before distributing software or activating a public service.
- [Official Swiss Ephemeris price list](https://www.astro.com/swisseph/swephprice_e.htm) — currently lists the unlimited Professional Edition at CHF 700; confirm the live price and project terms before purchase.
- [Vedic-calc documentation and license](https://atolat.github.io/vedic-calc/)
- [Prajna Jyothi open-source license notes](https://jyothidecide.org/en/legal/licenses)
- [Morphemeris API documentation](https://docs.morphemeris.com/) — a metered Swiss-Ephemeris-based API; check pricing, terms, data handling, SLA, and commercial use before integrating.

## Required decision before accuracy work

Recommended for a closed-source commercial SaaS: **commercial engine license** — license Swiss Ephemeris for the intended product and deploy a pinned, tested server-side implementation. The official price list currently lists the unlimited Professional Edition at CHF 700, but confirm the current contract, project scope, and price with Astrodienst before purchase.

Alternative paths:
1. **AGPL-compatible product** — adopt an AGPL-compatible architecture and meet source, notice, and network-use obligations with legal review.
2. **Commercially suitable API** — choose a vendor after reviewing its contract, privacy terms, rate limits, costs, data location, uptime, and support. Add a server-side adapter; never call the vendor directly from the browser with a secret key.


Do not make this decision by copying another application's implementation. It affects source-code obligations, operating cost, uptime, and whether birth data leaves Vedic AI's own infrastructure.

## Accuracy acceptance criteria

After selecting the engine, generate and pin independent reference fixtures for multiple dates, locations, and edge cases. At minimum cover:
- Ascendant and planetary sidereal longitudes, signs, and retrograde flags.
- Lahiri ayanamsha and mean/true node convention.
- Historical timezone offsets and DST ambiguity/nonexistence.
- Nakshatra/pada boundaries, D9/Navamsa and D10/Dashamsa.
- Vimshottari dasha start/end boundaries.
- Panchang tithi, yoga, karana, and local weekday.
- Transits at an explicit timestamp and location.

Each fixture must record reference engine/version, ayanamsha, node convention, timezone database/version, tolerances, and the reference-generation method. Require CI to replay fixtures before releasing calculation changes. Do not label the calculations “validated” until those tests pass and a knowledgeable reviewer signs off on the Jyotish rule conventions.

## Safe release behavior

Until the reference suite passes:
- Clearly disclose that the calculation engine is experimental.
- Do not generate unsupported yogas, precise divisional-chart interpretations, or predictive certainty.
- Keep the AI grounded in the server-generated chart payload.
- Treat any new D9/D10, yoga, Panchang, and transit calculations as experimental and hidden from production-facing claims.
