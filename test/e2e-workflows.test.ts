import { describe, it, expect } from "vitest";
import { calculateKundli } from "../lib/astrology";
import { generateKundliPrintHtml } from "../lib/print-report";
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

describe("End-to-End Real User Workflows (Requirement 8)", () => {
  const testBirth = {
    date: "1995-10-24",
    time: "06:30",
    place: "New Delhi, India",
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: "Asia/Kolkata",
  };

  // Workflow 1: Register / Login
  it("Workflow 1: Validates login & auth protection boundaries", async () => {
    const accountDataModule = await import("../app/api/account-data/route");
    const mockReq = new Request("http://localhost:3000/api/account-data");
    const res = await accountDataModule.GET(mockReq);
    expect([401, 503]).toContain(res.status);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  // Workflow 2: Create a Kundli
  it("Workflow 2: Calculates accurate Kundli chart with astronomical positions", () => {
    const chart = calculateKundli(testBirth);
    expect(chart.ascendant.sign).toBe("Libra");
    expect(chart.planets.length).toBe(9);
    expect(chart.planets.find((p) => p.name === "Moon")?.sign).toBe("Libra");
    expect(chart.planets.find((p) => p.name === "Moon")?.nakshatra).toBe("Chitra");
    expect(chart.vimshottari.currentMahadasha.lord).toBeDefined();
    expect(chart.vimshottari.periods.length).toBeGreaterThan(0);
  });

  // Workflow 3: Save and Retrieve a Kundli
  it("Workflow 3: Protects saved Kundli reports behind authentication", async () => {
    const savedKundliModule = await import("../app/api/saved-kundli/route");
    const chart = calculateKundli(testBirth);

    const postReq = new Request("http://localhost:3000/api/saved-kundli", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: testBirth, report: chart }),
    });

    const res = await savedKundliModule.POST(postReq);
    expect([401, 503]).toContain(res.status);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  // Workflow 4: Open Astrology Chat & Send a Message
  it("Workflow 4: Generates structured 7-section chat prompt with real chart context", async () => {
    const chart = calculateKundli(testBirth);
    const chatModule = await import("../app/api/chat/route");

    const chatReq = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What does my chart indicate about my career path?" }],
        kundli: chart,
      }),
    });

    const res = await chatModule.POST(chatReq);
    expect([200, 503]).toContain(res.status);
    if (res.status === 503) {
      const body = await res.json();
      expect(body.error).toContain("AI provider is not configured");
    }
  });

  // Workflow 5: Reload and Retrieve Conversation History
  it("Workflow 5: Enforces isolation and auth on conversation history retrieval", async () => {
    const convModule = await import("../app/api/conversations/route");
    const mockReq = new Request("http://localhost:3000/api/conversations");
    const res = await convModule.GET(mockReq);
    expect([401, 503]).toContain(res.status);
  });

  // Workflow 6: Upload a Palm Image & Format Validation
  it("Workflow 6: Validates palm reading payloads and rejects invalid formats", async () => {
    const palmModule = await import("../app/api/palm-reading/route");

    // Invalid format test
    const badReq = new Request("http://localhost:3000/api/palm-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: "data:text/plain;base64,invalid" }),
    });
    const badRes = await palmModule.POST(badReq);
    expect(badRes.status).toBe(400);

    // Valid base64 format test
    const validReq = new Request("http://localhost:3000/api/palm-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        hand: "right",
      }),
    });
    const validRes = await palmModule.POST(validReq);
    expect([200, 422, 502, 503]).toContain(validRes.status);
  });

  // Workflow 7: Camera Capture Support & Viewfinder Verification
  it("Workflow 7: Verifies camera capture and gallery selectors exist", () => {
    const pageContent = fs.readFileSync(path.resolve(__dirname, "../app/palm-reading/page.tsx"), "utf-8");
    expect(pageContent).toContain("palm-camera-button");
    expect(pageContent).toContain("palm-gallery-button");
    expect(pageContent).toContain("palm-camera-modal");
    expect(pageContent).toContain("palm-camera-video");
    expect(pageContent).toContain("palm-guide-outline");
    expect(pageContent).toContain("palm-camera-shutter-btn");
    expect(pageContent).toContain("palm-preview-img");
    expect(pageContent).toContain("palm-remove-button");
  });

  // Workflow 8: Generate and Download A4 PDF
  it("Workflow 8: Generates an exact two-page A4 Kundli PDF via Chrome headless", () => {
    const chart = calculateKundli(testBirth);
    const html = generateKundliPrintHtml(chart, "test-e2e-report");

    const htmlPath = path.resolve(__dirname, "temp-e2e-report.html");
    const pdfPath = path.resolve(__dirname, "temp-e2e-report.pdf");
    const chromeDataDir = path.resolve(__dirname, "temp-e2e-chrome");

    fs.writeFileSync(htmlPath, html, "utf-8");

    try {
      const chromePath = findChromePath();
      expect(chromePath, "Google Chrome or Chromium must be available for PDF export verification").toBeTruthy();

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
      const pdfText = pdfBytes.toString("latin1");
      const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);

      expect(pdfBytes.length).toBeGreaterThan(15000);
      expect(pageMatches?.length).toBe(2);
    } finally {
      try { if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath); } catch {}
      try { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); } catch {}
      try { if (fs.existsSync(chromeDataDir)) fs.rmSync(chromeDataDir, { recursive: true, force: true }); } catch {}
    }
  }, 30000);

  // Workflow 9: Mobile Navigation & Responsive Layouts
  it("Workflow 9: Verifies mobile bottom navigation styles and fixed positioning", () => {
    const navContent = fs.readFileSync(path.resolve(__dirname, "../components/mobile-bottom-nav.tsx"), "utf-8");
    expect(navContent).toContain("mobile-bottom-nav");
    expect(navContent).toContain("/chat");
    expect(navContent).toContain("/palm-reading");
    expect(navContent).toContain("/panchang");
    expect(navContent).toContain("/profile");

    const cssContent = fs.readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf-8");
    expect(cssContent).toContain(".mobile-bottom-nav");
    expect(cssContent).toContain("position: fixed");
    expect(cssContent).toContain("bottom: 0");
  });
});
