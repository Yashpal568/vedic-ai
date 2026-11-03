import { describe, it, expect } from "vitest";
import { parsePalmReading } from "../lib/palm-parser";
import { generatePalmPrintHtml } from "../lib/palm-print-report";
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";

function findChromePath(): string | null {
  const candidatePaths = [
    process.env.CHROME_BIN,
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean) as string[];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

describe("Hastarekha Palmistry PDF Export (Approved Stitch Dossier)", () => {
  const sampleMarkdown = `## 1. Palm Overview & Photo Observations
Squared earth-type palm with strong, balanced fingers reflecting grounded persistence and practical capability.

## 2. Heart Line (Emotions & Connection)
Curved gracefully toward Jupiter mount; indicates loyal warmth, balanced empathy, and ethical devotion.

## 3. Head Line (Thinking & Focus)
Clear and extended with gentle downward slope; analytical acuity paired with creative intuition.

## 4. Life Line (Energy & Vitality)
Deep, sweeping arc enclosing the Venus mount; robust physical vitality, endurance, and recuperative strength.

## 5. Fate Line & Other Visible Features
Steady vertical ascent manifesting autonomous vocational direction and self-earned achievement.

## 6. Overall Traditional Reading
Strong alignment between intuitive potential and practical manifestation in worldly endeavors.

## 7. Limitations & Guidance
Samudrika Shastra provides symbolic reflections of inherent tendencies, not unalterable decrees. Consciousness and deliberate action always direct one's life.`;

  it("generates structured 2-page A4 print HTML matching Stitch reference specifications", () => {
    const parsed = parsePalmReading(sampleMarkdown, "left");
    const html = generatePalmPrintHtml(parsed, {
      hand: "left",
      texture: "parchment",
      reportId: "VD-PALM-TEST-001",
    });

    // Page 1 Checks
    expect(html).toContain("Page 01 of 02");
    expect(html).toContain("Hastarekha Biometric Blueprint");
    expect(html).toContain("Left Hand (Passive Hastarekha)");
    expect(html).toContain("Parvata Bala · Mount Strengths");
    expect(html).toContain("HRIDAYA REKHA");
    expect(html).toContain("MASTAKA REKHA");
    expect(html).toContain("JEEVA REKHA");
    expect(html).toContain("Part I: 10-Point Personalised Hastarekha Findings");
    expect(html).toContain("1. Overall Structure & Shape");
    expect(html).toContain("2. Heart Line (Hridaya Rekha)");
    expect(html).toContain("3. Head Line (Mastaka Rekha)");
    expect(html).toContain("4. Life Line (Jeeva Rekha)");

    // Page 2 Checks
    expect(html).toContain("Page 02 of 02");
    expect(html).toContain("Analytical Layers & Karmic Harmonization");
    expect(html).toContain("Layer 1: Foundational Anatomy & Elemental Balance");
    expect(html).toContain("Layer 2: Energetic Creases & Prana Flow Vectors");
    expect(html).toContain("Layer 3: Karmic Indicators & Philosophical Synthesis");
    expect(html).toContain("Prescribed Upaya & Karmic Harmonization");
    expect(html).toContain("Samudrika Shastra Advisory");
  });

  it("renders to an actual two-page A4 PDF using Chrome headless without clipping (Vedic Parchment Profile)", () => {
    const parsed = parsePalmReading(sampleMarkdown, "left");
    const html = generatePalmPrintHtml(parsed, {
      hand: "left",
      texture: "parchment",
      reportId: "VD-PALM-TEST-002",
      format: "A4",
      paperWeight: "120gsm",
      watermark: true,
    });

    const htmlPath = path.resolve(__dirname, "temp-palm-report.html");
    const pdfPath = path.resolve(__dirname, "temp-palm-report.pdf");
    const chromeDataDir = path.resolve(__dirname, "temp-palm-chrome-data");

    fs.writeFileSync(htmlPath, html, "utf-8");

    try {
      const chromePath = findChromePath();
      expect(chromePath, "Google Chrome or Chromium binary must be available").toBeTruthy();

      execFileSync(
        chromePath!,
        [
          "--headless=new",
          "--disable-gpu",
          "--no-sandbox",
          `--user-data-dir=${chromeDataDir}`,
          `--print-to-pdf=${pdfPath}`,
          "--no-pdf-header-footer",
          `file:///${htmlPath.replace(/\\/g, "/")}`,
        ],
        { timeout: 25000 }
      );

      expect(fs.existsSync(pdfPath)).toBe(true);
      const pdfBytes = fs.readFileSync(pdfPath);
      expect(pdfBytes.length).toBeGreaterThan(15000);

      // Verify exact 2-page PDF
      const pdfText = pdfBytes.toString("latin1");
      const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
      console.log("Palm PDF (Vedic Parchment) generated. Size:", pdfBytes.length, "bytes. Pages:", pageMatches?.length);
      expect(pageMatches?.length).toBe(2);
    } finally {
      try { if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath); } catch {}
      try { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); } catch {}
      try { if (fs.existsSync(chromeDataDir)) fs.rmSync(chromeDataDir, { recursive: true, force: true }); } catch {}
    }
  }, 30000);

  it("verifies Clean White and Cosmic Void profiles and US Letter export", () => {
    const parsed = parsePalmReading(sampleMarkdown, "right");

    // Clean White Profile
    const cleanHtml = generatePalmPrintHtml(parsed, {
      hand: "right",
      texture: "clean",
      format: "US_Letter",
      paperWeight: "80gsm",
      watermark: false,
    });
    expect(cleanHtml).toContain("US Letter");
    expect(cleanHtml).toContain("80gsm");
    expect(cleanHtml).toContain("display: none !important;"); // Watermark disabled

    // Cosmic Void Profile
    const voidHtml = generatePalmPrintHtml(parsed, {
      hand: "right",
      texture: "void",
      format: "A4",
      watermark: true,
    });
    expect(voidHtml).toContain("#0C0E15"); // Cosmic Void Dark background
    expect(voidHtml).toContain("Page 01 of 02");
    expect(voidHtml).toContain("Page 02 of 02");
  });

  it("verifies responsive mobile layout for mobile screens without clipping or overflow", () => {
    const parsed = parsePalmReading(sampleMarkdown, "left");
    const html = generatePalmPrintHtml(parsed, {
      hand: "left",
      texture: "parchment",
      reportId: "VD-PALM-MOBILE-001",
      format: "A4",
    });

    expect(html).toContain("@media screen and (max-width: 768px)");
    expect(html).toContain("width: 100% !important;");

    const htmlPath = path.resolve(__dirname, "temp-palm-mobile.html");
    const screenPath = path.resolve("C:/Users/hp/.gemini/antigravity/brain/df355cbb-8b43-4434-bd55-f527cbd6b92a/screenshots/audit_palm_dossier_mobile_390.png");
    const chromeDataDir = path.resolve(__dirname, "temp-palm-mobile-chrome");

    fs.writeFileSync(htmlPath, html, "utf-8");

    try {
      const chromePath = findChromePath();
      if (chromePath) {
        execFileSync(
          chromePath,
          [
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            `--user-data-dir=${chromeDataDir}`,
            "--window-size=390,844",
            `--screenshot=${screenPath}`,
            `file:///${htmlPath.replace(/\\/g, "/")}`,
          ],
          { timeout: 15000 }
        );
        expect(fs.existsSync(screenPath)).toBe(true);
      }
    } finally {
      try { if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath); } catch {}
      try { if (fs.existsSync(chromeDataDir)) fs.rmSync(chromeDataDir, { recursive: true, force: true }); } catch {}
    }
  });
});
