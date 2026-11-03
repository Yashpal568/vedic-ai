import { describe, it, expect } from "vitest";
import { calculateKundli } from "../lib/astrology";
import { generateKundliPrintHtml } from "../lib/print-report";
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";

describe("Kundli PDF Export (Task 2)", () => {
  const testInput = {
    date: "1995-10-24",
    time: "06:30",
    place: "New Delhi, India",
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: "Asia/Kolkata",
  };

  it("calculates accurate chart and generates structured two-page HTML", () => {
    const report = calculateKundli(testInput);
    expect(report.ascendant.sign).toBe("Libra");

    const html = generateKundliPrintHtml(report, "test-report-123");

    // Page 1 requirements
    expect(html).toContain("PAGE 01 / 02");
    expect(html).toContain("New Delhi, India");
    expect(html).toContain("24 Oct 1995");
    expect(html).toContain("06:30");
    expect(html).toContain("Libra"); // Ascendant
    expect(html).toContain("Moon Sign (Rashi)");
    expect(html).toContain("Sun Sign & House");
    expect(html).toContain("kundli-svg"); // Janma Kundli SVG chart
    expect(html).toContain("How to Read Your Chart");
    expect(html).toContain("Your Core Personality & Life Patterns");

    // Page 2 requirements
    expect(html).toContain("PAGE 02 / 02");
    expect(html).toContain("Planetary Placements & Exact Degrees");
    expect(html).toContain("Vimshottari Dasha Chapter");
    expect(html).toContain("Antardasha");
    expect(html).toContain("Birth Panchang");
    expect(html).toContain("Your Career & Profession");
    expect(html).toContain("Relationships & Partnerships");
    expect(html).toContain("Finances & Prosperity");
    expect(html).toContain("Personal Growth & Timing");
    expect(html).toContain("Important Astrological Note");

    // 9 Planets in table
    const planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
    for (const p of planets) {
      expect(html).toContain(`<strong>${p}</strong>`);
    }
  });

  it("renders to an actual two-page PDF using Chrome headless without layout clipping", () => {
    const report = calculateKundli(testInput);
    const html = generateKundliPrintHtml(report, "test-report-pdf");

    const htmlPath = path.resolve(__dirname, "temp-test-report.html");
    const pdfPath = path.resolve(__dirname, "temp-test-report.pdf");
    const chromeDataDir = path.resolve(__dirname, "temp-chrome-data");

    fs.writeFileSync(htmlPath, html, "utf-8");

    try {
      const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      if (!fs.existsSync(chromePath)) {
        console.warn("Chrome not found at standard path, skipping headless PDF execution");
        return;
      }

      // Generate PDF via Chrome
      execFileSync(
        chromePath,
        [
          "--headless=new",
          "--disable-gpu",
          "--no-sandbox",
          `--user-data-dir=${chromeDataDir}`,
          `--print-to-pdf=${pdfPath}`,
          "--no-pdf-header-footer",
          `file:///${htmlPath.replace(/\\/g, "/")}`,
        ],
        { timeout: 20000 }
      );

      expect(fs.existsSync(pdfPath)).toBe(true);
      const pdfBytes = fs.readFileSync(pdfPath);
      expect(pdfBytes.length).toBeGreaterThan(10000);

      // Verify PDF has exactly 2 pages by checking the page count in PDF trailer/catalog
      const pdfText = pdfBytes.toString("latin1");
      const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
      // In standard Chromium PDF output, each page corresponds to a /Type /Page object
      console.log("PDF generated successfully. File size:", pdfBytes.length, "bytes. Detected /Type /Page count:", pageMatches?.length);
      expect(pageMatches?.length).toBe(2);
    } finally {
      // Clean up temp files
      try { if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath); } catch {}
      try { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); } catch {}
      try { if (fs.existsSync(chromeDataDir)) fs.rmSync(chromeDataDir, { recursive: true, force: true }); } catch {}
    }
  });
});
