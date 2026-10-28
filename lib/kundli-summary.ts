import { SIGNS, type KundliReport, type PlanetPosition } from "@/lib/astrology";

export type KundliHouseSummary = {
  house: number;
  sign: string;
  planets: string[];
  title: string;
  explanation: string;
};

export type KundliPlanetSummary = {
  name: string;
  sign: string;
  house: number;
  nakshatra: string;
  explanation: string;
};

const HOUSE_TOPICS = [
  "yourself, your personality and first impressions",
  "money, family and the way you speak",
  "communication, courage and siblings",
  "home, comfort and family life",
  "learning, creativity, fun and children",
  "daily routines, work habits and challenges",
  "close relationships and partnerships",
  "shared money, major changes and deeper topics",
  "beliefs, higher learning and long journeys",
  "career, duties and public life",
  "friends, groups and long-term goals",
  "rest, privacy, expenses and letting go",
];

const PLANET_MEANINGS: Record<string, string> = {
  Sun: "confidence, identity and responsibility",
  Moon: "feelings, comfort and everyday moods",
  Mars: "energy, action and courage",
  Mercury: "thinking, learning and communication",
  Jupiter: "growth, learning and guidance",
  Venus: "relationships, harmony and what you enjoy",
  Saturn: "patience, effort and responsibility",
  Rahu: "ambition, curiosity and unusual interests",
  Ketu: "reflection, distance and simplifying priorities",
};

const SIGN_MEANINGS: Record<string, string> = {
  Aries: "active and ready to start", Taurus: "steady and practical",
  Gemini: "curious and communicative", Cancer: "caring and protective",
  Leo: "expressive and creative", Virgo: "careful and detail-focused",
  Libra: "cooperative and fairness-minded", Scorpio: "private and focused",
  Sagittarius: "curious about meaning and new experiences", Capricorn: "patient and goal-focused",
  Aquarius: "independent and idea-focused", Pisces: "imaginative and reflective",
};

const plainDate = (value: string, timezone: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: timezone }).format(date);
  } catch {
    return value.slice(0, 10);
  }
};

export function buildKundliPlanetSummary(report: KundliReport): KundliPlanetSummary[] {
  return report.planets.map((planet: PlanetPosition) => {
    const meaning = PLANET_MEANINGS[planet.name] || "a traditional symbolic theme";
    const signStyle = SIGN_MEANINGS[planet.sign] || "individual and context-dependent";
    return {
      name: planet.name,
      sign: planet.sign,
      house: planet.house,
      nakshatra: planet.nakshatra,
      explanation: planet.name + " is in " + planet.sign + ", house " + planet.house + ". In traditional Jyotish, " + planet.name + " is linked with " + meaning + "; " + planet.sign + " is often described as " + signStyle + ". Treat this as a symbolic tradition, not a proven description or prediction.",
    };
  });
}

export function buildKundliHouseSummary(report: KundliReport): KundliHouseSummary[] {
  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const sign = SIGNS[(report.ascendant.signIndex + house - 1) % 12];
    const planets = report.planets.filter((planet) => planet.house === house);
    const planetNames = planets.map((planet) => planet.name);
    const signStyle = SIGN_MEANINGS[sign] || "individual and context-dependent";
    const planetStyle = planets.length
      ? " Planets shown here: " + planets.map((planet) => planet.name + " (traditionally linked with " + (PLANET_MEANINGS[planet.name] || "a symbolic theme") + ")").join("; ") + "."
      : " No major planet from this report is placed here. Astrologers may still look at the sign and its ruling planet when discussing this house.";
    return {
      house,
      sign,
      planets: planetNames,
      title: HOUSE_TOPICS[index].charAt(0).toUpperCase() + HOUSE_TOPICS[index].slice(1),
      explanation: "This house is traditionally about " + HOUSE_TOPICS[index] + ". Its sign is " + sign + ", often described as " + signStyle + "." + planetStyle,
    };
  });
}

export function buildKundliSimpleSummary(report: KundliReport): string[] {
  const moon = report.planets.find((planet) => planet.name === "Moon");
  const sun = report.planets.find((planet) => planet.name === "Sun");
  const current = report.vimshottari.currentMahadasha;
  const occupiedHouses = new Set(report.planets.map((planet) => planet.house)).size;
  const yogas = report.yogaCandidates || [];
  const summary = [
    "Your chart starts with " + report.ascendant.sign + " rising (your Lagna). Astrologers use this as the starting point for talking about your approach to life; it does not define who you must be.",
    "Your Moon is in " + (moon?.sign || "an unavailable sign") + (moon?.nakshatra ? " and the " + moon.nakshatra + " nakshatra" : "") + ". In Jyotish, the Moon is often used when discussing feelings, comfort and habits.",
  ];
  if (sun) summary.push("Your Sun is in " + sun.sign + " in house " + sun.house + ". In traditional astrology, the Sun is linked with confidence, identity and responsibility.");
  summary.push(
    "The report places planets in " + occupiedHouses + " of the 12 houses. Each house represents a different life area; an empty house does not mean that the area is missing or will not matter.",
    "Your calculated Mahadasha is " + current.lord + ", from " + plainDate(current.start, report.birth.timezone) + " to " + plainDate(current.end, report.birth.timezone) + ". Jyotish treats this as a traditional timing cycle, not a guarantee of future events.",
    "Your birth Panchang lists " + (report.panchang?.paksha || "—") + " paksha, " + (report.panchang?.tithi || "—") + " tithi, " + (report.panchang?.yoga || "—") + " yoga and " + (report.panchang?.karana || "—") + " karana. These are calendar terms; this app marks the calculation as experimental.",
    yogas.length
      ? "The app flagged " + yogas.length + " possible yoga pattern" + (yogas.length === 1 ? "" : "s") + ". These are early candidates only, not confirmed classical yogas."
      : "The current simplified rules did not flag a yoga. That does not prove that no traditional yoga exists in your chart.",
    "In short: use the chart as a guide to learn traditional Jyotish terms, not as a fixed verdict about your personality or future. This calculation engine still needs independent accuracy checks, and your choices and circumstances matter.",
  );
  return summary;
}
