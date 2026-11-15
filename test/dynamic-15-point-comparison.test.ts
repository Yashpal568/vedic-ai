import { describe, it, expect } from "vitest";
import { calculateKundli } from "../lib/astrology";
import { build15PointVedicReport } from "../lib/vedic-15-point-report";
import * as fs from "fs";

describe("Dynamic 15-Point Report Comparison (P1)", () => {
  it("generates and verifies distinct Career, Wealth, Relationships, and Mahadasha text for P1 and P2", () => {
    // Profile 1: New Delhi, Cancer Lagna, Moon in Rohini (Taurus), Sun in Cancer, Jupiter in Cancer H1, Mars in Aries H10
    const chartP1 = calculateKundli({
      date: "1990-08-15",
      time: "05:45",
      place: "New Delhi, India",
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: "Asia/Kolkata",
    });

    // Profile 2: New York, Leo Lagna, Moon in Mrigashira (Gemini), Sun in Aries H9, Mars in Taurus H10
    const chartP2 = calculateKundli({
      date: "1985-04-24",
      time: "14:30",
      place: "New York, USA",
      latitude: 40.7128,
      longitude: -74.0060,
      timezone: "America/New_York",
    });

    const reportP1 = build15PointVedicReport(chartP1, "en");
    const reportP2 = build15PointVedicReport(chartP2, "en");

    // Sections:
    // Index 8: Career & Profession (10th house)
    // Index 9: Relationships & Marriage (7th house)
    // Index 10: Wealth & Financial Prospects (2nd / 11th houses)
    // Index 13: Current Planetary Period (Vimshottari Mahadasha)

    const careerP1 = reportP1[8];
    const careerP2 = reportP2[8];
    const relP1 = reportP1[9];
    const relP2 = reportP2[9];
    const wealthP1 = reportP1[10];
    const wealthP2 = reportP2[10];
    const dashaP1 = reportP1[13];
    const dashaP2 = reportP2[13];

    console.log("=== P1 CAREER ===", careerP1.details);
    console.log("=== P2 CAREER ===", careerP2.details);

    console.log("=== P1 RELATIONSHIPS ===", relP1.details);
    console.log("=== P2 RELATIONSHIPS ===", relP2.details);

    console.log("=== P1 WEALTH ===", wealthP1.details);
    console.log("=== P2 WEALTH ===", wealthP2.details);

    console.log("=== P1 DASHA ===", dashaP1.details);
    console.log("=== P2 DASHA ===", dashaP2.details);

    expect(careerP1.details).not.toEqual(careerP2.details);
    expect(relP1.details).not.toEqual(relP2.details);
    expect(wealthP1.details).not.toEqual(wealthP2.details);
    expect(dashaP1.details).not.toEqual(dashaP2.details);

    // Save full comparison evidence to JSON
    fs.writeFileSync(
      "C:/Users/hp/.gemini/antigravity/brain/df355cbb-8b43-4434-bd55-f527cbd6b92a/scratch/15point_report_comparison.json",
      JSON.stringify(
        {
          p1: {
            title: "P1 (New Delhi, Cancer Lagna)",
            career: { title: careerP1.title, details: careerP1.details },
            relationships: { title: relP1.title, details: relP1.details },
            wealth: { title: wealthP1.title, details: wealthP1.details },
            dasha: { title: dashaP1.title, details: dashaP1.details },
          },
          p2: {
            title: "P2 (New York, Leo Lagna)",
            career: { title: careerP2.title, details: careerP2.details },
            relationships: { title: relP2.title, details: relP2.details },
            wealth: { title: wealthP2.title, details: wealthP2.details },
            dasha: { title: dashaP2.title, details: dashaP2.details },
          },
        },
        null,
        2
      )
    );
  });
});

