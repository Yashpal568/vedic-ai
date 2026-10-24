import { describe, expect, it } from "vitest";
import { calculateKundli } from "@/lib/astrology";

describe("calculateKundli", () => {
  const input = {
    date: "1990-01-01",
    time: "12:00",
    timezone: "Asia/Kolkata",
    place: "New Delhi, India",
    latitude: 28.6139,
    longitude: 77.209,
  };

  it("converts local birth time to UTC using the selected IANA timezone", () => {
    const report = calculateKundli(input);
    expect(report.birth.utc).toBe("1990-01-01T06:30:00.000Z");
    expect(report.birth.timezone).toBe("Asia/Kolkata");
  });

  it("returns nine grahas with bounded sidereal positions and whole-sign houses", () => {
    const report = calculateKundli(input);
    expect(report.planets.map((planet) => planet.name)).toEqual([
      "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
    ]);
    for (const planet of report.planets) {
      expect(planet.longitude).toBeGreaterThanOrEqual(0);
      expect(planet.longitude).toBeLessThan(360);
      expect(planet.signIndex).toBeGreaterThanOrEqual(0);
      expect(planet.signIndex).toBeLessThan(12);
      expect(planet.house).toBeGreaterThanOrEqual(1);
      expect(planet.house).toBeLessThanOrEqual(12);
      expect(planet.nakshatra).toBeTruthy();
      expect(planet.nakshatraPada).toBeGreaterThanOrEqual(1);
      expect(planet.nakshatraPada).toBeLessThanOrEqual(4);
    }
  });

  it("returns a Lahiri-based sidereal ascendant and dasha timeline", () => {
    const report = calculateKundli(input);
    expect(report.ayanamsha.name).toContain("Lahiri");
    expect(report.ayanamsha.degrees).toBeGreaterThan(20);
    expect(report.ayanamsha.degrees).toBeLessThan(30);
    expect(report.ascendant.sign).toBeTruthy();
    expect(report.vimshottari.periods.length).toBe(18);
    expect(report.vimshottari.currentMahadasha.lord).toBeTruthy();
  });

  it("rejects invalid coordinates instead of silently producing a chart", () => {
    expect(() => calculateKundli({ ...input, latitude: 100 })).toThrow(/coordinates are invalid/i);
  });

  it("rejects invalid birth dates and times", () => {
    expect(() => calculateKundli({ ...input, date: "1990-02-31" })).toThrow(/invalid/i);
    expect(() => calculateKundli({ ...input, time: "28:70" })).toThrow(/invalid/i);
  });
});
