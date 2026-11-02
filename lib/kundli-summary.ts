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
  "You and your personality",
  "Money, family and speech",
  "Communication, courage and siblings",
  "Home, comfort and family",
  "Creativity, learning and children",
  "Work habits, health routines and challenges",
  "Marriage and close partnerships",
  "Shared money and major life changes",
  "Beliefs, higher learning and travel",
  "Career, work and public reputation",
  "Friends, networks and long-term goals",
  "Rest, privacy and expenses",
];

const PLANET_MEANINGS: Record<string, string> = {
  Sun: "confidence, identity and purpose",
  Moon: "emotions, comfort and the mind",
  Mars: "energy, courage and how you take action",
  Mercury: "thinking, communication and learning",
  Jupiter: "growth, knowledge and guidance",
  Venus: "love, relationships, beauty and enjoyment",
  Saturn: "discipline, patience and responsibility",
  Rahu: "strong desires, ambition and new experiences",
  Ketu: "letting go, reflection and inner growth",
};

const SIGN_MEANINGS: Record<string, string> = {
  Aries: "bold and action-oriented", Taurus: "steady and practical",
  Gemini: "curious and communicative", Cancer: "caring and protective",
  Leo: "expressive and creative", Virgo: "careful and organised",
  Libra: "cooperative and fairness-minded", Scorpio: "private and determined",
  Sagittarius: "open to learning and new experiences", Capricorn: "patient and goal-focused",
  Aquarius: "independent and idea-focused", Pisces: "imaginative and sensitive",
};

const NAKSHATRA_MEANING = "Nakshatra means a lunar star group. In Vedic astrology, the sky is divided into 27 such groups, and the Moon's position is used to identify yours.";

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
    const meaning = PLANET_MEANINGS[planet.name] || "a traditional life theme";
    const signStyle = SIGN_MEANINGS[planet.sign] || "unique to the individual";
    return {
      name: planet.name,
      sign: planet.sign,
      house: planet.house,
      nakshatra: planet.nakshatra,
      explanation:
        "In your chart, " + planet.name + " is in " + planet.sign + " and house " + planet.house + ". " +
        "In simple terms, " + planet.name + " represents " + meaning + ". " +
        planet.sign + " is traditionally described as " + signStyle + ". " +
        (planet.nakshatra ? "Its Nakshatra (lunar star group) is " + planet.nakshatra + ". " : "") +
        "Astrologers read these factors together; one placement alone does not decide an outcome.",
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
    const planetText = planets.length
      ? " Planets here: " + planetNames.join(", ") + "."
      : " No major planet is listed in this house. That does not mean this part of life is unimportant.";
    return {
      house,
      sign,
      planets: planetNames,
      title: HOUSE_TOPICS[index],
      explanation:
        "This house is traditionally connected with " + HOUSE_TOPICS[index].toLowerCase() + ". " +
        "Its sign is " + sign + ", often described as " + signStyle + "." + planetText,
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
    "Your rising sign (Lagna) is " + report.ascendant.sign + ". In a Kundli, this is the sign in the first house. Astrologers use it as the starting point for understanding your approach to life; it is not a fixed label for your personality.",
    moon
      ? "Your Moon is in " + moon.sign + (moon.nakshatra ? " and the " + moon.nakshatra + " Nakshatra" : "") + ". The Moon is traditionally linked with feelings, comfort and everyday habits. " + NAKSHATRA_MEANING
      : "Your Moon placement is not available in this report, so a Moon-based interpretation is not included.",
    sun
      ? "Your Sun is in " + sun.sign + ", in house " + sun.house + ". In simple terms, astrologers connect the Sun with confidence, identity and purpose."
      : "Your Sun placement is not available in this report.",
    "Your planets appear in " + occupiedHouses + " of the 12 houses. Each house represents a different part of life, such as family, work or relationships. An empty house does not mean that area will be absent from your life.",
    "Your current major period (Mahadasha) is " + current.lord + ", from " + plainDate(current.start, report.birth.timezone) + " to " + plainDate(current.end, report.birth.timezone) + ". Think of Mahadasha as a long chapter in the traditional astrology calendar. It is not a promise that a particular event will happen.",
  ];
  if (panchang) {
    summary.push(
      "Your birth Panchang is a traditional five-part calendar. This report shows " + (panchang.paksha || "—") + " Paksha (Moon phase), " + (panchang.tithi || "—") + " Tithi (lunar day), " + (panchang.yoga || "—") + " Yoga (a Sun-Moon calculation) and " + (panchang.karana || "—") + " Karana (half a lunar day). These values are marked experimental and should be checked independently."
    );
  }
  summary.push(
    yogas.length
      ? "The calculation has flagged " + yogas.length + " possible Yoga pattern" + (yogas.length === 1 ? "" : "s") + ". A Yoga is a traditional combination of chart factors. These are only early candidates, not confirmed classical Yogas."
      : "No Yoga pattern was flagged by the app's simplified checks. This does not prove that no traditional Yoga exists in your chart.",
    "Overall, use this report as a beginner-friendly guide to traditional astrology, not as a fixed prediction. Your decisions, opportunities and circumstances matter."
  );
  return summary;
}
