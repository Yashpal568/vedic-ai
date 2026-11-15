import { SIGNS, type KundliReport, type PlanetPosition } from "@/lib/astrology";
import type { SupportedLanguage } from "@/lib/i18n/types";

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

export const HOUSE_TOPICS = [
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

export const HOUSE_TOPICS_HI = [
  "आप और आपका व्यक्तित्व (प्रथम भाव)",
  "धन, कुटुंब एवं वाणी (द्वितीय भाव)",
  "संवाद, साहस एवं सहोदर (तृतीय भाव)",
  "गृह, सुख, माता एवं परिवार (चतुर्थ भाव)",
  "रचनात्मकता, विद्या एवं संतान (पंचम भाव)",
  "दैनिक कार्य, स्वास्थ्य एवं चुनौतियां (षष्ठ भाव)",
  "विवाह एवं घनिष्ठ साझेदारी (सप्तम भाव)",
  "गूढ़ ज्ञान, आयु एवं परिवर्तन (अष्टम भाव)",
  "धर्म, उच्च ज्ञान एवं भाग्य (नवम भाव)",
  "कर्म, आजीविका एवं प्रतिष्ठा (दशम भाव)",
  "लाभ, मित्र एवं आकांक्षाएं (एकादश भाव)",
  "विश्राम, एकांत एवं व्यय (द्वादश भाव)",
];

export const PLANET_NAMES_HI: Record<string, string> = {
  Sun: "सूर्य (Sun)",
  Moon: "चन्द्र (Moon)",
  Mars: "मंगल (Mars)",
  Mercury: "बुध (Mercury)",
  Jupiter: "बृहस्पति (Jupiter)",
  Venus: "शुक्र (Venus)",
  Saturn: "शनि (Saturn)",
  Rahu: "राहु (Rahu)",
  Ketu: "केतु (Ketu)",
};

export const SIGN_NAMES_HI: Record<string, string> = {
  Aries: "मेष (Aries)",
  Taurus: "वृषभ (Taurus)",
  Gemini: "मिथुन (Gemini)",
  Cancer: "कर्क (Cancer)",
  Leo: "सिंह (Leo)",
  Virgo: "कन्या (Virgo)",
  Libra: "तुला (Libra)",
  Scorpio: "वृश्चिक (Scorpio)",
  Sagittarius: "धनु (Sagittarius)",
  Capricorn: "मकर (Capricorn)",
  Aquarius: "कुम्भ (Aquarius)",
  Pisces: "मीन (Pisces)",
};

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

const PLANET_MEANINGS_HI: Record<string, string> = {
  Sun: "आत्मविश्वास, पहचान और जीवन उद्देश्य",
  Moon: "भावनाएं, मानसिक शांति और आंतरिक विचार",
  Mars: "ऊर्जा, पराक्रम, साहस और कर्म करने की प्रवृत्ति",
  Mercury: "विचारशीलता, तार्किक संवाद और विद्या",
  Jupiter: "आत्मिक विस्तार, उच्च ज्ञान और सच्चा मार्गदर्शन",
  Venus: "प्रेम, सौंदर्य, कला, संबंध और सुख-साधन",
  Saturn: "अनुशासन, धैर्य, कर्मनिष्ठा और कर्तव्य-बोध",
  Rahu: "तीव्र महत्वाकांक्षा, नए अनुभव और अपरंपरागत दृष्टिकोण",
  Ketu: "त्याग, आध्यात्मिक चिंतन और आंतरिक आत्मज्ञान",
};

const SIGN_MEANINGS: Record<string, string> = {
  Aries: "bold and action-oriented",
  Taurus: "steady and practical",
  Gemini: "curious and communicative",
  Cancer: "caring and protective",
  Leo: "expressive and creative",
  Virgo: "careful and organised",
  Libra: "cooperative and fairness-minded",
  Scorpio: "private and determined",
  Sagittarius: "open to learning and new experiences",
  Capricorn: "patient and goal-focused",
  Aquarius: "independent and idea-focused",
  Pisces: "imaginative and sensitive",
};

const SIGN_MEANINGS_HI: Record<string, string> = {
  Aries: "साहसी और क्रियाशील",
  Taurus: "धैर्यवान, स्थिर और व्यावहारिक",
  Gemini: "जिज्ञासु, बहुमुखी और संवादकुशल",
  Cancer: "संवेदनशील, स्नेही और सुरक्षात्मक",
  Leo: "गरिमामय, उदार और रचनात्मक",
  Virgo: "विश्लेषणात्मक, सूक्ष्मदर्शी और व्यवस्थित",
  Libra: "संतुलित, न्यायप्रिय और सहयोगपूर्ण",
  Scorpio: "दृढ़निश्चयी, गूढ़ और शोधपरक",
  Sagittarius: "आशावादी, दार्शनिक और ज्ञानपिपासु",
  Capricorn: "अनुशासित, लक्ष्य-केंद्रित और कर्मठ",
  Aquarius: "स्वतंत्र, दूरदर्शी और मानवतावादी",
  Pisces: "कल्पनाशील, करुणामय और आध्यात्मिक",
};

const NAKSHATRA_MEANING = "Nakshatra means a lunar star group. In Vedic astrology, the sky is divided into 27 such groups, and the Moon's position is used to identify yours.";
const NAKSHATRA_MEANING_HI = "नक्षत्र का अर्थ चंद्र नक्षत्र समूह है। वैदिक ज्योतिष में आकाश को 27 नक्षत्रों में विभाजित किया गया है, और जन्म के समय चंद्रमा की स्थिति से आपका नक्षत्र निर्धारित होता है।";

const plainDate = (value: string, timezone: string, language: SupportedLanguage = "en") => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  try {
    const locale = language === "hi" ? "hi-IN" : "en-IN";
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: timezone }).format(date);
  } catch {
    return value.slice(0, 10);
  }
};

export function buildKundliPlanetSummary(report: KundliReport, language: SupportedLanguage = "en"): KundliPlanetSummary[] {
  const isHi = language === "hi";

  return report.planets.map((planet: PlanetPosition) => {
    const pName = isHi ? PLANET_NAMES_HI[planet.name] || planet.name : planet.name;
    const sName = isHi ? SIGN_NAMES_HI[planet.sign] || planet.sign : planet.sign;
    const meaning = isHi
      ? PLANET_MEANINGS_HI[planet.name] || "पारंपरिक जीवन-तत्व"
      : PLANET_MEANINGS[planet.name] || "a traditional life theme";
    const signStyle = isHi
      ? SIGN_MEANINGS_HI[planet.sign] || "व्यक्तिगत और प्रासंगिक"
      : SIGN_MEANINGS[planet.sign] || "unique to the individual";

    const explanation = isHi
      ? `आपकी कुंडली में ${pName}, ${sName} में और ${planet.house}वें भाव में स्थित है। सरल शब्दों में, ${pName} ${meaning} का प्रतीक है। ${sName} को पारंपरिक रूप से ${signStyle} प्रकृति का माना जाता है। ` +
        (planet.nakshatra ? `इसका नक्षत्र (चंद्र तारा समूह) ${planet.nakshatra} है। ` : "") +
        "ज्योतिषाचार्य इन सभी कारकों का समग्र अध्ययन करते हैं; केवल एक स्थिति किसी अंतिम परिणाम का निर्धारण नहीं करती।"
      : `In your chart, ${planet.name} is in ${planet.sign} and house ${planet.house}. In simple terms, ${planet.name} represents ${meaning}. ${planet.sign} is traditionally described as ${signStyle}. ` +
        (planet.nakshatra ? `Its Nakshatra (lunar star group) is ${planet.nakshatra}. ` : "") +
        "Astrologers read these factors together; one placement alone does not decide an outcome.";

    return {
      name: pName,
      sign: sName,
      house: planet.house,
      nakshatra: planet.nakshatra,
      explanation,
    };
  });
}

export function buildKundliHouseSummary(report: KundliReport, language: SupportedLanguage = "en"): KundliHouseSummary[] {
  const isHi = language === "hi";

  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const rawSign = SIGNS[(report.ascendant.signIndex + house - 1) % 12];
    const sign = isHi ? SIGN_NAMES_HI[rawSign] || rawSign : rawSign;
    const planets = report.planets.filter((planet) => planet.house === house);
    const planetNames = planets.map((planet) => (isHi ? PLANET_NAMES_HI[planet.name] || planet.name : planet.name));
    const signStyle = isHi
      ? SIGN_MEANINGS_HI[rawSign] || "व्यक्तिगत और प्रासंगिक"
      : SIGN_MEANINGS[rawSign] || "individual and context-dependent";

    const topicTitle = isHi ? HOUSE_TOPICS_HI[index] : HOUSE_TOPICS[index];

    const planetText = planets.length
      ? isHi
        ? ` यहाँ स्थित ग्रह: ${planetNames.join(", ")}।`
        : ` Planets here: ${planetNames.join(", ")}.`
      : isHi
      ? " इस भाव में कोई प्रमुख ग्रह स्थित नहीं है। इसका अर्थ यह कदापि नहीं कि जीवन का यह क्षेत्र महत्वपूर्ण नहीं है।"
      : " No major planet is listed in this house. That does not mean this part of life is unimportant.";

    const explanation = isHi
      ? `यह भाव पारंपरिक रूप से ${topicTitle} से संबंधित है। इसकी राशि ${sign} है, जिसे अक्सर ${signStyle} माना जाता है।${planetText}`
      : `This house is traditionally connected with ${HOUSE_TOPICS[index].toLowerCase()}. Its sign is ${rawSign}, often described as ${signStyle}.${planetText}`;

    return {
      house,
      sign,
      planets: planetNames,
      title: topicTitle,
      explanation,
    };
  });
}

export function buildKundliSimpleSummary(report: KundliReport, language: SupportedLanguage = "en"): string[] {
  const isHi = language === "hi";
  const moon = report.planets.find((planet) => planet.name === "Moon");
  const sun = report.planets.find((planet) => planet.name === "Sun");
  const current = report.vimshottari.currentMahadasha;
  const occupiedHouses = new Set(report.planets.map((planet) => planet.house)).size;
  const yogas = report.yogaCandidates || [];
  const panchang = report.panchang;

  const ascSign = isHi ? SIGN_NAMES_HI[report.ascendant.sign] || report.ascendant.sign : report.ascendant.sign;
  const moonSign = moon ? (isHi ? SIGN_NAMES_HI[moon.sign] || moon.sign : moon.sign) : "";
  const sunSign = sun ? (isHi ? SIGN_NAMES_HI[sun.sign] || sun.sign : sun.sign) : "";
  const dashaLord = isHi ? PLANET_NAMES_HI[current.lord] || current.lord : current.lord;

  if (isHi) {
    const summary = [
      `आपका लग्न (Rising Sign) ${ascSign} है। कुंडली में यह प्रथम भाव की राशि होती है। ज्योतिषाचार्य इसे आपके जीवन-दृष्टिकोण को समझने का प्राथमिक आधार मानते हैं; यह आपके व्यक्तित्व पर कोई निश्चित लेबल नहीं है।`,
      moon
        ? `आपका चंद्रमा ${moonSign} राशि में${moon.nakshatra ? ` तथा ${moon.nakshatra} नक्षत्र` : ""} में स्थित है। चंद्रमा को पारंपरिक रूप से मन, भावनाओं, मानसिक शांति और दैनिक आदतों से जोड़ा जाता है। ${NAKSHATRA_MEANING_HI}`
        : "इस रिपोर्ट में चंद्र स्थिति उपलब्ध नहीं है, अतः चंद्रमा पर आधारित व्याख्या शामिल नहीं है।",
      sun
        ? `आपका सूर्य ${sunSign} में, ${sun.house}वें भाव में स्थित है। सरल शब्दों में, ज्योतिषाचार्य सूर्य को आत्मविश्वास, आत्मसम्मान, पहचान और जीवन उद्देश्य से जोड़ते हैं।`
        : "इस रिपोर्ट में सूर्य की स्थिति उपलब्ध नहीं है।",
      `आपके ग्रह 12 में से ${occupiedHouses} भावों में स्थित हैं। प्रत्येक भाव जीवन के एक विशिष्ट आयाम जैसे परिवार, कार्य या संबंधों का प्रतिनिधित्व करता है। किसी भाव का रिक्त होना यह नहीं दर्शाता कि वह क्षेत्र जीवन से अनुपस्थित रहेगा।`,
      `आपकी वर्तमान महादशा ${dashaLord} की है, जो ${plainDate(current.start, report.birth.timezone, "hi")} से ${plainDate(current.end, report.birth.timezone, "hi")} तक प्रभावी है। महादशा को पारंपरिक ज्योतिषीय कालखंड का एक महत्वपूर्ण अध्याय समझें। यह किसी निश्चित घटना की गारंटी नहीं है।`,
    ];

    if (panchang) {
      summary.push(
        `आपका जन्म पंचांग पारंपरिक पांच-अंगीय कैलेंडर है। यह रिपोर्ट ${panchang.paksha || "—"} पक्ष (चंद्र कला), ${panchang.tithi || "—"} तिथि (चंद्र दिवस), ${panchang.yoga || "—"} योग (सूर्य-चंद्र गणना) और ${panchang.karana || "—"} करण (आधा चंद्र दिवस) दर्शाती है।`
      );
    }

    summary.push(
      yogas.length
        ? `गणना में ${yogas.length} संभावित योग पैटर्न पाए गए हैं। योग ग्रहों का पारंपरिक संयोजन होता है। ये केवल प्रारंभिक संकेतक हैं, पुष्टि किए गए शास्त्रीय योग नहीं।`
        : "प्रारंभिक जांच में कोई विशेष योग पैटर्न ध्वजांकित नहीं हुआ। यह इस बात का प्रमाण नहीं है कि आपकी कुंडली में कोई शास्त्रीय योग नहीं है।",
      "समग्रतः, इस रिपोर्ट को पारंपरिक वैदिक ज्योतिष के एक मार्गदर्शक परिचय के रूप में लें, किसी निश्चित भविष्यफल के रूप में नहीं। आपके व्यक्तिगत निर्णय, प्रयास और कर्म ही सर्वोपरि हैं।"
    );

    return summary;
  }

  // Default English summary
  const summary = [
    "Your rising sign (Lagna) is " + report.ascendant.sign + ". In a Kundli, this is the sign in the first house. Astrologers use it as the starting point for understanding your approach to life; it is not a fixed label for your personality.",
    moon
      ? "Your Moon is in " + moon.sign + (moon.nakshatra ? " and the " + moon.nakshatra + " Nakshatra" : "") + ". The Moon is traditionally linked with feelings, comfort and everyday habits. " + NAKSHATRA_MEANING
      : "Your Moon placement is not available in this report, so a Moon-based interpretation is not included.",
    sun
      ? "Your Sun is in " + sun.sign + ", in house " + sun.house + ". In simple terms, astrologers connect the Sun with confidence, identity and purpose."
      : "Your Sun placement is not available in this report.",
    "Your planets appear in " + occupiedHouses + " of the 12 houses. Each house represents a different part of life, such as family, work or relationships. An empty house does not mean that area will be absent from your life.",
    "Your current major period (Mahadasha) is " + current.lord + ", from " + plainDate(current.start, report.birth.timezone, "en") + " to " + plainDate(current.end, report.birth.timezone, "en") + ". Think of Mahadasha as a long chapter in the traditional astrology calendar. It is not a promise that a particular event will happen.",
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
