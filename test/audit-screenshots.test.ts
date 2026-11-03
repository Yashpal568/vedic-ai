import { describe, it, expect } from "vitest";
import { parsePalmReading } from "../lib/palm-parser";
import { generatePalmPrintHtml } from "../lib/palm-print-report";
import { calculateKundli } from "../lib/astrology";
import { generateKundliPrintHtml } from "../lib/print-report";
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";

function findChromePath(): string | null {
  const candidatePaths = [
    process.env.CHROME_BIN,
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
  ].filter(Boolean) as string[];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

describe("Visual Audit & Reference Comparison Screenshots", () => {
  const chromePath = findChromePath();
  const screenshotDir = path.resolve("C:/Users/hp/.gemini/antigravity/brain/df355cbb-8b43-4434-bd55-f527cbd6b92a/screenshots");
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  it("captures high-resolution A4 print renders for Palm Dossier (Pages 1 & 2)", () => {
    expect(chromePath).toBeTruthy();

    const samplePalmMarkdown = `## 1. Palm Overview & Photo Observations
Squared earth-type palm with balanced fingers reflecting grounded persistence, ethical leadership, and practical capability.

## 2. Heart Line (Emotions & Connection)
Curved gracefully toward Jupiter mount; loyal emotional warmth, selective intimate boundaries, and thoughtful empathy.

## 3. Head Line (Thinking & Focus)
Clear and slightly sloping; strong analytical focus paired with creative problem-solving and flexible adaptability.

## 4. Life Line (Energy & Vitality)
Deep, sweeping arc enclosing the Venus mount; robust vitality, steady routine, and physical perseverance.

## 5. Fate Line & Other Visible Features
Steady vertical ascent manifesting autonomous vocational direction and self-earned achievement.

## 6. Overall Traditional Reading
Strong alignment between intuitive potential and practical manifestation in worldly endeavors.`;

    const parsedPalm = parsePalmReading(samplePalmMarkdown, "left");
    const palmHtml = generatePalmPrintHtml(parsedPalm, {
      hand: "left",
      texture: "parchment",
      format: "A4",
      reportId: "VD-AUDIT-DOSSIER-A4",
      watermark: true,
      paperWeight: "120gsm",
    });

    const palmFile = path.resolve(__dirname, "temp-audit-palm.html");
    const chromeDataDir = path.resolve(__dirname, "temp-audit-chrome");
    fs.writeFileSync(palmFile, palmHtml, "utf8");

    try {
      execFileSync(chromePath!, [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        `--user-data-dir=${chromeDataDir}`,
        "--window-size=1050,1500",
        `--screenshot=${path.join(screenshotDir, "audit_palm_dossier_a4.png")}`,
        `file:///${palmFile.replace(/\\/g, "/")}`,
      ]);
      expect(fs.existsSync(path.join(screenshotDir, "audit_palm_dossier_a4.png"))).toBe(true);
    } finally {
      try { if (fs.existsSync(palmFile)) fs.unlinkSync(palmFile); } catch {}
      try { if (fs.existsSync(chromeDataDir)) fs.rmSync(chromeDataDir, { recursive: true, force: true }); } catch {}
    }
  });

  it("captures high-resolution A4 print renders for Janma Kundli Report (Pages 1 & 2)", () => {
    expect(chromePath).toBeTruthy();

    const kundliReport = calculateKundli({
      date: "1996-05-15",
      time: "14:30",
      place: "Varanasi, India",
      latitude: 25.3176,
      longitude: 82.9739,
      timezone: "Asia/Kolkata",
    });

    const kundliHtml = generateKundliPrintHtml(kundliReport, "VD-AUDIT-KUNDLI-A4");
    const kundliFile = path.resolve(__dirname, "temp-audit-kundli.html");
    const chromeDataDir = path.resolve(__dirname, "temp-audit-chrome-2");
    fs.writeFileSync(kundliFile, kundliHtml, "utf8");

    try {
      execFileSync(chromePath!, [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        `--user-data-dir=${chromeDataDir}`,
        "--window-size=1050,1500",
        `--screenshot=${path.join(screenshotDir, "audit_kundli_report_a4.png")}`,
        `file:///${kundliFile.replace(/\\/g, "/")}`,
      ]);
      expect(fs.existsSync(path.join(screenshotDir, "audit_kundli_report_a4.png"))).toBe(true);
    } finally {
      try { if (fs.existsSync(kundliFile)) fs.unlinkSync(kundliFile); } catch {}
      try { if (fs.existsSync(chromeDataDir)) fs.rmSync(chromeDataDir, { recursive: true, force: true }); } catch {}
    }
  });
});

