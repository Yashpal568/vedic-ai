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

const NAKSHATRA_MEANING = "Nakshatra means a lunar star area: one of 27 traditional sections of the zodiac used to describe the Moon's position.";
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
      explanation:
        planet.name + " is in " + planet.sign + ", house " + planet.house + ". " +
        "A house (Bhava) is a life area in the chart; " + planet.name + " is traditionally linked with " + meaning + ". " +
        planet.sign + " is often described as " + signStyle + ". " +
        (planet.nakshatra ? "Its Nakshatra is " + planet.nakshatra + ". " + NAKSHATRA_MEANING : "Nakshatra information is not available.") +
        " These are traditional symbols for reflection, not proven facts or guaranteed predictions.",
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
      : " No major planet from this report is placed here. An empty house does not mean that this area of life is missing or unimportant.";
    return {
      house,
      sign,
      planets: planetNames,
      title: HOUSE_TOPICS[index].charAt(0).toUpperCase() + HOUSE_TOPICS[index].slice(1),
      explanation:
        "House " + house + " (Bhava) represents " + HOUSE_TOPICS[index] + ". " +
        "Its sign is " + sign + ", traditionally described as " + signStyle + "." + planetStyle +
        " A sign (Rashi) is the zodiac sign occupying this house in the displayed whole-sign chart.",
    };
  });
}

export function buildKundliSimpleSummary(report: KundliReport): string[] {
  const moon = report.planets.find((planet) => planet.name === "Moon");
  const sun = report.planets.find((planet) => planet.name === "Sun");
  const current = report.vimshottari.currentMahadasha;
  const occupiedHouses = new Set(report.planets.map((planet) => planet.house)).size;
  const yogas = report.yogaCandidates || [];
  const panchang = report.panchang;
  const summary = [
    "Your chart starts with " + report.ascendant.sign + " rising (your Lagna or Ascendant). This is the first house and the starting point astrologers use to read the chart. It does not define who you must be.",
    "Your Moon is in " + (moon?.sign || "an unavailable sign") + (moon?.nakshatra ? " and the " + moon.nakshatra + " Nakshatra" : "") + ". The Moon is traditionally linked with feelings and daily habits. " + NAKSHATRA_MEANING,
  ];
  if (sun) summary.push("Your Sun is in " + sun.sign + " in house " + sun.house + ". In traditional astrology, the Sun is linked with confidence, identity and responsibility.");
  summary.push(
    "The report places planets in " + occupiedHouses + " of the 12 houses. A house (Bhava) represents one area of life. An empty house does not mean that the area is missing or will never matter.",
    "Your calculated Mahadasha is " + current.lord + ", from " + plainDate(current.start, report.birth.timezone) + " to " + plainDate(current.end, report.birth.timezone) + ". Mahadasha means a major planetary time period in the traditional Vimshottari system. It is a timing framework, not a guarantee of future events.",
    "Your birth Panchang lists " + (panchang?.paksha || "—") + " paksha, " + (panchang?.tithi || "—") + " tithi, " + (panchang?.yoga || "—") + " yoga and " + (panchang?.karana || "—") + " karana. Panchang is a traditional five-part calendar: Vara = weekday, Tithi = lunar day, Paksha = waxing or waning Moon phase, Yoga = a calculated Sun-Moon combination, and Karana = half a Tithi. This app marks these birth values as experimental; verify them independently.",
    yogas.length
      ? "The app flagged " + yogas.length + " possible Yoga pattern" + (yogas.length === 1 ? "" : "s") + ". Yoga means a traditional combination of chart factors. These are early candidates only, not confirmed classical Yogas; the full rules and exceptions are not yet assessed."
      : "The current simplified rules did not flag a Yoga. Yoga means a traditional combination of chart factors. This does not prove that no classical Yoga exists in your chart.",
    "Degrees show how far a planet has moved within its zodiac sign. Direct means its apparent motion is forward; retrograde means it appears to move backward from Earth. D9 (Navamsa) and D10 (Dashamsa) are additional divisional charts used in traditional readings.",
    "In short: use this chart to learn traditional Jyotish terms, not as a fixed verdict about your personality or future. The calculation engine still needs independent accuracy checks, and your choices and circumstances matter.",
  );
  return summary;
}
