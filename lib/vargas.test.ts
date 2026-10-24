import { describe, expect, it } from "vitest";
import { vargaSignIndex } from "./vargas";

// Independent numerical reference outputs from the 1994 Delhi reference chart
// published in librejyotish's reference_charts/fixtures.json. These tests validate
// the D9/D10 mapping from a supplied longitude; they do NOT validate this app's
// ephemeris, ayanamsha, ascendant, or full chart calculations.
const referenceLongitudes = [
  ["Sun", 336.7396, 6, 10],
  ["Moon", 76.7942, 12, 8],
  ["Mars", 317.1607, 12, 4],
  ["Mercury", 309.2005, 9, 2],
  ["Jupiter", 200.2045, 1, 1],
  ["Venus", 352.0896, 10, 3],
  ["Saturn", 312.3613, 10, 3],
  ["Rahu", 211.6087, 4, 4],
  ["Ketu", 31.6087, 10, 10],
] as const;

describe("varga sign mapping", () => {
  it("matches independent D9/Navamsa reference outputs for supplied longitudes", () => {
    for (const [name, longitude, d9] of referenceLongitudes) {
      expect(vargaSignIndex(longitude, 9), name).toBe(d9 - 1);
    }
  });

  it("matches independent D10/Dashamsa reference outputs for supplied longitudes", () => {
    for (const [name, longitude, _d9, d10] of referenceLongitudes) {
      expect(vargaSignIndex(longitude, 10), name).toBe(d10 - 1);
    }
  });

  it("normalizes negative and over-360-degree longitudes", () => {
    expect(vargaSignIndex(-1, 9)).toBe(vargaSignIndex(359, 9));
    expect(vargaSignIndex(721, 10)).toBe(vargaSignIndex(1, 10));
  });

  it("rejects non-finite longitudes", () => {
    expect(() => vargaSignIndex(Number.NaN, 9)).toThrow(/finite longitude/i);
  });
});
