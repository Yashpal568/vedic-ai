import { Body, Ecliptic, GeoVector, SiderealTime } from "astronomy-engine";
import { vargaSignName } from "@/lib/vargas";
import { calculateBirthPanchang, detectYogaCandidates, type BirthPanchang, type YogaCandidate } from "@/lib/vedic-features";

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const SIGN_HINDI: Record<string, string> = {
  Aries: "मेष", Taurus: "वृषभ", Gemini: "मिथुन", Cancer: "कर्क",
  Leo: "सिंह", Virgo: "कन्या", Libra: "तुला", Scorpio: "वृश्चिक",
  Sagittarius: "धनु", Capricorn: "मकर", Aquarius: "कुंभ", Pisces: "मीन",
};

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
  "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
  "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula",
  "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
] as const;

const VIMSHOTTARI = [
  { lord: "Ketu", years: 7 }, { lord: "Venus", years: 20 },
  { lord: "Sun", years: 6 }, { lord: "Moon", years: 10 },
  { lord: "Mars", years: 7 }, { lord: "Rahu", years: 18 },
  { lord: "Jupiter", years: 16 }, { lord: "Saturn", years: 19 },
  { lord: "Mercury", years: 17 },
] as const;

const PLANETS = [
  { name: "Sun", body: Body.Sun }, { name: "Moon", body: Body.Moon },
  { name: "Mars", body: Body.Mars }, { name: "Mercury", body: Body.Mercury },
  { name: "Jupiter", body: Body.Jupiter }, { name: "Venus", body: Body.Venus },
  { name: "Saturn", body: Body.Saturn },
] as const;

export type PlanetPosition = {
  name: string;
  longitude: number;
  sign: string;
  signIndex: number;
  degreeInSign: number;
  house: number;
  nakshatra: string;
  nakshatraPada: number;
  navamsaSign: string;
  dashamsaSign: string;
  retrograde: boolean;
};

export type KundliReport = {
  engine: string;
  engineVersion: string;
  ayanamsha: { name: string; degrees: number };
  zodiac: "sidereal";
  houseSystem: "whole_sign";
  birth: { date: string; time: string; timezone: string; utc: string; place: string; latitude: number; longitude: number };
  ascendant: { longitude: number; sign: string; signIndex: number; degreeInSign: number; nakshatra: string; nakshatraPada: number };
  planets: PlanetPosition[];
  panchang: BirthPanchang;
  yogaCandidates: YogaCandidate[];
  vimshottari: { birthMahadasha: string; birthBalanceYears: number; currentMahadasha: { lord: string; start: string; end: string }; periods: { lord: string; start: string; end: string; years: number }[] };
  generatedAt: string;
  disclaimer: string;
};

function geocentricLongitude(body: Body, date: Date): number {
  // Use the Earth-centred apparent position, not Astronomy Engine's heliocentric EclipticLongitude.
  return Ecliptic(GeoVector(body, date, true)).elon;
}

const norm = (degrees: number) => ((degrees % 360) + 360) % 360;
const wrap180 = (degrees: number) => ((degrees + 540) % 360) - 180;

function lahiriAyanamsha(date: Date): number {
  const year = date.getUTCFullYear() + (date.getUTCMonth() + 0.5) / 12;
  const t = (year - 2000) / 100;
  // Lahiri/Chitrapaksha approximation at J2000 with long-term precession.
  return 23.853055 + 1.3969713 * (year - 2000) / 100 + 0.0003086 * t * t;
}

function signAt(longitude: number) {
  const signIndex = Math.floor(norm(longitude) / 30);
  return { signIndex, sign: SIGNS[signIndex], degreeInSign: norm(longitude) % 30 };
}

function lunarDetails(longitude: number) {
  const span = 360 / 27;
  const normalized = norm(longitude);
  const index = Math.floor(normalized / span);
  const fraction = (normalized - index * span) / span;
  return { nakshatra: NAKSHATRAS[index], nakshatraPada: Math.min(4, Math.floor(fraction * 4) + 1), fraction, index };
}

function navamsaSign(longitude: number) {
  return vargaSignName(longitude, 9);
}

function ascendantLongitude(date: Date, latitude: number, longitude: number) {
  const lst = norm(SiderealTime(date) * 15 + longitude) * Math.PI / 180;
  const lat = latitude * Math.PI / 180;
  const days = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const obliquity = (23.439291 - 0.00000036 * days / 365.25) * Math.PI / 180;
  const y = -Math.cos(lst);
  const x = Math.sin(obliquity) * Math.tan(lat) + Math.cos(obliquity) * Math.sin(lst);
  const angle = norm(Math.atan2(y, x) * 180 / Math.PI);
  // The formula's opposite intersection can occur depending on quadrant; use horizon/east test.
  const candidate = angle;
  const opposite = norm(angle + 180);
  const hourAngleFor = (lambda: number) => {
    const l = lambda * Math.PI / 180;
    const ra = Math.atan2(Math.cos(obliquity) * Math.sin(l), Math.cos(l));
    let h = lst - ra;
    while (h > Math.PI) h -= 2 * Math.PI;
    while (h < -Math.PI) h += 2 * Math.PI;
    return h;
  };
  const a = hourAngleFor(candidate);
  // The ascendant is the eastern intersection of the ecliptic and the horizon.
  return a < 0 ? candidate : opposite;
}

function nodeLongitude(date: Date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const t = (jd - 2451545.0) / 36525;
  return norm(125.04452 - 1934.136261 * t + 0.0020708 * t * t + t * t * t / 450000);
}

function getPosition(name: string, longitude: number, house: number, retrograde = false): PlanetPosition {
  const normalized = norm(longitude);
  const sign = signAt(normalized);
  const lunar = lunarDetails(normalized);
  return {
    name, longitude: Number(normalized.toFixed(5)), sign: sign.sign, signIndex: sign.signIndex,
    degreeInSign: Number(sign.degreeInSign.toFixed(4)), house,
    nakshatra: lunar.nakshatra, nakshatraPada: lunar.nakshatraPada,
    navamsaSign: navamsaSign(normalized), dashamsaSign: vargaSignName(normalized, 10), retrograde,
  };
}

function utcFromLocal(dateText: string, timeText: string, timezone: string): Date {
  const matchDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  const matchTime = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(timeText);
  if (!matchDate || !matchTime) throw new Error("Enter a valid birth date and local birth time.");
  const [, ys, mos, ds] = matchDate;
  const [, hs, mins, secs = "0"] = matchTime;
  const target = Date.UTC(Number(ys), Number(mos) - 1, Number(ds), Number(hs), Number(mins), Number(secs));
  const checkDate = new Date(target);
  if (checkDate.getUTCFullYear() !== Number(ys) || checkDate.getUTCMonth() !== Number(mos) - 1 || checkDate.getUTCDate() !== Number(ds) || Number(hs) > 23 || Number(mins) > 59 || Number(secs) > 59) {
    throw new Error("The birth date or time is invalid.");
  }
  let guess = target;
  const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    const delta = target - represented;
    guess += delta;
    if (delta === 0) break;
  }
  const result = new Date(guess);
  if (!Number.isFinite(result.getTime())) throw new Error("Could not resolve the local birth time.");
  // Iterative offset conversion alone can silently normalize nonexistent wall times
  // during a DST spring-forward gap. Verify the resolved instant round-trips to the
  // exact local date and time the user entered.
  const resolved = Object.fromEntries(formatter.formatToParts(result).map((p) => [p.type, p.value]));
  const roundTripMatches =
    Number(resolved.year) === Number(ys) &&
    Number(resolved.month) === Number(mos) &&
    Number(resolved.day) === Number(ds) &&
    Number(resolved.hour) === Number(hs) &&
    Number(resolved.minute) === Number(mins) &&
    Number(resolved.second) === Number(secs);
  if (!roundTripMatches) {
    throw new Error("This local birth time does not exist in " + timezone + " because of a daylight-saving time change. Choose a valid local time.");
  }
  // During a fall-back transition, the same wall-clock time can refer to two UTC
  // instants. Do not silently choose one without a user-selected offset.
  const targetParts = [Number(ys), Number(mos), Number(ds), Number(hs), Number(mins), Number(secs)];
  const matchesLocal = (candidate: Date) => {
    const parts = Object.fromEntries(formatter.formatToParts(candidate).map((p) => [p.type, p.value]));
    return [Number(parts.year), Number(parts.month), Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second)]
      .every((value, index) => value === targetParts[index]);
  };
  let ambiguous = false;
  for (let offsetMinutes = -180; offsetMinutes <= 180; offsetMinutes += 15) {
    if (offsetMinutes === 0) continue;
    if (matchesLocal(new Date(result.getTime() + offsetMinutes * 60_000))) {
      ambiguous = true;
      break;
    }
  }
  if (ambiguous) {
    throw new Error("This local birth time occurs twice in " + timezone + " because clocks move back. Choose the correct occurrence or provide a time that is not ambiguous.");
  }
  return result;
}

export function calculateKundli(input: {
  date: string; time: string; timezone: string; place: string; latitude: number; longitude: number;
}): KundliReport {
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90 || !Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) {
    throw new Error("The selected birthplace coordinates are invalid.");
  }
  const utc = utcFromLocal(input.date, input.time, input.timezone);
  const ayanamsha = lahiriAyanamsha(utc);
  const tropical = new Map<string, number>();
  for (const planet of PLANETS) tropical.set(planet.name, geocentricLongitude(planet.body, utc));
  const moonTropical = geocentricLongitude(Body.Moon, utc);
  const siderealAsc = norm(ascendantLongitude(utc, input.latitude, input.longitude) - ayanamsha);
  const asc = signAt(siderealAsc);
  const ascNak = lunarDetails(siderealAsc);
  const planets: PlanetPosition[] = [];
  for (const planet of PLANETS) {
    const current = tropical.get(planet.name)!;
    const yesterday = geocentricLongitude(planet.body, new Date(utc.getTime() - 86400000));
    const sidereal = norm(current - ayanamsha);
    const sign = signAt(sidereal);
    planets.push(getPosition(planet.name, sidereal, (sign.signIndex - asc.signIndex + 12) % 12 + 1, wrap180(current - yesterday) < 0));
  }
  const rahuTropical = nodeLongitude(utc);
  const rahuSidereal = norm(rahuTropical - ayanamsha);
  const ketuSidereal = norm(rahuSidereal + 180);
  for (const [name, longitude] of [["Rahu", rahuSidereal], ["Ketu", ketuSidereal]] as const) {
    const sign = signAt(longitude);
    planets.push(getPosition(name, longitude, (sign.signIndex - asc.signIndex + 12) % 12 + 1, true));
  }
  const moonSidereal = norm(moonTropical - ayanamsha);
  const moon = lunarDetails(moonSidereal);
  const birthLordIndex = moon.index % 9;
  const birthLord = VIMSHOTTARI[birthLordIndex];
  const balanceYears = birthLord.years * (1 - moon.fraction);
  const periods: { lord: string; start: string; end: string; years: number }[] = [];
  let cursor = new Date(utc.getTime() - (birthLord.years - balanceYears) * 365.2425 * 86400000);
  for (let i = 0; i < 18; i++) {
    const lord = VIMSHOTTARI[(birthLordIndex + i) % 9];
    const start = new Date(cursor);
    const end = new Date(start.getTime() + lord.years * 365.2425 * 86400000);
    periods.push({ lord: lord.lord, start: start.toISOString(), end: end.toISOString(), years: lord.years });
    cursor = end;
  }
  const currentPeriod = periods.find((period) => new Date(period.start) <= utc && new Date(period.end) > utc) || periods[0];
  const currentMahadasha = periods.find((period) => new Date(period.start) <= new Date() && new Date(period.end) > new Date()) || currentPeriod;
  const sortedPlanets = planets.sort((a, b) => ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].indexOf(a.name) - ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].indexOf(b.name));
  const sunPosition = sortedPlanets.find((planet) => planet.name === "Sun");
  const moonPosition = sortedPlanets.find((planet) => planet.name === "Moon");
  if (!sunPosition || !moonPosition) throw new Error("The chart engine did not produce the Sun and Moon positions required for Panchang.");
  return {
    engine: "Astronomy Engine + Vedic sidereal conversion",
    engineVersion: "astronomy-engine 2.1.x; Lahiri approximation v1",
    ayanamsha: { name: "Lahiri (approximation)", degrees: Number(ayanamsha.toFixed(6)) },
    zodiac: "sidereal", houseSystem: "whole_sign",
    birth: { date: input.date, time: input.time, timezone: input.timezone, utc: utc.toISOString(), place: input.place, latitude: input.latitude, longitude: input.longitude },
    ascendant: { longitude: Number(siderealAsc.toFixed(5)), sign: asc.sign, signIndex: asc.signIndex, degreeInSign: Number(asc.degreeInSign.toFixed(4)), nakshatra: ascNak.nakshatra, nakshatraPada: ascNak.nakshatraPada },
    planets: sortedPlanets,
    panchang: calculateBirthPanchang(sunPosition.longitude, moonPosition.longitude, input.date),
    yogaCandidates: detectYogaCandidates(sortedPlanets),
    vimshottari: { birthMahadasha: birthLord.lord, birthBalanceYears: Number(balanceYears.toFixed(3)), currentMahadasha: { lord: currentMahadasha.lord, start: currentMahadasha.start, end: currentMahadasha.end }, periods },
    generatedAt: new Date().toISOString(),
    disclaimer: "Astronomical positions use Astronomy Engine with an approximate Lahiri ayanamsha and simplified mean lunar-node formula. This is an early calculation engine and must be validated against trusted Jyotish reference charts before use for paid or high-accuracy readings.",
  };
}

export function getSignName(sign: string, language: "en" | "hi" = "en") {
  return language === "hi" ? SIGN_HINDI[sign] || sign : sign;
}
