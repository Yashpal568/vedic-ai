import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateSwissKundli } from "../lib/swiss-ephemeris-client";

const profile = {
  date: "1990-08-15",
  time: "05:45",
  place: "New Delhi, India",
  latitude: 28.6139,
  longitude: 77.209,
  timezone: "Asia/Kolkata",
};

function makeChart(includeMeanNode = true) {
  const bodies = [
    { key: "sun", sidereal: { longitude: 118.2048, longitude_speed: 0.9608, retrograde: false } },
    { key: "moon", sidereal: { longitude: 46.1071, longitude_speed: 14.2623, retrograde: false } },
    { key: "mars", sidereal: { longitude: 27.3726, longitude_speed: 0.5777, retrograde: false } },
    { key: "mercury", sidereal: { longitude: 145.2912, longitude_speed: 0.7876, retrograde: false } },
    { key: "jupiter", sidereal: { longitude: 95.5642, longitude_speed: 0.2147, retrograde: false } },
    { key: "venus", sidereal: { longitude: 97.6009, longitude_speed: 1.221, retrograde: false } },
    { key: "saturn", sidereal: { longitude: 266.1591, longitude_speed: -0.0567, retrograde: true } },
    { key: "true_node", sidereal: { longitude: 283.50066389, longitude_speed: 0.01286587, retrograde: false } },
  ];
  if (includeMeanNode) {
    bodies.push({
      key: "mean_node",
      sidereal: { longitude: 282.76401703, longitude_speed: -0.05299205, retrograde: true },
    });
  }
  return {
    meta: { swe_version: "2.10.03" },
    bodies,
    angles: { sidereal: { ascendant: 116.26968273 } },
    ayanamsha: { degrees: 23.73011596, name: "Lahiri" },
  };
}

function mockChartResponse(chart: ReturnType<typeof makeChart>) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(chart), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Mean Node consistency for Rahu and Ketu", () => {
  it("uses mean_node even when true_node is also present", async () => {
    const fetchMock = mockChartResponse(makeChart(true));
    const report = await calculateSwissKundli(profile);
    const rahu = report.planets.find((planet) => planet.name === "Rahu");
    const ketu = report.planets.find((planet) => planet.name === "Ketu");

    expect(fetchMock).toHaveBeenCalledOnce();
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(requestBody.nodes).toBe("mean");

    expect(rahu?.longitude).toBeCloseTo(282.76401703, 7);
    expect(rahu?.sign).toBe("Capricorn");
    expect(rahu?.house).toBe(7);
    expect(rahu?.nakshatra).toBe("Shravana");
    expect(rahu?.nakshatraPada).toBe(1);
    expect(rahu?.navamsaSign).toBe("Aries");
    expect(rahu?.dashamsaSign).toBe("Capricorn");
    expect(rahu?.retrograde).toBe(true);

    expect(ketu?.longitude).toBeCloseTo(102.76401703, 7);
    expect(ketu?.sign).toBe("Cancer");
    expect(ketu?.house).toBe(1);
    expect(ketu?.nakshatra).toBe("Pushya");
    expect(ketu?.nakshatraPada).toBe(3);
    expect(ketu?.navamsaSign).toBe("Libra");
    expect(ketu?.dashamsaSign).toBe("Cancer");
    expect(ketu?.retrograde).toBe(true);
    expect(((ketu!.longitude - rahu!.longitude + 360) % 360)).toBeCloseTo(180, 7);
  });

  it("does not fall back to true_node when mean_node is missing", async () => {
    mockChartResponse(makeChart(false));
    await expect(calculateSwissKundli(profile)).rejects.toThrow(
      "Swiss Ephemeris response is missing required mean_node. True node fallback is disallowed.",
    );
  });

  it("preserves the Lahiri sidereal whole-sign calculation configuration", async () => {
    mockChartResponse(makeChart(true));
    const report = await calculateSwissKundli(profile);

    expect(report.engine).toBe("Swiss Ephemeris");
    expect(report.ayanamsha.name).toBe("Lahiri");
    expect(report.zodiac).toBe("sidereal");
    expect(report.houseSystem).toBe("whole_sign");
  });
});
