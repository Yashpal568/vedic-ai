# Vedic-AI — End-to-End System Audit & Live Checklist

Last Updated: 2026-11-03 11:10 AM IST

## 1. System Overview & Architecture
* **Framework:** Next.js 15.5.28 (App Router), React 19, TypeScript
* **Styling:** CSS variables, Vanilla CSS, theme switching (`data-theme="dark"` / `data-theme="light"`), Lucide icons
* **Astrology Calculation Engine:** Astronomy Engine (Sidereal Zodiac, Lahiri Ayanamsha 23°51' offset)
* **AI Vision & Chat Providers:**
  * Vision: Groq (`qwen/qwen3.8-27b`) with automatic failover to Google Gemini (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`)
  * Chat: Google Gemini / Groq / OpenAI with 7-section structured prompts and real Kundli context injection
* **Database & Auth:** Supabase (optional for guest usage; required for cloud sync, private chat history, and saved Kundlis)
* **Production Deployment:** Vercel (`https://vedic-ai-psi.vercel.app/`)
* **CI/CD:** GitHub Actions (`quality.yml`)

---

## 2. Completed Features
- [x] **Sidereal Kundli Engine (`lib/astrology.ts`):** Calculates 9 planets (Sun through Ketu) with Lahiri Ayanamsha, houses 1-12, degrees, retrograde flags, and Nakshatras.
- [x] **Divisional Charts (`lib/vargas.ts`):** Calculates Navamsha (D9) and Dashamsha (D10).
- [x] **Vimshottari Dasha Engine (`lib/astrology.ts`):** Mahadashas and Antardashas based on Moon's longitude.
- [x] **Vedic Panchang (`app/panchang/page.tsx` & `app/api/panchang/route.ts`):** Computes Tithi, Nakshatra, Yoga, Karana, Sun/Moon signs, Sunrise, Sunset, Moonrise, Moonset, Rahu Kaal, Yamaganda, Gulika Kaal, Abhijit Muhurta.
- [x] **Palm Reading Frontend (`app/palm-reading/page.tsx`):**
  - [x] Real-time `getUserMedia` camera modal with rear-camera default (`facingMode: { ideal: "environment" }`).
  - [x] Camera flip button (switch between front/rear).
  - [x] Palm silhouette framing guide outline.
  - [x] Gallery file input with support for JPG, PNG, WebP, HEIC/HEIF.
  - [x] Client-side canvas compression down to 1920px JPEG under 5.2 MB.
  - [x] Image preview with preserved aspect ratio.
  - [x] Photo metadata badge (filename, size).
  - [x] Replace Photo and Remove Photo actions.
  - [x] Quality gate handling (requests sharper/brighter image if blurry or lines invisible).
- [x] **Palm Reading Backend (`app/api/palm-reading/route.ts`):**
  - [x] Fixed Groq model typo from non-existent `qwen/qwen3.6-27b` to `qwen/qwen3.8-27b`.
  - [x] Automatic model migration for retired or deprecated model IDs.
  - [x] Seamless cross-provider failover (Groq <-> Gemini).
  - [x] Multi-format upload handling (`multipart/form-data` and `application/json`).
  - [x] Structured 7-section analysis prompt.
- [x] **Kundli PDF Export (`lib/print-report.ts`):**
  - [x] Exact two-page A4 print layout (`@page { size: A4 portrait; margin: 8mm 10mm; }`, `max-width: 190mm`, `280mm` height).
  - [x] Page 1: Kundli at a glance, birth details, Ascendant, Moon sign, Sun sign, Nakshatra & Pada, diamond North Indian Janma Kundli SVG chart, chart reading guide, plain-language core personality & life patterns overview.
  - [x] Page 2: Compact 9-planet degrees table, Vimshottari Mahadasha + current Antardasha, Birth Panchang, and structured life area overviews (Career, Relationships, Finances, Personal Growth & Timing) in human-readable style.
  - [x] No left-side shrinkage, no horizontal clipping, exactly two A4 pages.
- [x] **Astrology Chat Quality & UI (`app/chat/page.tsx` & `app/api/chat/route.ts`):**
  - [x] Enforces 7 structured sections in plain everyday English without unexplained jargon.
  - [x] Real calculated chart context injection into AI prompts.
  - [x] `StructuredMessageView` styling headings as structured cards with badges.
  - [x] Retry turn action on assistant messages.
  - [x] Chat session persistence in `localStorage` (`vedic-active-chat-v2`).
- [x] **Responsive Navigation & Themes:**
  - [x] 6 viewports tested and verified (`360x800`, `390x844`, `430x932`, `768x1024`, `1366x768`, `1920x1080`).
  - [x] Fixed bottom navigation bar (`position: fixed; bottom: 0`) without input obstruction.
  - [x] Dark and Light mode toggles across all pages.

---

## 3. Bugs & Root Causes Identified
1. **Groq Vision 404 / 502 Bad Gateway:**
   - *Root Cause:* Configured model was `qwen/qwen3.6-27b` which was removed by Groq.
   - *Status:* **FIXED**. Migrated to active production model `qwen/qwen3.8-27b` with automatic fallback to Gemini.
2. **Kundli PDF Left-Side Shrink & Overflow:**
   - *Root Cause:* Conflicting screen media queries and 7 unbudgeted tables in Page 2.
   - *Status:* **FIXED**. Redesigned print layout with fixed A4 dimensions (`190mm x 280mm`) and strict 2-page pagination budget.
3. **PDF Test Silent Skipping in CI:**
   - *Root Cause:* Hardcoded Windows-only Chrome path `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"` in `test/pdf-export.test.ts`.
   - *Status:* **FIXED**. Implemented dynamic `findChromePath()` detecting Chrome on Windows, Ubuntu/Debian (`/usr/bin/google-chrome`), and macOS, and asserting that a Chromium binary exists rather than skipping.
4. **Chat Session Loss on Refresh:**
   - *Root Cause:* Guest chat state was strictly in-memory React state.
   - *Status:* **FIXED**. Added `vedic-active-chat-v2` `localStorage` caching with hydration.

---

## 4. Missing Integrations & Gaps Addressed
- [x] Multi-platform Chrome binary resolution for headless PDF generation in CI.
- [x] Automated comprehensive end-to-end browser workflow testing.
- [x] Cross-provider fallback between Groq and Gemini for vision analysis.
- [ ] Supabase Cloud Database (Note: Configured on production Vercel deployment; local dev runs in graceful guest mode when secrets are not present locally).

---

## 5. Security & Rate Limiting Audit
- [x] No secrets committed in source code or git history (verified via `git log -p` and `.gitignore`).
- [x] Service role key protected and never sent to browser bundle.
- [x] Bounded in-memory fallback rate limiting implemented when Supabase admin credentials are not active.
- [x] Row Level Security (RLS) queries in `app/api/` enforce `user_id = user.id`.
- [x] Input sanitization and payload size limits on file uploads (enforced max 5.2 MB JPEG compression on client, 6 MB limit on API).

---

## 6. Live Testing & Verification Checklist
- [x] Unit Tests: 30 passed (`npm test`).
- [x] Headless Chrome PDF Verification: Exactly 2 pages generated (`test/pdf-export.test.ts`).
- [x] TypeScript Typecheck: 0 errors (`npm run typecheck`).
- [x] ESLint: 0 errors (`npm run lint`).
- [x] Next.js Production Build: 17 static routes compiled (`npm run build`).
- [x] Live Browser Test Suite: 6/6 test suites passed against `https://vedic-ai-psi.vercel.app/`.
- [x] GitHub Actions CI: Runs #503 and #504 succeeded on `main`.
