# Vedic-AI — UI Reference Mapping & Stitch Compliance

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

## 2. Reference Mapping & Verification Matrix

| Ref # | Directory Path | Screen / Role | Target View / Device | Theme Mode | Implementation Status | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **#1** | `stich` (root) | **PDF Page 2 Focused Sheet** | Exported PDF Page 2 / Print | Print / Light Parchment | **PASS** | `lib/palm-print-report.ts` Section II Rekha & Parvata Interpretation, Maha Rekhas vector cards, Parvatas, Upaya remedies. Verified via `test/palm-pdf-export.test.ts`. |
| **#2** | `stitch_..._redesign (2)` | **Mobile Light Mode** | `/palm-reading` & `/chat` Mobile | **Light Mode** (Parchment & Warm Gold) | **PASS** | 430px container, `#FAF8F5` surface, `#8C631A` gold title, biometric scan plate, 10-point personalized report, 3-layer analysis, floating chat dock. |
| **#3** | `stitch_..._redesign (3)` | **Mobile Dark Mode** | `/palm-reading` & `/chat` Mobile | **Dark Mode** (Cosmic Obsidian & Gold) | **PASS** | 430px container, `#11131A` obsidian background, jade status beacon, gold title, glowing HUD coordinate pins, 10-point report, 3-layer analysis, bottom input dock. |
| **#4** | `stitch_..._redesign (4)` | **PDF Preview Ribbon & Scrubber** | Dossier Preview Modal | Dark / Preview Canvas | **PASS** | Interactive viewport controls ribbon, zoom controls, document pagination (P1 / P2). |
| **#5** | `stitch_..._redesign (5)` | **PDF Export Modal (3-Column Desktop)** | Desktop Export Dossier Dialog | Dark / Glassmorphic Modal | **PASS** | `components/dossier-preview-modal.tsx`: Fullscreen modal with A4 document preview on left, 3 texture selector cards (Vedic Parchment, Clean White, Cosmic Void), A4/US Letter switch, paper weight (120gsm / 80gsm), watermark toggle, and direct download/print. |
| **#6** | `stitch_..._redesign (6)` | **PDF Page 1 Master Reference** | Exported PDF Page 1 / Print | Print / Dark-Parchment Hybrid | **PASS** | Archival Jyotish Header Block, biometric scan plate HUD overlay with frame corner brackets, telemetry badges, mount strength barometers, personal coordinates. |
| **#7** | `stitch_..._redesign (7)` | **PDF Export Modal (Standard)** | Desktop Export Dossier Dialog | Dark / Glassmorphic Modal | **PASS** | Superseded and fully encompassed by Ref #5 implementation in `components/dossier-preview-modal.tsx`. |
| **#8** | `stitch_..._redesign (8)` | **Desktop Palm Profile (Standard)** | `/palm-reading` Desktop | Dark Mode | **PASS** | 5-col sticky analysis viewport and 7-col report stream. Implemented cleanly in `app/palm-reading/page.tsx`. |
| **#9** | `stitch_..._redesign (9)` | **Desktop Dark Mode Master** | `/palm-reading` & Main App Desktop | **Dark Mode** (Full Vedic Cosmic Luxury) | **PASS** | **280px left sidebar** (`w-72` / `w-[280px]`), New Consultation (⌘N), Workspaces, Saved Kundlis, Hastarekha, Panchang, Dasha; breadcrumbs; 5-col sticky biometric HUD & CV visualizer with SVG overlay lines; 7-col structured report stream. |
| **#10** | `stitch_..._redesign (10)` | **PDF Page 2 Master Reference** | Workspace PDF Preview & Export Page 2 | Workspace / Realistic Paper | **PASS** | Full workspace shell around Page 2: top header with zoom, pagination P1 / P2, breadcrumb, and full Page 2 A4 paper sheet with Maha Rekhas vector cards, Parvata mount grid, Karmic Harmonization & Upaya remedies. |

---

## 3. Responsive Breakpoint Matrix

| Viewport | Device Profile | Target Page | Layout Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **390px** | iPhone 12/13/14 | `/palm-reading`, `/chat` | Single column vertical stack, bottom navigation bar, floating input dock, drawer menu | **PASS** |
| **430px** | iPhone 14/15/16 Pro Max | `/palm-reading`, `/chat` | Full-width container with comfortable margins, biometric card, 10-point report | **PASS** |
| **768px** | iPad Mini / Tablet | `/palm-reading`, `/chat` | Tablet layout, responsive card grids, accessible touch targets | **PASS** |
| **1366px** | Standard Laptop | `/palm-reading`, `/chat` | 280px left sidebar, centered 1080px workspace, split 5-col/7-col layout | **PASS** |
| **1920px** | Desktop Full HD | `/palm-reading`, `/chat` | Wide desktop view, fixed 280px sidebar, luxury typography, full Dossier preview modal | **PASS** |
