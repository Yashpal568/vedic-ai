import type { KundliReport } from "@/lib/astrology";

export interface Vedic15PointReportItem {
  number: number;
  section: string;
  title: string;
  summary: string;
  details: string;
  tag?: string;
}

export interface PlanetaryAspect {
  planet: string;
  fromHouse: number;
  aspectsHouse: number;
  aspectDegree: string;
  specialDrishti: boolean;
  impactedPlanets: string[];
}

/**
 * Calculates traditional Parashari Drishtis (Planetary Aspects)
 * All planets aspect the 7th house from their position.
 * Special aspects:
 * - Mars aspects 4th, 7th, 8th
 * - Jupiter aspects 5th, 7th, 9th
 * - Saturn aspects 3rd, 7th, 10th
 * - Rahu/Ketu aspect 5th, 7th, 9th
 */
export function calculatePlanetaryAspects(report: KundliReport): PlanetaryAspect[] {
  const aspects: PlanetaryAspect[] = [];
  const houseOccupants: Record<number, string[]> = {};
  
  for (let i = 1; i <= 12; i++) {
    houseOccupants[i] = [];
  }
  for (const p of report.planets) {
    if (houseOccupants[p.house]) {
      houseOccupants[p.house].push(p.name);
    }
  }

  for (const planet of report.planets) {
    const fromH = planet.house;
    const targetHouses: { houseOffset: number; special: boolean }[] = [
      { houseOffset: 7, special: false }, // Universal 7th house aspect
    ];

    if (planet.name === "Mars") {
      targetHouses.push({ houseOffset: 4, special: true });
      targetHouses.push({ houseOffset: 8, special: true });
    } else if (planet.name === "Jupiter") {
      targetHouses.push({ houseOffset: 5, special: true });
      targetHouses.push({ houseOffset: 9, special: true });
    } else if (planet.name === "Saturn") {
      targetHouses.push({ houseOffset: 3, special: true });
      targetHouses.push({ houseOffset: 10, special: true });
    } else if (planet.name === "Rahu" || planet.name === "Ketu") {
      targetHouses.push({ houseOffset: 5, special: true });
      targetHouses.push({ houseOffset: 9, special: true });
    }

    for (const target of targetHouses) {
      const targetHouse = ((fromH + target.houseOffset - 2) % 12) + 1;
      aspects.push({
        planet: planet.name,
        fromHouse: fromH,
        aspectsHouse: targetHouse,
        aspectDegree: `${target.houseOffset * 30}° Drishti`,
        specialDrishti: target.special,
        impactedPlanets: houseOccupants[targetHouse].filter((name) => name !== planet.name),
      });
    }
  }

  return aspects;
}

/**
 * Builds the official 15-Point Indian Vedic Astrology Report
 * matching the approved specification:
 * 1. Your Ascendant and its significance
 * 2. Your Moon sign
 * 3. Your Nakshatra
 * 4. Your Sun sign
 * 5. Your basic personality profile
 * 6. Your emotional tendencies
 * 7. Your communication style
 * 8. Your intellectual strengths
 * 9. Your career-related themes
 * 10. Your relationships and social nature
 * 11. Your financial tendencies
 * 12. Your natural strengths
 * 13. Areas for personal development
 * 14. Your current Mahadasha/Antardasha
 * 15. Important upcoming planetary themes
 */
export function build15PointVedicReport(report: KundliReport): Vedic15PointReportItem[] {
  const asc = report.ascendant;
  const moon = report.planets.find((p) => p.name === "Moon") || report.planets[1];
  const sun = report.planets.find((p) => p.name === "Sun") || report.planets[0];
  const mercury = report.planets.find((p) => p.name === "Mercury") || report.planets[3];
  const jupiter = report.planets.find((p) => p.name === "Jupiter") || report.planets[4];
  const venus = report.planets.find((p) => p.name === "Venus") || report.planets[5];
  const saturn = report.planets.find((p) => p.name === "Saturn") || report.planets[6];

  const currentDasha = report.vimshottari.currentMahadasha;
  const dashaStart = new Date(currentDasha.start).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  const dashaEnd = new Date(currentDasha.end).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

  return [
    {
      number: 1,
      section: "Your Ascendant and its significance",
      title: `${asc.sign} Ascendant (Lagna) at ${asc.degreeInSign.toFixed(2)}°`,
      summary: `Your rising sign shapes your physical vitality, general disposition, and external lens on the world.`,
      details: `With ${asc.sign} rising in ${asc.nakshatra} (Pada ${asc.nakshatraPada}), you navigate life with inherent orientation toward ${
        asc.sign === "Aries" ? "pioneering initiative and courage"
        : asc.sign === "Taurus" ? "steadfast patience, loyalty, and grounded values"
        : asc.sign === "Gemini" ? "adaptability, intellectual curiosity, and communicative versatility"
        : asc.sign === "Cancer" ? "empathy, domestic protectiveness, and intuitive perception"
        : asc.sign === "Leo" ? "dignified leadership, generous heart, and creative presence"
        : asc.sign === "Virgo" ? "analytical precision, practical discernment, and helpful service"
        : asc.sign === "Libra" ? "harmonious balance, aesthetic grace, and equitable partnership"
        : asc.sign === "Scorpio" ? "deep investigative intuition, transformative resilience, and intense focus"
        : asc.sign === "Sagittarius" ? "philosophical optimism, righteous principles, and broad horizon-seeking"
        : asc.sign === "Capricorn" ? "structured discipline, pragmatic perseverance, and long-term ambition"
        : asc.sign === "Aquarius" ? "humanitarian vision, innovative thinking, and community consciousness"
        : "compassionate empathy, imaginative depth, and spiritual receptivity"
      }.`,
      tag: "Vitality & Outlook",
    },
    {
      number: 2,
      section: "Your Moon sign",
      title: `${moon.sign} Rashi (Chandra Lagna)`,
      summary: `The Moon represents your Manas (subconscious mind), emotional comfort patterns, and intuitive reactions.`,
      details: `Your mind finds stability when aligned with ${moon.sign} virtues. Positioned in House ${moon.house}, your subconscious sense of safety and fulfillment is tied to ${
        moon.house === 1 ? "self-directed personal authenticity"
        : moon.house === 4 ? "home, emotional privacy, and family roots"
        : moon.house === 7 ? "collaborative partnership and reciprocal connection"
        : moon.house === 10 ? "meaningful social vocation and respected reputation"
        : "structured, deliberate engagement with life's daily duties"
      }.`,
      tag: "Emotional Core",
    },
    {
      number: 3,
      section: "Your Nakshatra",
      title: `${moon.nakshatra} (Pada ${moon.nakshatraPada})`,
      summary: `Your birth lunar mansion dictates your deep psychological archetype and karmic instinct.`,
      details: `Born under ${moon.nakshatra}, your energetic tempo is guided by its traditional cosmic deities and planetary lord (${report.vimshottari.birthMahadasha}). This star placement imparts natural gifts for creative synthesis, purposeful observation, and steady instinct under changing tides.`,
      tag: "Karmic Temperament",
    },
    {
      number: 4,
      section: "Your Sun sign",
      title: `${sun.sign} in House ${sun.house}`,
      summary: `The Sun represents your core soul essence (Atmakaraka energy), ego dignity, and life purpose.`,
      details: `Placed in ${sun.sign} across the ${sun.house}${getOrdinal(sun.house)} house, your solar purpose radiates through ${
        sun.house === 1 ? "charismatic self-expression and independent personal initiative"
        : sun.house === 5 ? "creative intelligence, mentorship, and thoughtful self-expression"
        : sun.house === 9 ? "higher philosophy, moral rectitude, and lifelong learning"
        : sun.house === 10 ? "professional leadership, civic responsibility, and executive authority"
        : "quiet, purposeful cultivation of lasting tangible value"
      }.`,
      tag: "Solar Purpose",
    },
    {
      number: 5,
      section: "Your basic personality profile",
      title: `Tri-Fold Identity Synthesis (${asc.sign} Lagna · ${moon.sign} Moon · ${sun.sign} Sun)`,
      summary: `The unified convergence of how you act, how you feel, and who you aspire to be.`,
      details: `You balance the outward social presence of ${asc.sign} with the inner emotional sensitivity of ${moon.sign} and the foundational self-direction of ${sun.sign}. This gives you a multifaceted personality capable of pragmatic action while retaining genuine intuitive discernment.`,
      tag: "Core Archetype",
    },
    {
      number: 6,
      section: "Your emotional tendencies",
      title: `Emotional Processing & Comfort Architecture`,
      summary: `How you navigate vulnerability, stress, connection, and restorative solitude.`,
      details: `With Moon in House ${moon.house} and Venus in ${venus.sign}, your emotional rhythm values genuine loyalty over superficial acquaintance. Under stressful circumstances, you process best by retreating into calm contemplation rather than reacting impulsively.`,
      tag: "Inner Rhythm",
    },
    {
      number: 7,
      section: "Your communication style",
      title: `Mercury in ${mercury.sign} (House ${mercury.house})`,
      summary: `Your logic framework, expressive cadence, and interpersonal negotiation style.`,
      details: `Mercury in ${mercury.sign} ${mercury.retrograde ? "(Retrograde)" : ""} grants ${
        mercury.retrograde
          ? "a reflective, highly original thinking process that re-evaluates premises deeply before speaking"
          : "an articulate, lucid analytical capability that articulates complex ideas systematically"
      }. In negotiations, you build trust through measured facts and considerate listening.`,
      tag: "Intellect & Speech",
    },
    {
      number: 8,
      section: "Your intellectual strengths",
      title: `Cognitive Architecture & Strategic Wisdom`,
      summary: `Problem-solving methods, strategic foresight, and learning preferences.`,
      details: `With Jupiter in ${jupiter.sign} (House ${jupiter.house}), your intellectual approach leans toward systemic comprehension. You excel at recognizing broader patterns rather than getting lost in isolated data points, making you well-suited for mentorship and strategic advisory roles.`,
      tag: "Wisdom & Strategy",
    },
    {
      number: 9,
      section: "Your career-related themes",
      title: `10th House Karma Bhava & Saturn in ${saturn.sign}`,
      summary: `Vocational inclinations, authority dynamics, and public impact trajectory.`,
      details: `Saturn's placement in House ${saturn.house} indicates that professional recognition comes through consistency, structured competence, and ethical perseverance. Rather than overnight speculation, your career builds momentum cumulatively, peaking in mature adulthood.`,
      tag: "Vocation & Duty",
    },
    {
      number: 10,
      section: "Your relationships and social nature",
      title: `7th House Dynamics & Venus in ${venus.sign}`,
      summary: `Partnership expectations, relational harmony, and cooperative boundaries.`,
      details: `Venus in House ${venus.house} emphasizes fairness, mutual respect, and intellectual reciprocity in partnerships. You thrive with partners who respect your need for individual autonomy while offering steady, drama-free emotional support.`,
      tag: "Union & Fellowship",
    },
    {
      number: 11,
      section: "Your financial tendencies",
      title: `2nd House (Dhana) & 11th House (Labha) Prosperity Flow`,
      summary: `Resource accumulation, saving habits, and material wealth management.`,
      details: `Your chart supports sustained wealth through calculated enterprise and value-driven investment. Speculative risks are less favored than structured assets, specialized knowledge monetization, and long-term compound growth.`,
      tag: "Material Prosperity",
    },
    {
      number: 12,
      section: "Your natural strengths",
      title: `Inherent Gifts & Auspicious Dignities`,
      summary: `Qualities that come naturally and provide protective buoyancy during tests.`,
      details: `Your greatest natural assets include tenacity in demanding situations, ethical discernment in complex negotiations, and an innate instinct for creating order out of ambiguity. People frequently rely on your grounded presence during volatile periods.`,
      tag: "Inherent Talents",
    },
    {
      number: 13,
      section: "Areas for personal development",
      title: `Karmic Growth Edges & Conscious Mastery`,
      summary: `Habitual blind spots, stress reactions, and pathways for elevated balance.`,
      details: `Beware of over-analyzing decisions to the point of inertia or carrying the burden of responsibility that belongs to others. Establishing firm personal boundaries and embracing imperfect, timely action accelerates your personal evolution.`,
      tag: "Conscious Growth",
    },
    {
      number: 14,
      section: "Your current Mahadasha/Antardasha",
      title: `${currentDasha.lord} Mahadasha (${dashaStart} – ${dashaEnd})`,
      summary: `The primary planetary chapter currently governing your life experiences and focus.`,
      details: `You are navigating the ${currentDasha.lord} cycle. This period brings themes of ${
        currentDasha.lord === "Jupiter" ? "wisdom expansion, educational opportunities, and ethical elevation"
        : currentDasha.lord === "Saturn" ? "disciplined restructuring, vocational duty, and enduring milestones"
        : currentDasha.lord === "Mercury" ? "commercial commerce, learning, communication, and intellectual networking"
        : currentDasha.lord === "Venus" ? "relational harmony, artistic fulfillment, and domestic enrichment"
        : currentDasha.lord === "Sun" ? "identity clarity, leadership responsibilities, and civic authority"
        : currentDasha.lord === "Moon" ? "emotional deepening, domestic shifts, and intuitive exploration"
        : currentDasha.lord === "Mars" ? "courageous initiative, physical drive, and decisive transitions"
        : currentDasha.lord === "Rahu" ? "unconventional ambition, innovative breakthroughs, and worldly expansion"
        : "spiritual introspection, shedding outworn habits, and intuitive awakening"
      }.`,
      tag: "Active Time Chapter",
    },
    {
      number: 15,
      section: "Important upcoming planetary themes",
      title: `Transits (Gochara) & Next Major Transitions`,
      summary: `Key astrological currents on the horizon and how to harmonize with them.`,
      details: `With upcoming transit shifts of ${saturn.name} and ${jupiter.name}, focus on aligning your daily efforts with long-term foundational goals. Practice deliberate timing: plant seeds during constructive dasha phases and consolidate gains during testing intervals.`,
      tag: "Horizon & Timing",
    },
  ];
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
