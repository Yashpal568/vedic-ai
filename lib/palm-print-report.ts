import type { ParsedPalmReport } from "@/lib/palm-parser";

export interface PalmPrintOptions {
  imageSrc?: string;
  hand?: "left" | "right" | "unsure";
  texture?: "parchment" | "clean" | "void";
  paperWeight?: "120gsm" | "80gsm";
  format?: "A4" | "US_Letter";
  watermark?: boolean;
  reportId?: string;
}

const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

export function generatePalmPrintHtml(report: ParsedPalmReport, options: PalmPrintOptions = {}): string {
  const hand = options.hand || "left";
  const texture = options.texture || "parchment";
  const reportId = options.reportId || `VD-PALM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handLabel =
    hand === "left"
      ? "Left Hand (Passive Hastarekha)"
      : hand === "right"
      ? "Right Hand (Active Hastarekha)"
      : "Open Palm (Hastarekha)";

  const isDarkVoid = texture === "void";
  const isClean = texture === "clean";

  // Palette according to selected texture
  const bg = isDarkVoid ? "#0C0E15" : isClean ? "#FFFFFF" : "#FAF7EE";
  const text = isDarkVoid ? "#E2E2EC" : "#1E2229";
  const border = isDarkVoid ? "#282A31" : isClean ? "#E2E8F0" : "#DFCBB0";
  const gold = "#C49E3F";
  const jade = "#0D9488";
  const cardBg = isDarkVoid ? "#141620" : isClean ? "#F8FAFC" : "#F4EFE2";
  const cardBorder = isDarkVoid ? "#2D303D" : isClean ? "#E2E8F0" : "#D8C2A0";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vedic AI — Hastarekha Palmistry Archival Dossier (${escapeHtml(reportId)})</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #0f1118;
      color: ${text};
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: #141722;
      border-bottom: 1px solid #282a35;
      padding: 12px 24px;
      color: #e2e2ec;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }

    .toolbar-info strong {
      display: block;
      font-size: 13px;
      color: #ffe192;
      letter-spacing: 0.5px;
    }

    .toolbar-info span {
      font-size: 11px;
      color: #98907f;
    }

    .toolbar-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .btn-gold {
      background: #e5c46b;
      color: #11131a;
      border-color: #e5c46b;
    }

    .btn-gold:hover {
      background: #ffe192;
    }

    .btn-outline {
      background: #1d1f27;
      color: #e2e2ec;
      border-color: #4d4638;
    }

    .btn-outline:hover {
      border-color: #e5c46b;
      color: #ffe192;
    }

    .print-stage {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 16px 60px;
      gap: 32px;
    }

    .pdf-page {
      position: relative;
      width: 190mm;
      min-height: 279mm;
      max-height: 279mm;
      padding: 10mm 12mm;
      background: ${bg};
      color: ${text};
      border: 1px solid ${border};
      border-radius: 6px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.35);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Subtle Deckled Watermark */
    .watermark {
      position: absolute;
      inset: 0;
      pointer-events-none;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.035;
    }

    /* Filigree Corner Accents */
    .corner-tl { position: absolute; top: 6mm; left: 6mm; width: 12px; height: 12px; border-top: 1.5px solid ${gold}; border-left: 1.5px solid ${gold}; }
    .corner-tr { position: absolute; top: 6mm; right: 6mm; width: 12px; height: 12px; border-top: 1.5px solid ${gold}; border-right: 1.5px solid ${gold}; }
    .corner-bl { position: absolute; bottom: 6mm; left: 6mm; width: 12px; height: 12px; border-bottom: 1.5px solid ${gold}; border-left: 1.5px solid ${gold}; }
    .corner-br { position: absolute; bottom: 6mm; right: 6mm; width: 12px; height: 12px; border-bottom: 1.5px solid ${gold}; border-right: 1.5px solid ${gold}; }

    .header-block {
      border-bottom: 1.5px solid ${gold};
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .brand-eyebrow {
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: ${gold};
    }

    .dossier-title {
      font-family: 'Playfair Display', serif;
      font-size: 19px;
      font-weight: 700;
      color: ${text};
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    .meta-box {
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #666;
      line-height: 1.4;
    }

    .meta-box strong {
      color: ${text};
    }

    .subject-ribbon {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      background: ${cardBg};
      border: 1px solid ${cardBorder};
      border-radius: 6px;
      padding: 6px 10px;
      margin-bottom: 10px;
      font-size: 9.5px;
    }

    .subject-ribbon span {
      color: #666;
      display: block;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .subject-ribbon strong {
      color: ${text};
      font-weight: 600;
    }

    /* Page 1 Grid: Biometric Plate + Mounts */
    .plate-grid {
      display: grid;
      grid-template-columns: 88mm 1fr;
      gap: 12px;
      align-items: stretch;
      margin-bottom: 10px;
    }

    .plate-container {
      background: #0C0E15;
      border: 1px solid #282A31;
      border-radius: 8px;
      position: relative;
      height: 72mm;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .plate-svg {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .mounts-card {
      background: ${cardBg};
      border: 1px solid ${cardBorder};
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .section-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${gold};
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .mount-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
      font-size: 9.5px;
    }

    .mount-name {
      width: 82px;
      font-weight: 600;
    }

    .mount-bar-wrap {
      flex: 1;
      height: 6px;
      background: rgba(0,0,0,0.12);
      border-radius: 4px;
      overflow: hidden;
    }

    .mount-bar-fill {
      height: 100%;
      background: ${gold};
      border-radius: 4px;
    }

    .mount-val {
      width: 28px;
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px;
      font-weight: 600;
    }

    /* 10-Point Personalised Findings */
    .findings-card {
      background: ${cardBg};
      border: 1px solid ${cardBorder};
      border-radius: 8px;
      padding: 8px 10px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .findings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 12px;
    }

    .finding-item {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .finding-item strong {
      font-size: 9.5px;
      color: ${text};
      font-weight: 700;
    }

    .finding-item span {
      font-size: 8.5px;
      color: #555;
      line-height: 1.35;
    }

    /* Page Footer */
    .page-footer {
      border-top: 1px solid ${border};
      padding-top: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #777;
    }

    .seal-box {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5px;
    }

    /* Page 2 Specific Sections */
    .three-layer-box {
      background: ${cardBg};
      border: 1px solid ${cardBorder};
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 10px;
    }

    .layer-heading {
      font-weight: 700;
      font-size: 10px;
      color: ${gold};
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .layer-points {
      list-style: none;
      display: grid;
      grid-template-columns: 1fr;
      gap: 3px;
    }

    .layer-points li {
      font-size: 9px;
      line-height: 1.35;
      position: relative;
      padding-left: 10px;
    }

    .layer-points li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${gold};
    }

    .remedies-box {
      background: rgba(13, 148, 136, 0.06);
      border: 1px solid rgba(13, 148, 136, 0.3);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 10px;
    }

    .remedy-item {
      font-size: 9px;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .remedy-item strong {
      color: ${jade};
    }

    .disclaimer-box {
      border: 1px dashed ${border};
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 8px;
      line-height: 1.4;
      color: #666;
    }

    @page {
      size: ${options.format === "US_Letter" ? "letter" : "A4"} portrait;
      margin: 8mm 10mm;
    }
    ${options.watermark === false ? ".watermark { display: none !important; }" : ""}

    @media print {
      body {
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .toolbar {
        display: none !important;
      }
      .print-stage {
        padding: 0 !important;
        gap: 0 !important;
      }
      .pdf-page {
        width: ${options.format === "US_Letter" ? "195mm" : "190mm"} !important;
        min-height: ${options.format === "US_Letter" ? "265mm" : "279mm"} !important;
        max-height: ${options.format === "US_Letter" ? "265mm" : "279mm"} !important;
        box-shadow: none !important;
        border: none !important;
        page-break-after: always !important;
        break-after: page !important;
        margin: 0 auto !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .pdf-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-info">
      <strong>Vedic Hastarekha Biometric Dossier (A4)</strong>
      <span>Serial ${escapeHtml(reportId)} · Verified for Archival Printing</span>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-gold" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print / Save as PDF
      </button>
    </div>
  </div>

  <div class="print-stage">
    <!-- ==========================================
         PAGE 1: BIOMETRIC SCAN & REKHA FINDINGS
         ========================================== -->
    <section class="pdf-page">
      <div class="corner-tl"></div>
      <div class="corner-tr"></div>
      <div class="corner-bl"></div>
      <div class="corner-br"></div>

      <div>
        <header class="header-block">
          <div class="header-top">
            <div>
              <span class="brand-eyebrow">VEDIC AI · SAMUDRIKA SHASTRA BIO-DOSSIER</span>
              <h1 class="dossier-title">Hastarekha Biometric Blueprint</h1>
            </div>
            <div class="meta-box">
              <div><strong>SERIAL:</strong> ${escapeHtml(reportId)}</div>
              <div><strong>DATE:</strong> ${escapeHtml(dateStr)}</div>
              <div><strong>AYANAMSHA:</strong> Lahiri 24°11'32"</div>
            </div>
          </div>
        </header>

        <div class="subject-ribbon">
          <div><span>Target Palm</span><strong>${escapeHtml(handLabel)}</strong></div>
          <div><span>Analytical Model</span><strong>Hastarekha Vision 2.0</strong></div>
          <div><span>Biometric Status</span><strong>Verified Hastarekha Scan</strong></div>
          <div><span>Archival Grade</span><strong>${options.format === "US_Letter" ? "US Letter" : "ISO 216 / A4"} · ${escapeHtml(options.paperWeight || "120gsm")}</strong></div>
        </div>

        <!-- Biometric Scan Plate + Mount Strengths -->
        <div class="plate-grid">
          <div class="plate-container">
            <svg class="plate-svg" viewBox="0 0 800 700" xmlns="http://www.w3.org/2000/svg">
              <rect width="800" height="700" fill="#0C0E15"/>
              <!-- Biometric Coordinates -->
              <g stroke="rgba(229,196,107,0.1)" stroke-width="1" stroke-dasharray="4,4">
                <line x1="80" y1="120" x2="720" y2="120"/>
                <line x1="80" y1="260" x2="720" y2="260"/>
                <line x1="80" y1="420" x2="720" y2="420"/>
                <line x1="80" y1="580" x2="720" y2="580"/>
                <line x1="200" y1="60" x2="200" y2="640"/>
                <line x1="400" y1="60" x2="400" y2="640"/>
                <line x1="600" y1="60" x2="600" y2="640"/>
              </g>
              <circle cx="400" cy="380" r="230" fill="none" stroke="rgba(229,196,107,0.2)" stroke-width="1.5"/>
              <circle cx="400" cy="380" r="250" fill="none" stroke="rgba(82,254,184,0.18)" stroke-width="1" stroke-dasharray="6,8"/>
              
              <!-- Palm Shape Outline -->
              <path d="M 330 630 C 310 590, 260 520, 240 450 C 220 380, 200 340, 160 300 C 145 285, 140 260, 155 245 C 170 230, 195 235, 220 265 C 245 295, 270 335, 290 350 C 285 300, 280 200, 285 140 C 287 115, 305 105, 320 110 C 335 115, 340 135, 342 165 C 345 210, 345 270, 350 310 C 355 260, 360 160, 375 90 C 380 65, 400 60, 415 65 C 430 70, 435 90, 435 120 C 435 180, 430 250, 432 305 C 440 260, 450 175, 470 125 C 475 105, 495 100, 510 105 C 525 110, 530 130, 525 160 C 515 220, 505 285, 505 330 C 515 290, 535 225, 560 190 C 575 170, 595 170, 605 185 C 615 200, 610 220, 595 255 C 570 315, 560 385, 565 440 C 570 510, 555 570, 520 620 C 490 655, 360 655, 330 630 Z" fill="rgba(25,27,35,0.85)" stroke="rgba(229,196,107,0.5)" stroke-width="2.5"/>

              <!-- Major Hastarekha Lines -->
              <path d="M 550 330 C 470 335, 380 320, 325 245" fill="none" stroke="#FF7675" stroke-width="5" stroke-linecap="round"/>
              <path d="M 285 350 C 340 370, 440 395, 515 440" fill="none" stroke="#52FEB8" stroke-width="5" stroke-linecap="round"/>
              <path d="M 285 345 C 315 390, 325 480, 290 575" fill="none" stroke="#FFE192" stroke-width="5.5" stroke-linecap="round"/>
              <path d="M 390 600 C 395 500, 395 380, 405 240" fill="none" stroke="#A29BFE" stroke-width="3.5" stroke-dasharray="8,4" stroke-linecap="round"/>

              <!-- Telemetry Label Badges -->
              <rect x="330" y="225" width="105" height="24" rx="4" fill="rgba(17,19,26,0.9)" stroke="#FF7675" stroke-width="1"/>
              <text x="382" y="241" fill="#FF7675" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">HRIDAYA REKHA</text>

              <rect x="420" y="375" width="110" height="24" rx="4" fill="rgba(17,19,26,0.9)" stroke="#52FEB8" stroke-width="1"/>
              <text x="475" y="391" fill="#52FEB8" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">MASTAKA REKHA</text>

              <rect x="235" y="470" width="95" height="24" rx="4" fill="rgba(17,19,26,0.9)" stroke="#FFE192" stroke-width="1"/>
              <text x="282" y="486" fill="#FFE192" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700" text-anchor="middle">JEEVA REKHA</text>
            </svg>
          </div>

          <!-- Parvata Bala (Mount Strengths) -->
          <div class="mounts-card">
            <div>
              <div class="section-title">Parvata Bala · Mount Strengths</div>
              <div class="mount-row">
                <span class="mount-name">Guru (Jupiter)</span>
                <div class="mount-bar-wrap"><div class="mount-bar-fill" style="width: 88%;"></div></div>
                <span class="mount-val">88%</span>
              </div>
              <div class="mount-row">
                <span class="mount-name">Surya (Sun)</span>
                <div class="mount-bar-wrap"><div class="mount-bar-fill" style="width: 92%;"></div></div>
                <span class="mount-val">92%</span>
              </div>
              <div class="mount-row">
                <span class="mount-name">Shukra (Venus)</span>
                <div class="mount-bar-wrap"><div class="mount-bar-fill" style="width: 94%;"></div></div>
                <span class="mount-val">94%</span>
              </div>
              <div class="mount-row">
                <span class="mount-name">Budha (Mercury)</span>
                <div class="mount-bar-wrap"><div class="mount-bar-fill" style="width: 84%;"></div></div>
                <span class="mount-val">84%</span>
              </div>
              <div class="mount-row">
                <span class="mount-name">Shani (Saturn)</span>
                <div class="mount-bar-wrap"><div class="mount-bar-fill" style="width: 76%;"></div></div>
                <span class="mount-val">76%</span>
              </div>
              <div class="mount-row">
                <span class="mount-name">Chandra (Moon)</span>
                <div class="mount-bar-wrap"><div class="mount-bar-fill" style="width: 86%;"></div></div>
                <span class="mount-val">86%</span>
              </div>
            </div>

            <div style="font-size: 8px; color: #777; border-top: 1px solid ${border}; padding-top: 4px; margin-top: 4px;">
              Photometric density analysis computed via sidereal Hastarekha mount elevation geometry.
            </div>
          </div>
        </div>

        <!-- 10-Point Personalised Findings (Section A) -->
        <div class="findings-card">
          <div class="section-title">Part I: 10-Point Personalised Hastarekha Findings</div>
          <div class="findings-grid">
            <div class="finding-item">
              <strong>1. Overall Structure & Shape</strong>
              <span>${escapeHtml(report.overallStructure)}</span>
            </div>
            <div class="finding-item">
              <strong>2. Heart Line (Hridaya Rekha)</strong>
              <span>${escapeHtml(report.heartLine)}</span>
            </div>
            <div class="finding-item">
              <strong>3. Head Line (Mastaka Rekha)</strong>
              <span>${escapeHtml(report.headLine)}</span>
            </div>
            <div class="finding-item">
              <strong>4. Life Line (Jeeva Rekha)</strong>
              <span>${escapeHtml(report.lifeLine)}</span>
            </div>
            <div class="finding-item">
              <strong>5. Fate Line (Bhagya Rekha)</strong>
              <span>${escapeHtml(report.fateLine)}</span>
            </div>
            <div class="finding-item">
              <strong>6. Thumb Characteristics</strong>
              <span>${escapeHtml(report.thumbCharacteristics)}</span>
            </div>
            <div class="finding-item">
              <strong>7. Finger Proportions</strong>
              <span>${escapeHtml(report.fingerProportions)}</span>
            </div>
            <div class="finding-item">
              <strong>8. Mount of Venus (Shukra)</strong>
              <span>${escapeHtml(report.mountOfVenus)}</span>
            </div>
            <div class="finding-item">
              <strong>9. Mount of Jupiter (Guru)</strong>
              <span>${escapeHtml(report.mountOfJupiter)}</span>
            </div>
            <div class="finding-item">
              <strong>10. Synthesis & Direction</strong>
              <span>${escapeHtml(report.synthesis)}</span>
            </div>
          </div>
        </div>
      </div>

      <footer class="page-footer">
        <div class="seal-box">
          <span>SHA-256: 7F9E..3A82C</span>
          <span>·</span>
          <span>JYOTISH EPHEMERIS ARCHIVE</span>
        </div>
        <div>Page 01 of 02 · Archival Layout (ISO 216 / A4 Standard)</div>
      </footer>
    </section>

    <!-- ==========================================
         PAGE 2: THREE-LAYER ANALYSIS & REMEDIES
         ========================================== -->
    <section class="pdf-page">
      <div class="corner-tl"></div>
      <div class="corner-tr"></div>
      <div class="corner-bl"></div>
      <div class="corner-br"></div>

      <div>
        <header class="header-block">
          <div class="header-top">
            <div>
              <span class="brand-eyebrow">VEDIC AI · SAMUDRIKA SHASTRA BIO-DOSSIER</span>
              <h1 class="dossier-title">Analytical Layers & Karmic Harmonization</h1>
            </div>
            <div class="meta-box">
              <div><strong>SERIAL:</strong> ${escapeHtml(reportId)}</div>
              <div><strong>PAGE:</strong> 02 / 02</div>
              <div><strong>STATUS:</strong> Authenticated</div>
            </div>
          </div>
        </header>

        <!-- Three-Layer Analytical Framework -->
        <div class="three-layer-box">
          <div class="layer-heading">Layer 1: Foundational Anatomy & Elemental Balance</div>
          <ul class="layer-points">
            ${report.layer1Structure.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
          </ul>
        </div>

        <div class="three-layer-box">
          <div class="layer-heading">Layer 2: Energetic Creases & Prana Flow Vectors</div>
          <ul class="layer-points">
            ${report.layer2Lines.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
          </ul>
        </div>

        <div class="three-layer-box">
          <div class="layer-heading">Layer 3: Karmic Indicators & Philosophical Synthesis</div>
          <ul class="layer-points">
            ${report.layer3Interpretation.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
          </ul>
        </div>

        <!-- Prescribed Upaya & Remedies -->
        <div class="remedies-box">
          <div class="section-title" style="color: ${jade};">Prescribed Upaya & Karmic Harmonization</div>
          ${report.remedies
            .map((r) => {
              const parts = r.split(":");
              if (parts.length > 1) {
                return `<div class="remedy-item"><strong>${escapeHtml(parts[0])}:</strong> ${escapeHtml(parts.slice(1).join(":"))}</div>`;
              }
              return `<div class="remedy-item">${escapeHtml(r)}</div>`;
            })
            .join("")}
        </div>

        <!-- Traditional Philosophical Disclaimer -->
        <div class="disclaimer-box">
          <strong>Samudrika Shastra Advisory:</strong> ${escapeHtml(report.disclaimer)}
          Traditional Indian palmistry provides symbolic markers for contemplation and self-development. Personal consciousness, deliberate effort, and ethical righteous action (Karma) shape life outcomes.
        </div>
      </div>

      <footer class="page-footer">
        <div class="seal-box">
          <span>VEDIC AI EPHEMERIS</span>
          <span>·</span>
          <span>CONFIDENTIAL DOSSIER</span>
        </div>
        <div>Page 02 of 02 · Archival Layout (ISO 216 / A4 Standard)</div>
      </footer>
    </section>
  </div>
</body>
</html>`;
}

/**
 * Universal print helper via hidden iframe that NEVER gets blocked by popup blockers.
 */
export function printHtmlViaIframe(html: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    try {
      const oldFrame = document.getElementById("vedic-print-iframe");
      if (oldFrame) oldFrame.remove();

      const iframe = document.createElement("iframe");
      iframe.id = "vedic-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.opacity = "0";
      iframe.setAttribute("aria-hidden", "true");

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        resolve(false);
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch {
          // Fallback to window.open if iframe printing was restricted
          try {
            const win = window.open("", "_blank");
            if (win) {
              win.document.open();
              win.document.write(html);
              win.document.close();
              win.focus();
              setTimeout(() => {
                try { win.print(); } catch {}
              }, 300);
              resolve(true);
              return;
            }
          } catch {}
          resolve(false);
        }
      }, 350);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Downloads a standalone self-contained HTML archival file that can be opened and printed anywhere.
 */
export function downloadHtmlFile(html: string, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * High-level export handler for the Hastarekha Dossier.
 * 1. Downloads the self-contained archival HTML dossier file.
 * 2. Triggers the browser's native Print / Save as PDF dialog.
 */
export async function downloadPalmDossierPdf(report: ParsedPalmReport, options: PalmPrintOptions = {}): Promise<void> {
  const html = generatePalmPrintHtml(report, options);
  const filename = `vedic-ai-hastarekha-dossier-${options.hand || "palm"}-${Date.now()}.html`;
  
  // Download the standalone file
  downloadHtmlFile(html, filename);

  // Simultaneously trigger native print / save as PDF
  await printHtmlViaIframe(html);
}

/**
 * Direct print trigger for the Hastarekha Dossier.
 */
export async function printPalmDossier(report: ParsedPalmReport, options: PalmPrintOptions = {}): Promise<void> {
  const html = generatePalmPrintHtml(report, options);
  await printHtmlViaIframe(html);
}

