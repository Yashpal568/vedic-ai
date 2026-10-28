import type { KundliReport, PlanetPosition } from "@/lib/astrology";

export type KundliHouseSummary = {
  house: number;
  sign: string;
  planets: string[];
  title: string;
  explanation: string;
};

const HOUSE_TOPICS = [
  "self, personality and first impressions",
  "money, family and speech",
  "communication, courage and siblings",
  "home, comfort and mother",
  "learning, creativity, romance and children",
  "daily work, routines and challenges",
  "partnerships and marriage",
  "change, shared resources and deeper subjects",
  "beliefs, higher learning and long journeys",
  "career, responsibilities and public life",
  "friends, networks and long-term goals",
  "rest, expenses, privacy and letting go",
];

const PLANET_MEANINGS: Record<string, string> = {
  Sun: "confidence, identity and responsibility",
  Moon: "feelings, comfort and changing moods",
  Mars: "energy, initiative and assertiveness",
  Mercury: "thinking, learning and communication",
  Jupiter: "growth, guidance and broader understanding",
  Venus: "relationships, harmony and preferences",
  Saturn: "patience, structure and lessons through effort",
  Rahu: "strong ambition, curiosity and unconventional interests",
  Ketu: "detachment, reflection and simplifying priorities",
};

const SIGN_MEANINGS: Record<string, string> = {
  Aries: "direct, active and willing to begin",
  Taurus: "steady, practical and comfort-seeking",
  Gemini: "curious, communicative and adaptable",
  Cancer: "protective, sensitive and home-oriented",
  Leo: "expressive, proud and creative",
  Virgo: "careful, analytical and improvement-focused",
  Libra: "cooperative, fair-minded and relationship-aware",
  Scorpio: "private, focused and drawn to depth",
  Sagittarius: "open-minded, exploratory and meaning-seeking",
  Capricorn: "structured, patient and goal-focused",
  Aquarius: "independent, idea-focused and community-aware",
  Pisces: "imaginative, empathetic and reflective",
};

export function buildKundliHouseSummary(report: KundliReport): KundliHouseSummary[] {
  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const sign = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"][(report.ascendant.signIndex + house - 1) % 12];
    const planets: PlanetPosition[] = report.planets.filter((planet) => planet.house === house);
    const planetNames = planets.map((planet) => planet.name);
    const signStyle = SIGN_MEANINGS[sign] || "individual and context-dependent";
    const planetStyle = planets.length
      ? " The listed planet" + (planets.length > 1 ? "s are " : " is ") + planets.map((planet) => planet.name + " (" + (PLANET_MEANINGS[planet.name] || "a traditional symbolic theme") + ")").join("; ") + "."
      : " No major planet from the current report is listed in this house; astrologers still consider its sign and ruling planet when interpreting it.";
    return {
      house,
      sign,
      planets: planetNames,
      title: HOUSE_TOPICS[index].charAt(0).toUpperCase() + HOUSE_TOPICS[index].slice(1),
      explanation: "In traditional Vedic astrology, this house relates to " + HOUSE_TOPICS[index] + ". Its sign is " + sign + ", often associated with being " + signStyle + "." + planetStyle,
    };
  });
}

export function buildKundliSimpleSummary(report: KundliReport): string[] {
  const moon = report.planets.find((planet) => planet.name === "Moon");
  const current = report.vimshottari.currentMahadasha;
  const occupied = report.planets.reduce((count, planet) => count + (planet.house ? 1 : 0), 0);
  return [
    "Your Lagna (Ascendant) is " + report.ascendant.sign + ". In traditional astrology, the Lagna is used as a starting point for discussing personality and how you approach life.",
    "Your Moon is in " + (moon?.sign || "an unavailable sign") + (moon?.nakshatra ? ", in the " + moon.nakshatra + " nakshatra" : "") + ". Astrologers use the Moon and nakshatra when discussing feelings, habits and the mind.",
    "The report lists " + occupied + " planetary placements across the twelve houses. The house-by-house guide explains what each area traditionally represents and which planets are listed there.",
    "The current calculated Mahadasha is " + current.lord + " (" + current.start.slice(0, 10) + " to " + current.end.slice(0, 10) + "). In Jyotish this period is used as one lens for timing; it should not be treated as a guaranteed forecast.",
    report.yogaCandidates?.length
      ? "The report shows " + report.yogaCandidates.length + " possible yoga candidate" + (report.yogaCandidates.length === 1 ? "" : "s") + ". These are experimental matches only, not confirmed classical yogas."
      : "No yoga candidate was found by the current simplified rules. This does not prove that no traditional yoga exists in the chart.",
    "Use this as a beginner-friendly guide to traditional symbolism, not as a fixed prediction. The calculation engine is still experimental and needs independent verification; your choices, circumstances and actions matter.",
  ];
}
