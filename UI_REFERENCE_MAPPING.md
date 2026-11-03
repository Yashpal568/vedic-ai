# Vedic-AI — UI Reference Mapping

This document maps all 10 approved Stitch visual references to their corresponding application views, layout roles, devices, and theme modes under the **Vedic Cosmic Luxury** design system.

---

## 1. Master Design System Specifications: "Vedic Cosmic Luxury"

- **Foundational Aesthetic:** Glassmorphic Mysticism with Refined Celestial Minimalism.
- **Typography:**
  - **Headings & Titles:** `Playfair Display` (font weights 600, 700; uppercase tracking for sacred titles).
  - **Body, UI & Telemetry:** `Plus Jakarta Sans` (font weights 400, 500, 600, 700; 8pt grid baseline).
  - **Monospace Coordinates & Telemetry:** Monospace (degrees, minutes, ephemeris reference codes).
- **Dark Mode Palette:**
  - Primary Canvas / Cosmic Void: `#0A0C13` / `#11131A`
  - Surface Low (Sidebar / Panels): `#191B23` / `rgba(17, 20, 32, 0.85)`
  - Elevated Container / Cards: `#1D1F27` / `rgba(23, 27, 43, 0.6)`
  - Surface Container Highest: `#33343C`
  - Celestial Gold (Primary Action / Accents): `#E5C46B` (Highlights: `#FFE192`, `#F6D77D`)
  - Astral Jade (Active Indicators / Live Beacons): `#52FEB8` / `#56FFB9`
  - Borders & Hairlines: `rgba(255, 255, 255, 0.08)` to `rgba(229, 196, 107, 0.25)`
- **Light Mode Palette:**
  - Canvas / Outer Background: `#F4F0EA`
  - Card & Container Surface: `#FAF8F5` / `#FFFFFF`
  - Elevated Parchment: `#F5EFE3` / `#F4ECE0`
  - Text Primary: `#1E2229` (Deep Charcoal)
  - Text Secondary / Muted: `#4A5060` / `#5C6170`
  - Brand Gold (Light): `#8C631A` / `#C59A53` / `#C89A38`
  - Borders: `#E8DFD1` / `#DFCBB0`

---

## 2. Reference Mapping Matrix

| Ref # | Directory Path | Screen / Role | Target View / Device | Theme Mode | Key Architectural Features |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **#1** | `stich` (root) | **PDF Page 2 Focused Sheet** | Exported PDF Page 2 / Print | Print / Light Parchment | Section II: Comprehensive Rekha & Parvata Interpretation, Maha Rekhas vector cards, Parvatas, Upaya karmic remedies, Sanskrit ephemeris tags. |
| **#2** | `stitch_..._redesign (2)` | **Mobile Light Mode** | `/palm-reading` & `/chat` Mobile | **Light Mode** (Parchment & Warm Gold) | 430px iOS container, `#FAF8F5` surface, `#8C631A` gold title, biometric scan plate with reticle, 10-point personalized report, 3-layer analysis, floating scroll button, floating bottom input dock. |
| **#3** | `stitch_..._redesign (3)` | **Mobile Dark Mode** | `/palm-reading` & `/chat` Mobile | **Dark Mode** (Cosmic Obsidian & Celestial Gold) | 430px iOS container, `#11131A` obsidian background, jade status beacon (`#52FEB8`), gold title, glowing HUD coordinate pins (Heart, Head, Life lines), 10-point report, 3-layer analysis, bottom input dock. |
| **#4** | `stitch_..._redesign (4)` | **PDF Preview Ribbon & Scrubber** | `/kundli/print` or Dossier modal | Dark / Preview Canvas | Interactive viewport controls ribbon, zoom bar, document scrubber thumbnail tray (P1, P2, P3, P4). |
| **#5** | `stitch_..._redesign (5)` | **PDF Export Modal (3-Column Desktop)** | Desktop Export Dossier Dialog | Dark / Glassmorphic Modal | Fullscreen modal with realistic A4 document preview on left, 3 texture selector cards (Vedic Parchment, Clean White, Cosmic Void), A4/US Letter switch, archival seal stamp, paper weight selector. |
| **#6** | `stitch_..._redesign (6)` | **PDF Page 1 Master Reference** | Exported PDF Page 1 / Print | Print / Dark-Parchment Hybrid | Archival Jyotish Header Block, biometric scan plate HUD overlay with frame corner brackets, Sanskrit telemetry badges, quantitative mount strength barometers, personal planetary coordinates. |
| **#7** | `stitch_..._redesign (7)` | **PDF Export Modal (Standard)** | Desktop Export Dossier Dialog | Dark / Glassmorphic Modal | Variant of #5 without the multi-texture cards; superseded by #5. |
| **#8** | `stitch_..._redesign (8)` | **Desktop Palm Profile (Standard)** | `/palm-reading` Desktop | Dark Mode | 5-col sticky analysis viewport and 7-col report stream. Intermediate iteration of #9. |
| **#9** | `stitch_..._redesign (9)` | **Desktop Dark Mode Master** | `/palm-reading` & Main App Desktop | **Dark Mode** (Full Vedic Cosmic Luxury) | **280px left sidebar** (`w-72`), New Consultation (⌘N), Workspaces, Saved Kundlis, Hastarekha, Panchang, Dasha; breadcrumbs; 5-col sticky biometric HUD & CV visualizer with SVG overlay lines; 7-col structured report stream. |
| **#10** | `stitch_..._redesign (10)` | **PDF Page 2 Master Reference** | Workspace PDF Preview & Export Page 2 | Workspace / Realistic Paper | Full workspace shell around Page 2: top header with zoom, pagination P1 / P2, breadcrumb, and full Page 2 A4 paper sheet with Maha Rekhas vector cards, Parvata mount grid, Karmic Harmonization & Upaya remedies. |

---

## 3. Screen-by-Screen Implementation Plan

### Screen 1: Master Application Shell (Desktop & Mobile)
- **Desktop Sidebar:** 280px (`w-72` / `w-[280px]`), anchored left, backdrop-blur-2xl, `#191B23` (dark) / `#FAF8F5` (light).
- **Navigation Items:** New Consultation (`⌘N`), Workspaces, Saved Kundlis, Palm Reading (Hastarekha), Panchang, Astrology Chat, Profile, Theme Switcher.
- **Mobile Drawer:** Slide-in drawer with hamburger menu on top bar, plus sticky bottom navigation dock.
- **Typography & Font Tokens:** Configure Google Fonts `Playfair Display` and `Plus Jakarta Sans` in `app/layout.tsx` and `tailwind.config.ts`.

### Screen 2: Palm Reading & Astrology Report Stream (Desktop & Mobile)
- **Biometric Scan Plate & HUD:**
  - Real palm photo preview with corner brackets, pulsing live scan beacon, AI Biometrics pill, and hand classification tag.
  - Interactive/visualized glowing coordinate pins for Major Lines (Heart Line, Head Line, Life Line).
  - Retake / Replace photo button.
- **Section A: Personalized Report List:** 10 structured cards with gold left-accent border, category title, and clear plain-language findings.
- **Section B: Three-Layer Analytical Framework:**
  - Layer 1: Palm Structure (Shape, fingers, thumb, spacing, mounts).
  - Layer 2: Major Lines (Heart, Head, Life, Fate).
  - Layer 3: Traditional Symbolic Interpretation (Emotions, intellect, tendencies, career, strengths & challenges).
- **Remedies & Karmic Harmonization (Upaya):** Mantras, gemstones, behavioral guidance.
- **Floating Input Dock:** Clean conversational input bar with camera/photo upload, voice input, and prompt dispatch.

### Screen 3: PDF Preview & Export Modal
- **Desktop Composition (3-Column Layout from Ref #5):**
  - Left: Interactive A4 preview sheet with realistic drop shadow, deckled edge, and zoom controls.
  - Right: Configuration panel with:
    - Document format (A4 / US Letter).
    - Texture selector (Vedic Parchment, Clean White / Printer-Friendly, Cosmic Void).
    - Archival seal & watermark toggle.
    - Export button generating real A4 PDF.
- **Exported 2-Page A4 PDF Structure (Ref #6 & #10):**
  - Page 1: Archival Jyotish header, biometric palm plate with coordinates, mount strength barometers, core astrological reading.
  - Page 2: Section II Comprehensive Rekha & Parvata Interpretation, Maha Rekhas vector cards, planetary mounts grid, Upaya remedies, and sacred ephemeris stamp.

---

## 4. Verification Criteria
1. Full responsiveness tested at `375px`, `390px`, `768px`, `1366px`, and `1920px`.
2. Seamless theme switching between Dark Mode (`#11131A` / `#0A0C13`) and Light Mode (`#F4F0EA` / `#FAF8F5`).
3. Real AI backend connectivity (Groq + Gemini vision fallback) feeding actual user palm images into the approved report design.
4. Exported PDF matching the preview with exact 2-page A4 dimensions without text clipping or overflowing.
5. All CI checks (Lint, Typecheck, 39 Vitest tests, Next.js build) green.

