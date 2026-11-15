import type { KundliReport } from "@/lib/astrology";
import type { SupportedLanguage } from "@/lib/i18n/types";
import { PLANET_NAMES_HI, SIGN_NAMES_HI } from "@/lib/kundli-summary";

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
export function calculatePlanetaryAspects(
  report: KundliReport,
  language: SupportedLanguage = "en"
): PlanetaryAspect[] {
  const isHi = language === "hi";
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

    const pDisplayName = isHi ? PLANET_NAMES_HI[planet.name] || planet.name : planet.name;

    for (const target of targetHouses) {
      const targetHouse = ((fromH + target.houseOffset - 2) % 12) + 1;
      const rawImpacted = houseOccupants[targetHouse].filter((name) => name !== planet.name);
      const impacted = isHi
        ? rawImpacted.map((n) => PLANET_NAMES_HI[n] || n)
        : rawImpacted;

      aspects.push({
        planet: pDisplayName,
        fromHouse: fromH,
        aspectsHouse: targetHouse,
        aspectDegree: isHi
          ? `${target.houseOffset * 30}° दृष्टि`
          : `${target.houseOffset * 30}° Drishti`,
        specialDrishti: target.special,
        impactedPlanets: impacted,
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
export function build15PointVedicReport(
  report: KundliReport,
  language: SupportedLanguage = "en"
): Vedic15PointReportItem[] {
  const isHi = language === "hi";
  const asc = report.ascendant;
  const moon = report.planets.find((p) => p.name === "Moon") || report.planets[1];
  const sun = report.planets.find((p) => p.name === "Sun") || report.planets[0];
  const mercury = report.planets.find((p) => p.name === "Mercury") || report.planets[3];
  const jupiter = report.planets.find((p) => p.name === "Jupiter") || report.planets[4];
  const venus = report.planets.find((p) => p.name === "Venus") || report.planets[5];
  const saturn = report.planets.find((p) => p.name === "Saturn") || report.planets[6];

  const currentDasha = report.vimshottari.currentMahadasha;
  const locale = isHi ? "hi-IN" : "en-IN";
  const dashaStart = new Date(currentDasha.start).toLocaleDateString(locale, { month: "short", year: "numeric" });
  const dashaEnd = new Date(currentDasha.end).toLocaleDateString(locale, { month: "short", year: "numeric" });

  const ascSign = isHi ? SIGN_NAMES_HI[asc.sign] || asc.sign : asc.sign;
  const moonSign = isHi ? SIGN_NAMES_HI[moon.sign] || moon.sign : moon.sign;
  const sunSign = isHi ? SIGN_NAMES_HI[sun.sign] || sun.sign : sun.sign;
  const mercurySign = isHi ? SIGN_NAMES_HI[mercury.sign] || mercury.sign : mercury.sign;
  const jupiterSign = isHi ? SIGN_NAMES_HI[jupiter.sign] || jupiter.sign : jupiter.sign;
  const venusSign = isHi ? SIGN_NAMES_HI[venus.sign] || venus.sign : venus.sign;
  const saturnSign = isHi ? SIGN_NAMES_HI[saturn.sign] || saturn.sign : saturn.sign;
  const dashaLord = isHi ? PLANET_NAMES_HI[currentDasha.lord] || currentDasha.lord : currentDasha.lord;
  const signOrder = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const signRulers: Record<string, string> = {
    Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon", Leo: "Sun", Virgo: "Mercury",
    Libra: "Venus", Scorpio: "Mars", Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Saturn", Pisces: "Jupiter",
  };
  const houseFacts = (house: number) => {
    const sign = signOrder[(asc.signIndex + house - 1) % 12];
    const ruler = signRulers[sign];
    const lord = report.planets.find((planet) => planet.name === ruler);
    const occupants = report.planets.filter((planet) => planet.house === house).map((planet) =>
      isHi ? PLANET_NAMES_HI[planet.name] || planet.name : planet.name
    );
    const signLabel = isHi ? SIGN_NAMES_HI[sign] || sign : sign;
    const rulerLabel = isHi ? PLANET_NAMES_HI[ruler] || ruler : ruler;
    const lordPlacement = lord
      ? (isHi
          ? `${PLANET_NAMES_HI[lord.name] || lord.name} ${SIGN_NAMES_HI[lord.sign] || lord.sign} राशि के ${lord.house}वें भाव में स्थित है`
          : `${lord.name} is in ${lord.sign}, House ${lord.house}`)
      : (isHi ? "इस भाव के स्वामी की स्थिति उपलब्ध नहीं है" : "the house lord's placement is unavailable");
    const occupantsLabel = occupants.length
      ? occupants.join(isHi ? " और " : ", ")
      : (isHi ? "इस भाव में कोई प्रमुख ग्रह स्थित नहीं है" : "no classical planet occupies this house");
    return { sign, ruler, signLabel, rulerLabel, lordPlacement, occupantsLabel };
  };
  const careerHouse = houseFacts(10);
  const relationshipHouse = houseFacts(7);
  const wealthHouse = houseFacts(2);
  const gainsHouse = houseFacts(11);
  const dashaPlanet = report.planets.find((planet) => planet.name === currentDasha.lord);
  const dashaPlacement = dashaPlanet
    ? (isHi
        ? `${PLANET_NAMES_HI[dashaPlanet.name] || dashaPlanet.name} ${SIGN_NAMES_HI[dashaPlanet.sign] || dashaPlanet.sign} राशि के ${dashaPlanet.house}वें भाव में स्थित है`
        : `${dashaPlanet.name} is in ${dashaPlanet.sign}, House ${dashaPlanet.house}`)
    : (isHi ? "महादशा स्वामी की जन्मकुंडली स्थिति उपलब्ध नहीं है" : "the Mahadasha lord's natal placement is unavailable");

  if (isHi) {
    return [
      {
        number: 1,
        section: "आपका लग्न एवं इसका महत्व",
        title: `${ascSign} लग्न (${asc.degreeInSign.toFixed(2)}° पर)`,
        summary: "आपका लग्न भाव आपकी शारीरिक ऊर्जा, मूल स्वभाव और जीवन के प्रति आपके दृष्टिकोण को स्वरूप देता है।",
        details: `${ascSign} लग्न तथा ${asc.nakshatra} नक्षत्र (चरण ${asc.nakshatraPada}) के प्रभाव से आपका व्यक्तित्व स्वाभाविक रूप से संतुलित दृष्टिकोण, धैर्य और कर्तव्यनिष्ठा के साथ जीवन की दिशा तय करता है।`,
        tag: "ऊर्जा एवं दृष्टिकोण",
      },
      {
        number: 2,
        section: "आपकी चंद्र राशि",
        title: `${moonSign} राशि (चन्द्र लग्न)`,
        summary: "चंद्रमा आपके मन (अवचेतन मन), भावनात्मक संतुलन और सहज प्रवृत्तियों का प्रतिनिधित्व करता है।",
        details: `आपका मन ${moonSign} के सद्गुणों से मानसिक स्थिरता प्राप्त करता है। कुंडली के ${moon.house}वें भाव में स्थित चंद्रमा आपकी भावनात्मक सुरक्षा और आत्मीय शांति को रेखांकित करता है।`,
        tag: "भावनात्मक केंद्र",
      },
      {
        number: 3,
        section: "आपका जन्म नक्षत्र",
        title: `${moon.nakshatra} (चरण ${moon.nakshatraPada})`,
        summary: "आपका जन्म नक्षत्र आपके गहरे मनोवैज्ञानिक स्वभाव और कार्मिक प्रवृत्तियों को दिशा देता है।",
        details: `${moon.nakshatra} नक्षत्र में जन्म लेने से आपका स्वभाव रचनात्मक चिंतन, उद्देश्यपूर्ण निर्णय और विषम परिस्थितियों में भी शांत रहने की आंतरिक शक्ति से युक्त है।`,
        tag: "कार्मिक स्वभाव",
      },
      {
        number: 4,
        section: "आपकी सूर्य राशि",
        title: `${sunSign} (${sun.house}वें भाव में)`,
        summary: "सूर्य आपके आत्म-तत्व (आत्माकारक ऊर्जा), गरिमा और जीवन के मुख्य उद्देश्य का कारक है।",
        details: `सूर्य का ${sunSign} में ${sun.house}वें भाव में होना आपके जीवन-उद्देश्य को कर्तव्यनिष्ठा, स्वाभिमान और सत्यनिष्ठ कर्म के माध्यम से प्रकाशित करता है।`,
        tag: "आत्म उद्देश्य",
      },
      {
        number: 5,
        section: "व्यक्तित्व का समग्र स्वरूप",
        title: `त्रिविध पहचान समन्वय (${asc.sign} लग्न · ${moon.sign} चंद्र · ${sun.sign} सूर्य)`,
        summary: "आपके कर्म, आपकी भावना और आपके आत्म-लक्ष्य का एकीकृत समन्वय।",
        details: `आप ${ascSign} के बाह्य आचरण, ${moonSign} की आंतरिक संवेदनशीलता और ${sunSign} के आत्म-बल का सुंदर संतुलन बनाए रखते हैं।`,
        tag: "मूल स्वरूप",
      },
      {
        number: 6,
        section: "आपकी भावनात्मक प्रवृत्तियां",
        title: "भावनात्मक संतुलन एवं शांति",
        summary: "तनाव, आत्मीयता और आत्म-पुनर्प्राप्ति के प्रति आपका दृष्टिकोण।",
        details: `${moon.house}वें भाव में चंद्रमा और ${venusSign} में शुक्र का प्रभाव आपकी भावनाओं में निष्ठा और सादगी को प्राथमिकता देता है। तनाव के समय जल्दबाजी के स्थान पर शांत चिंतन आपको सही राह दिखाता है।`,
        tag: "आंतरिक ताल",
      },
      {
        number: 7,
        section: "आपकी संवाद एवं संप्रेषण शैली",
        title: `बुध ${mercurySign} में (${mercury.house}वें भाव में)`,
        summary: "आपकी तार्किक संरचना, वाणी और विचार विमर्श का ढंग।",
        details: `बुध की यह स्थिति ${mercury.retrograde ? "गहन आत्म-विश्लेषण और सोच-समझकर बोलने की विशेषता" : "स्पष्ट, तार्किक और व्यवस्थित संप्रेषण क्षमता"} प्रदान करती है।`,
        tag: "बुद्धि एवं वाणी",
      },
      {
        number: 8,
        section: "आपकी बौद्धिक क्षमताएं",
        title: "संज्ञानात्मक विवेक एवं रणनीतिक दृष्टि",
        summary: "समस्या समाधान का तरीका, दूरदर्शिता और ज्ञान अर्जन की रुचि।",
        details: `${jupiterSign} में तथा ${jupiter.house}वें भाव में गुरु (बृहस्पति) का प्रभाव आपको एकांगी तथ्यों के स्थान पर समग्र परिप्रेक्ष्य को समझने और दूरगामी मार्गदर्शन देने की बौद्धिक परिपक्वता देता है।`,
        tag: "विवेक एवं रणनीति",
      },
      {
        number: 9,
        section: "आजीविका एवं कर्म क्षेत्र",
        title: `दशम कर्म भाव एवं शनि ${saturnSign} में`,
        summary: "व्यावसायिक रुझान, कर्मनिष्ठा और सामाजिक योगदान का मार्ग।",
        details: `दशम भाव ${careerHouse.signLabel} राशि का है और इसका स्वामी ${careerHouse.rulerLabel} है; ${careerHouse.lordPlacement}। इस भाव में ${careerHouse.occupantsLabel}। शनि ${saturnSign} राशि के ${saturn.house}वें भाव में है। पारंपरिक दृष्टि से करियर की व्याख्या इन वास्तविक स्थितियों को साथ देखकर करनी चाहिए; यह निश्चित पेशे या सफलता की गारंटी नहीं है।`,
        tag: "कर्म एवं कर्तव्य",
      },
      {
        number: 10,
        section: "संबंध एवं सामाजिक व्यवहार",
        title: `सप्तम भाव साझेदारी एवं शुक्र ${venusSign} में`,
        summary: "पारस्परिक साझेदारी, सम्मान और सामाजिक संतुलन।",
        details: `सप्तम भाव ${relationshipHouse.signLabel} राशि का है और इसका स्वामी ${relationshipHouse.rulerLabel} है; ${relationshipHouse.lordPlacement}। इस भाव में ${relationshipHouse.occupantsLabel}। शुक्र ${venusSign} राशि के ${venus.house}वें भाव में स्थित है। पारंपरिक संबंध-विचार में सप्तम भाव, उसके स्वामी और शुक्र—तीनों को साथ पढ़ा जाता है।`,
        tag: "साझेदारी एवं सौहार्द",
      },
      {
        number: 11,
        section: "वित्तीय प्रवृत्तियां एवं समृद्धि",
        title: "द्वितीय (धन) एवं एकादश (लाभ) भाव प्रवाह",
        summary: "संसाधन संचय, बचत की आदतें और आर्थिक संतुलन।",
        details: `द्वितीय धन भाव ${wealthHouse.signLabel} राशि में है; इसका स्वामी ${wealthHouse.rulerLabel} है (${wealthHouse.lordPlacement})। एकादश लाभ भाव ${gainsHouse.signLabel} राशि में है; इसका स्वामी ${gainsHouse.rulerLabel} है (${gainsHouse.lordPlacement})। इन दोनों भावों में स्थित ग्रह: धन भाव—${wealthHouse.occupantsLabel}; लाभ भाव—${gainsHouse.occupantsLabel}। यह पारंपरिक वित्तीय संकेतों का विवरण है, निवेश सलाह या धन की गारंटी नहीं।`,
        tag: "भौतिक समृद्धि",
      },
      {
        number: 12,
        section: "आपकी स्वाभाविक शक्तियां",
        title: "जन्मजात सद्गुण एवं संरक्षी सामर्थ्य",
        summary: "वे गुण जो कठिन समय में भी आपको संबल और दिशा प्रदान करते हैं।",
        details: "जटिल परिस्थितियों में संयम, नीतिगत निर्णय और स्पष्टता स्थापित करने की सहज प्रवृत्ति आपकी प्रमुख ताकत है।",
        tag: "स्वाभाविक प्रतिभा",
      },
      {
        number: 13,
        section: "व्यक्तिगत विकास के क्षेत्र",
        title: "सजग आत्म-परिष्कार एवं संतुलन",
        summary: "आदतन कमजोरियां, तनाव प्रतिक्रियाएं और उन्नयन के मार्ग।",
        details: "अत्यधिक सोच-विचार के कारण निर्णय टालने से बचें। समय पर किया गया संतुलित प्रयास आपकी प्रगति को गति देता है।",
        tag: "सजग विकास",
      },
      {
        number: 14,
        section: "वर्तमान महादशा एवं अंतर्दशा",
        title: `${dashaLord} महादशा (${dashaStart} – ${dashaEnd})`,
        summary: "वर्तमान समय में आपके जीवन अनुभवों को दिशा देने वाला मुख्य ग्रहीय अध्याय।",
        details: `वर्तमान महादशा ${dashaLord} की है और इसका जन्मकुंडली में स्थान: ${dashaPlacement}। अवधि ${dashaStart} से ${dashaEnd} तक है। व्याख्या महादशा स्वामी की वास्तविक राशि, भाव और अन्य ग्रहों से संबंध देखकर की जानी चाहिए।`,
        tag: "सक्रिय कालखंड",
      },
      {
        number: 15,
        section: "आगामी महत्वपूर्ण ग्रहीय प्रवाह",
        title: "गोचर (Transits) एवं आगामी परिवर्तन",
        summary: "भविष्य के प्रमुख ज्योतिषीय प्रवाह और उनके साथ संतुलन के उपाय।",
        details: "इस रिपोर्ट में वर्तमान गोचर की अलग गणना शामिल नहीं है। इसलिए किसी आगामी ग्रह-परिवर्तन या समय-सीमा का दावा नहीं किया जा रहा है; गोचर रिपोर्ट के लिए चुनी गई तारीख के वास्तविक ग्रह-स्थान अलग से गणना करने होंगे.",
        tag: "क्षितिज एवं समय-ताल",
      },
    ];
  }

  // Default English 15-Point Report
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
      details: `The 10th house (career) is ${careerHouse.sign}, ruled by ${careerHouse.ruler}; ${careerHouse.lordPlacement}. Occupants of the 10th house: ${careerHouse.occupantsLabel}. Saturn is in ${saturn.sign}, House ${saturn.house}. In traditional Jyotish, these placements are read together; they do not guarantee a specific profession or outcome.`, 
      tag: "Vocation & Duty",
    },
    {
      number: 10,
      section: "Your relationships and social nature",
      title: `7th House Dynamics & Venus in ${venus.sign}`,
      summary: `Partnership expectations, relational harmony, and cooperative boundaries.`,
      details: `The 7th house (partnerships) is ${relationshipHouse.sign}, ruled by ${relationshipHouse.ruler}; ${relationshipHouse.lordPlacement}. Occupants of the 7th house: ${relationshipHouse.occupantsLabel}. Venus is in ${venus.sign}, House ${venus.house}. Traditional relationship analysis considers the 7th house, its ruler, and Venus together rather than relying on Venus alone.`, 
      tag: "Union & Fellowship",
    },
    {
      number: 11,
      section: "Your financial tendencies",
      title: `2nd House (Dhana) & 11th House (Labha) Prosperity Flow`,
      summary: `Resource accumulation, saving habits, and material wealth management.`,
      details: `The 2nd house (savings/resources) is ${wealthHouse.sign}, ruled by ${wealthHouse.ruler}; ${wealthHouse.lordPlacement}. The 11th house (gains) is ${gainsHouse.sign}, ruled by ${gainsHouse.ruler}; ${gainsHouse.lordPlacement}. Occupants: 2nd—${wealthHouse.occupantsLabel}; 11th—${gainsHouse.occupantsLabel}. These are traditional chart indicators, not a prediction of income or investment returns.`, 
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
      details: `You are in the ${currentDasha.lord} Mahadasha. Its natal placement is ${dashaPlacement}, and the calculated period runs from ${dashaStart} to ${dashaEnd}. The traditional interpretation should be based on this lord's house, sign, dignity, and planetary relationships—not a generic description.`, 
      tag: "Active Time Chapter",
    },
    {
      number: 15,
      section: "Important upcoming planetary themes",
      title: `Transits (Gochara) & Next Major Transitions`,
      summary: `Key astrological currents on the horizon and how to harmonize with them.`,
      details: `This birth-chart report does not calculate current or future transits. No upcoming planetary shift or event date is asserted here; a separate transit calculation for the requested date is required.`, 
      tag: "Horizon & Timing",
    },
  ];
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
