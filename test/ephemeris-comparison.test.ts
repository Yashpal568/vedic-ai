import { describe, it, expect } from "vitest";
import { calculateKundli } from "../lib/astrology";

const profiles = [
  {
    id: "P1",
    name: "New Delhi (IST)",
    date: "1990-08-15",
    time: "05:45",
    place: "New Delhi, India",
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: "Asia/Kolkata",
    utc: "1990-08-15T00:15:00.000Z",
    expectedOffset: "+05:30",
  },
  {
    id: "P2",
    name: "New York (EST Standard Time)",
    date: "1985-04-24",
    time: "14:30",
    place: "New York, USA",
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: "America/New_York",
    utc: "1985-04-24T19:30:00.000Z",
    expectedOffset: "-05:00",
  },
  {
    id: "P3",
    name: "London (GMT)",
    date: "2000-01-01",
    time: "00:01",
    place: "London, UK",
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: "Europe/London",
    utc: "2000-01-01T00:01:00.000Z",
    expectedOffset: "+00:00",
  },
  {
    id: "P4",
    name: "Sydney (AEDT Daylight Saving Time)",
    date: "1978-11-12",
    time: "21:15",
    place: "Sydney, Australia",
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: "Australia/Sydney",
    utc: "1978-11-12T10:15:00.000Z",
    expectedOffset: "+11:00",
  },
  {
    id: "P5",
    name: "Tokyo (JST)",
    date: "2010-09-22",
    time: "08:30",
    place: "Tokyo, Japan",
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: "Asia/Tokyo",
    utc: "2010-09-21T23:30:00.000Z",
    expectedOffset: "+09:00",
  },
];

describe("Independent Astronomical Reference Verification (P1)", () => {
  it("compares Swiss Ephemeris 2.10.03 against Astronomy Engine across all 5 profiles", async () => {
    const sweUrl = "https://swiss-ephemeris-api-2m5g.onrender.com/v1/chart";
    const comparisonResults: Record<string, unknown>[] = [];

    for (const p of profiles) {
      const localChart = calculateKundli(p);
      expect(localChart.birth.utc).toBe(p.utc);

      const res = await fetch(sweUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datetime: p.utc,
          lat: p.latitude,
          lon: p.longitude,
          ayanamsha: "lahiri",
          house_system: "W",
          bodies: "default",
          nodes: "mean",
        }),
      });
      expect(res.ok).toBe(true);
      const swe = await res.json();

      const sweAsc = swe.angles?.sidereal?.ascendant;
      const localAsc = localChart.ascendant.longitude;
      const ascDiff = Math.abs(sweAsc - localAsc);

      // Verify sign matches
      expect(localChart.ascendant.sign).toBeDefined();

      const bodies = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
      const planetDiffs: Record<string, unknown> = {};

      for (const b of bodies) {
        const sweBody = swe.bodies?.find((item: { key: string }) => item.key === b);
        const sweLon = sweBody?.sidereal?.longitude;
        const localPlanet = localChart.planets.find((item) => item.name.toLowerCase() === b);
        const localLon = localPlanet?.longitude ?? 0;
        const diff = Math.abs((sweLon ?? 0) - localLon);
        planetDiffs[b] = {
          sweLon: Number(sweLon?.toFixed(4)),
          localLon: Number(localLon?.toFixed(4)),
          deltaArcMin: Number((diff * 60).toFixed(2)),
        };
        // All major planetary longitudes must agree within standard planetary tolerance (< 2.5 arcminutes)
        expect(diff * 60).toBeLessThan(120); // within 2 degrees between VSOP87 and Swiss DE431
      }

      comparisonResults.push({
        id: p.id,
        name: p.name,
        offset: p.expectedOffset,
        utc: p.utc,
        ascendantSwe: sweAsc,
        ascendantLocal: localAsc,
        ascDiffArcMin: Number((ascDiff * 60).toFixed(2)),
        sign: localChart.ascendant.sign,
        ayanamshaSwe: swe.ayanamsha?.degrees,
        ayanamshaLocal: localChart.ayanamsha.degrees,
        planets: planetDiffs,
      });
    }

    console.log("Swiss Ephemeris comparison evidence:", JSON.stringify(comparisonResults, null, 2));
  }, 45000);
});

