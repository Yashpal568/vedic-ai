import type { PlanetPosition } from "@/lib/astrology";

const TITHIS = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
  "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
] as const;
const YOGAS = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
  "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
  "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti",
] as const;
const MOVABLE_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"] as const;
const norm = (value: number) => ((value % 360) + 360) % 360;

export type BirthPanchang = {
  paksha: "Shukla" | "Krishna";
  tithi: string;
  tithiNumber: number;
  yoga: string;
  karana: string;
  vara: string;
  experimental: true;
  note: string;
};

export type YogaCandidate = {
  name: string;
  rule: string;
  reason: string;
  experimental: true;
};

export function calculateBirthPanchang(sunLongitude: number, moonLongitude: number, localDate: string): BirthPanchang {
  const elongation = norm(moonLongitude - sunLongitude);
  const tithiIndex = Math.floor(elongation / 12);
  const paksha = tithiIndex < 15 ? "Shukla" : "Krishna";
  const tithiNumber = (tithiIndex % 15) + 1;
  const tithi = tithiNumber === 15
    ? (paksha === "Shukla" ? "Purnima" : "Amavasya")
    : TITHIS[tithiNumber - 1];
  const yogaIndex = Math.floor(norm(sunLongitude + moonLongitude) / (360 / 27));
  const karanaIndex = Math.floor(elongation / 6);
  let karana: string;
  if (karanaIndex === 0) karana = "Kimstughna";
  else if (karanaIndex >= 57) karana = (["Shakuni", "Chatushpada", "Naga"] as const)[karanaIndex - 57];
  else karana = MOVABLE_KARANAS[(karanaIndex - 1) % MOVABLE_KARANAS.length];
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(localDate) ? new Date(localDate + "T12:00:00Z") : new Date(Number.NaN);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== localDate) {
    throw new Error("A valid local date is required for Panchang calculation.");
  }
  const varas = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return {
    paksha, tithi, tithiNumber, yoga: YOGAS[yogaIndex], karana, vara: varas[parsedDate.getUTCDay()],
    experimental: true,
    note: "Experimental birth Panchang derived from the app's current chart longitudes; independently validate the ephemeris and conventions before relying on it.",
  };
}

export function detectYogaCandidates(planets: PlanetPosition[]): YogaCandidate[] {
  const byName = new Map(planets.map((planet) => [planet.name, planet]));
  const sun = byName.get("Sun");
  const moon = byName.get("Moon");
  const mars = byName.get("Mars");
  const mercury = byName.get("Mercury");
  const jupiter = byName.get("Jupiter");
  const candidates: YogaCandidate[] = [];
  const add = (name: string, rule: string, reason: string) => candidates.push({ name, rule, reason, experimental: true });

  if (sun && mercury) {
    const separation = Math.abs(((sun.longitude - mercury.longitude + 540) % 360) - 180);
    if (separation <= 12) add("Budha-Aditya (candidate)", "Sun–Mercury longitude separation ≤ 12°", "The current engine reports a close Sun–Mercury conjunction. This simplified rule does not apply all traditional conditions.");
  }
  if (moon && mars && moon.signIndex === mars.signIndex) {
    add("Chandra-Mangala (candidate)", "Moon and Mars occupy the same sidereal sign", "Moon and Mars share a sign in the current calculation output. This sign-level heuristic is not a full classical assessment.");
  }
  if (moon && jupiter) {
    const distance = (jupiter.signIndex - moon.signIndex + 12) % 12;
    if ([0, 3, 6, 9].includes(distance)) {
      add("Gajakesari (candidate)", "Jupiter is in a kendra sign from the Moon (0, 3, 6, or 9 sign steps)", "The sign relationship matches a simplified kendra rule; traditional conditions, strengths, and cancellations have not been assessed.");
    }
  }
  return candidates;
}
