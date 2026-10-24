import { describe, expect, it } from "vitest";
import { calculateBirthPanchang, detectYogaCandidates } from "./vedic-features";
import type { PlanetPosition } from "./astrology";

describe("experimental birth Panchang", () => {
  it("computes tithi, paksha, yoga, karana, and local-date weekday deterministically", () => {
    const panchang = calculateBirthPanchang(0, 0, "2026-01-01");
    expect(panchang.paksha).toBe("Shukla");
    expect(panchang.tithi).toBe("Pratipada");
    expect(panchang.karana).toBe("Kimstughna");
    expect(panchang.vara).toBe("Thursday");
    expect(panchang.experimental).toBe(true);
  });

  it("distinguishes Purnima and Amavasya", () => {
    expect(calculateBirthPanchang(0, 179.9, "2026-01-01").tithi).toBe("Purnima");
    expect(calculateBirthPanchang(0, 359.9, "2026-01-01").tithi).toBe("Amavasya");
  });

  it("rejects invalid local dates", () => {
    expect(() => calculateBirthPanchang(0, 0, "2026-02-31")).toThrow(/valid local date/i);
  });
});

describe("experimental yoga candidates", () => {
  const planet = (name: string, longitude: number, signIndex: number) => ({
    name, longitude, signIndex, sign: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"][signIndex],
    degreeInSign: longitude % 30, house: 1, nakshatra: "Ashwini", nakshatraPada: 1, navamsaSign: "Aries", dashamsaSign: "Aries", retrograde: false,
  }) as PlanetPosition;

  it("reports only the simplified candidate rules that match the supplied data", () => {
    const candidates = detectYogaCandidates([
      planet("Sun", 100, 3), planet("Mercury", 108, 3), planet("Moon", 20, 0),
      planet("Mars", 25, 0), planet("Jupiter", 110, 3),
    ]);
    expect(candidates.map((item) => item.name)).toContain("Budha-Aditya (candidate)");
    expect(candidates.map((item) => item.name)).toContain("Chandra-Mangala (candidate)");
    expect(candidates.map((item) => item.name)).toContain("Gajakesari (candidate)");
    expect(candidates.every((item) => item.experimental)).toBe(true);
  });

  it("returns no candidate for an empty chart", () => {
    expect(detectYogaCandidates([])).toEqual([]);
  });
});
