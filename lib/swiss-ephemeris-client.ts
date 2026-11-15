import { calculateKundli, NAKSHATRAS, SIGNS, type KundliReport, type PlanetPosition } from "@/lib/astrology";
import { calculateBirthPanchang, detectYogaCandidates } from "@/lib/vedic-features";
import { vargaSignName } from "@/lib/vargas";

type KundliInput = {
  date: string;
  time: string;
  place: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type SwissBody = {
  key: string;
  sidereal?: { longitude?: number; longitude_speed?: number; retrograde?: boolean };
};

type SwissChart = {
  meta?: { swe_version?: string; ayanamsha?: { name?: string } };
  bodies?: SwissBody[];
  angles?: { sidereal?: { ascendant?: number } };
  ayanamsha?: { degrees?: number; name?: string };
};

const norm = (value: number) => ((value % 360) + 360) % 360;
const VIMSHOTTARI = [
  { lord: "Ketu", years: 7 }, { lord: "Venus", years: 20 },
  { lord: "Sun", years: 6 }, { lord: "Moon", years: 10 },
  { lord: "Mars", years: 7 }, { lord: "Rahu", years: 18 },
  { lord: "Jupiter", years: 16 }, { lord: "Saturn", years: 19 },
  { lord: "Mercury", years: 17 },
] as const;

function lunarDetails(longitude: number) {
  const span = 360 / 27;
  const normalized = norm(longitude);
  const index = Math.min(26, Math.floor(normalized / span));
  const fraction = (normalized - index * span) / span;
  return {
    index,
    fraction,
    nakshatra: NAKSHATRAS[index],
    nakshatraPada: Math.min(4, Math.floor(fraction * 4) + 1),
  };
}

function position(name: string, longitude: number, ascSignIndex: number, retrograde: boolean): PlanetPosition {
  const normalized = norm(longitude);
  const signIndex = Math.floor(normalized / 30);
  const lunar = lunarDetails(normalized);
  return {
    name,
    longitude: Number(normalized.toFixed(8)),
    sign: SIGNS[signIndex],
    signIndex,
    degreeInSign: Number((normalized % 30).toFixed(6)),
    house: ((signIndex - ascSignIndex + 12) % 12) + 1,
    nakshatra: lunar.nakshatra,
    nakshatraPada: lunar.nakshatraPada,
    navamsaSign: vargaSignName(normalized, 9),
    dashamsaSign: vargaSignName(normalized, 10),
    retrograde,
  };
}

function buildVimshottari(moonLongitude: number, birthUtc: string): KundliReport["vimshottari"] {
  const lunar = lunarDetails(moonLongitude);
  const birthLord = VIMSHOTTARI[lunar.index % 9];
  const balanceYears = birthLord.years * (1 - lunar.fraction);
  const birth = new Date(birthUtc);
  let cursor = new Date(birth.getTime() - (birthLord.years - balanceYears) * 365.2425 * 86400000);
  const periods: KundliReport["vimshottari"]["periods"] = [];
  for (let i = 0; i < 18; i += 1) {
    const lord = VIMSHOTTARI[(lunar.index % 9 + i) % 9];
    const start = new Date(cursor);
    const end = new Date(start.getTime() + lord.years * 365.2425 * 86400000);
    periods.push({ lord: lord.lord, start: start.toISOString(), end: end.toISOString(), years: lord.years });
    cursor = end;
  }
  const now = Date.now();
  const current = periods.find((period) => Date.parse(period.start) <= now && Date.parse(period.end) > now) || periods[periods.length - 1];
  return {
    birthMahadasha: birthLord.lord,
    birthBalanceYears: Number(balanceYears.toFixed(3)),
    currentMahadasha: { lord: current.lord, start: current.start, end: current.end },
    periods,
  };
}

export async function calculateSwissKundli(input: KundliInput): Promise<KundliReport> {
  // Reuse the existing strict local-time/DST validation before calling the ephemeris.
  const validated = calculateKundli(input);
  const baseUrl = (process.env.SWISS_EPHEMERIS_API_URL || "https://swiss-ephemeris-api-2m5g.onrender.com").replace(/\/+$/, "");
  const response = await fetch(baseUrl + "/v1/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      datetime: validated.birth.utc,
      lat: input.latitude,
      lon: input.longitude,
      ayanamsha: "lahiri",
      house_system: "W",
      bodies: "default",
      nodes: "mean",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Swiss Ephemeris service returned " + response.status + (detail ? ": " + detail.slice(0, 240) : ""));
  }

  const chart = await response.json() as SwissChart;
  const ascLongitude = chart.angles?.sidereal?.ascendant;
  const ayanamshaDegrees = chart.ayanamsha?.degrees;
  if (!Array.isArray(chart.bodies) || !Number.isFinite(ascLongitude) || !Number.isFinite(ayanamshaDegrees)) {
    throw new Error("Swiss Ephemeris returned an incomplete chart. No approximate chart was substituted.");
  }

  const ascNorm = norm(ascLongitude as number);
  const ascSignIndex = Math.floor(ascNorm / 30);
  const ascLunar = lunarDetails(ascNorm);
  const findBody = (key: string) => chart.bodies!.find((body) => body.key === key && Number.isFinite(body.sidereal?.longitude));
  const required = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
  const missing = required.filter((key) => !findBody(key));
  if (missing.length) throw new Error("Swiss Ephemeris response is missing: " + missing.join(", "));

  const names: Array<[string, string]> = [
    ["Sun", "sun"], ["Moon", "moon"], ["Mars", "mars"], ["Mercury", "mercury"],
    ["Jupiter", "jupiter"], ["Venus", "venus"], ["Saturn", "saturn"],
  ];
  const planets = names.map(([name, key]) => {
    const body = findBody(key)!;
    return position(name, body.sidereal!.longitude!, ascSignIndex,
      body.sidereal!.retrograde ?? (body.sidereal!.longitude_speed ?? 0) < 0);
  });
  const rahuBody = findBody("true_node") || findBody("mean_node");
  if (rahuBody) {
    const rahu = position("Rahu", rahuBody.sidereal!.longitude!, ascSignIndex,
      rahuBody.sidereal!.retrograde ?? (rahuBody.sidereal!.longitude_speed ?? 0) < 0);
    const ketu = position("Ketu", norm(rahu.longitude + 180), ascSignIndex, rahu.retrograde);
    planets.push(rahu, ketu);
  }
  const sun = planets.find((planet) => planet.name === "Sun")!;
  const moon = planets.find((planet) => planet.name === "Moon")!;
  const ascendant = {
    longitude: Number(ascNorm.toFixed(8)),
    sign: SIGNS[ascSignIndex],
    signIndex: ascSignIndex,
    degreeInSign: Number((ascNorm % 30).toFixed(6)),
    nakshatra: ascLunar.nakshatra,
    nakshatraPada: ascLunar.nakshatraPada,
  };

  return {
    ...validated,
    engine: "Swiss Ephemeris",
    engineVersion: chart.meta?.swe_version || "Swiss Ephemeris API",
    ayanamsha: { name: chart.ayanamsha?.name || chart.meta?.ayanamsha?.name || "Lahiri", degrees: ayanamshaDegrees as number },
    zodiac: "sidereal",
    houseSystem: "whole_sign",
    ascendant,
    planets,
    panchang: calculateBirthPanchang(sun.longitude, moon.longitude, input.date),
    yogaCandidates: detectYogaCandidates(planets),
    vimshottari: buildVimshottari(moon.longitude, validated.birth.utc),
    generatedAt: new Date().toISOString(),
    disclaimer: "Planetary longitudes and ascendant are calculated by Swiss Ephemeris using Lahiri sidereal settings and whole-sign houses. Traditional Jyotish interpretations are symbolic, not scientifically established predictions.",
  };
}
