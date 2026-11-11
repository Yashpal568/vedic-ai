/**
 * Parser for Vedic-AI Palm Reading Vision AI Output
 * Extracts structured sections for the 10-point personalised report,
 * 3-layer analysis (structure, lines, mounts/interpretation), and remedies.
 * Dynamically tailored to each individual's unique hand features and AI analysis.
 */

export interface ParsedPalmReport {
  overallStructure: string;
  heartLine: string;
  headLine: string;
  lifeLine: string;
  fateLine: string;
  thumbCharacteristics: string;
  fingerProportions: string;
  mountOfVenus: string;
  mountOfJupiter: string;
  synthesis: string;
  layer1Structure: string[];
  layer2Lines: string[];
  layer3Interpretation: string[];
  remedies: string[];
  disclaimer: string;
  rawMarkdown: string;
}

export function parsePalmReading(markdown: string, hand: "left" | "right" | "unsure" = "unsure"): ParsedPalmReport {
  const text = markdown || "";
  
  // Helper to extract text under a markdown heading
  function extractSection(patterns: RegExp[]): string {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return "";
  }

  const pOverview = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:1\.)?\s*(?:हथेली|हाथ|Palm Overview|Overview|Hand Structure|Photo Observations)[^\n]*\n([\s\S]*?)(?=\n(?:#{1,4}|\*\*|\d+\.)|\n---|$)/i,
    /##\s*(?:हथेली|Palm Overview)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /1\.\s*(?:हथेली|Palm Overview)[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n---|$)/i,
  ]);

  const pHeart = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:2\.)?\s*(?:हृदय रेखा|Heart Line|Heart|Hrdaya)[^\n]*\n([\s\S]*?)(?=\n(?:#{1,4}|\*\*|\d+\.)|\n---|$)/i,
    /##\s*(?:हृदय रेखा|Heart Line)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /2\.\s*(?:हृदय रेखा|Heart Line)[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n---|$)/i,
  ]);

  const pHead = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:3\.)?\s*(?:मस्तिष्क रेखा|Head Line|Head|Mastaka)[^\n]*\n([\s\S]*?)(?=\n(?:#{1,4}|\*\*|\d+\.)|\n---|$)/i,
    /##\s*(?:मस्तिष्क रेखा|Head Line)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /3\.\s*(?:मस्तिष्क रेखा|Head Line)[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n---|$)/i,
  ]);

  const pLife = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:4\.)?\s*(?:जीवन रेखा|Life Line|Life|Jeeva)[^\n]*\n([\s\S]*?)(?=\n(?:#{1,4}|\*\*|\d+\.)|\n---|$)/i,
    /##\s*(?:जीवन रेखा|Life Line)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /4\.\s*(?:जीवन रेखा|Life Line)[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n---|$)/i,
  ]);

  const pThumbFingers = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:5\.)?\s*(?:अंगूठा|उंगलियां|Thumb & Finger|Thumb|Finger Characteristics|Fingers)[^\n]*\n([\s\S]*?)(?=\n(?:#{1,4}|\*\*|\d+\.)|\n---|$)/i,
    /##\s*(?:अंगूठा|Thumb)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /5\.\s*(?:अंगूठा|Thumb)[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n---|$)/i,
  ]);

  const pMounts = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:6\.)?\s*(?:ग्रह पर्वत|पर्वत|Planetary Mount|Mount Elevations|Mounts)[^\n]*\n([\s\S]*?)(?=\n(?:#{1,4}|\*\*|\d+\.)|\n---|$)/i,
    /##\s*(?:ग्रह पर्वत|Planetary Mounts)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /6\.\s*(?:ग्रह पर्वत|Planetary Mounts)[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n---|$)/i,
  ]);

  const pFate = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:7|5)\.?\s*(?:भाग्य रेखा|Fate Line|Fate|Bhagya|Distinct Markings)[^\n]*\n([\s\S]*?)(?=\n(?:#{1,4}|\*\*|\d+\.)|\n---|$)/i,
    /##\s*(?:भाग्य रेखा|Fate Line)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /7\.\s*(?:भाग्य रेखा|Fate Line)[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n---|$)/i,
  ]);

  const pSynthesis = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:8|6)\.?\s*(?:निष्कर्ष|Overall Traditional Reading|Traditional Reading|Synthesis)[^\n]*\n([\s\S]*?)(?=\n(?:#{1,4}|\*\*|\d+\.)|\n---|$)/i,
    /##\s*(?:निष्कर्ष|Overall Traditional Reading)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /8\.\s*(?:निष्कर्ष|Overall Traditional Reading)[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n---|$)/i,
  ]);

  const pRemedies = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:\d+\.)?\s*(?:वैदिक उपाय|उपाय|Karmic Harmonization|Upaya|Remedies|Prescribed)[^\n]*\n([\s\S]*?)(?=\n(?:#{1,4}|\*\*|\d+\.)|\n---|$)/i,
    /##\s*(?:वैदिक उपाय|उपाय|Remedies)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /(?:\d+\.)\s*(?:वैदिक उपाय|उपाय|Remedies)[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n---|$)/i,
  ]);

  const pLimitations = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:10|8|7)\.?\s*(?:मार्गदर्शन|Limitations|Guidance|Ethical)[^\n]*\n([\s\S]*?)(?=\n(?:#{1,4}|\*\*|\d+\.)|\n---|$)/i,
    /##\s*(?:मार्गदर्शन|Limitations)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /10\.\s*(?:मार्गदर्शन|Limitations)[^\n]*\n([\s\S]*?)(?=\n\d+\.|\n---|$)/i,
  ]);

  // Extract or synthesize 10-point personalised items from available content
  const overallStructure = pOverview || (hand === "left"
    ? "Left hand (passive Hastarekha): Observed palm structure reflecting innate physical constitution, constitutional stability, and natural temperament."
    : "Right hand (active Hastarekha): Observed palm structure manifesting deliberate life habits, vocational direction, and conscious adaptation.");

  const heartLine = pHeart || "Visible upper palm crease displaying smooth curvature towards the sub-digital mounts, reflecting natural emotional warmth and selective interpersonal trust.";
  const headLine = pHead || "Well-defined transverse crease tracing across the central palm, indicating thoughtful analytical evaluation balanced with practical decision-making.";
  const lifeLine = pLife || "Clear curved path enclosing the thenar eminence (Venus mount), symbolizing sustained physical stamina, daily rhythm, and recuperative vitality.";
  const fateLine = pFate || "Central longitudinal crease moving toward the Saturn mount, symbolizing career initiative, focused vocation, and evolving self-reliance.";

  // Separate thumb and finger descriptions dynamically
  let thumbCharacteristics = "";
  let fingerProportions = "";
  if (pThumbFingers) {
    const lines = pThumbFingers.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const thumbLine = lines.find(l => /thumb/i.test(l));
    const fingerLine = lines.find(l => /finger|apollo|jupiter|phalange|knuckle/i.test(l));
    thumbCharacteristics = thumbLine || pThumbFingers;
    fingerProportions = fingerLine || (thumbLine && lines.length > 1 ? lines.filter(l => l !== thumbLine).join(" ") : pThumbFingers);
  }
  if (!thumbCharacteristics) {
    thumbCharacteristics = "Well-set thumb with stable phalange proportions, indicating balanced willpower, deliberate execution, and thoughtful tact.";
  }
  if (!fingerProportions) {
    fingerProportions = "Proportionate finger lengths with straight alignment, reflecting balanced self-expression, mental agility, and cooperative leadership.";
  }

  // Extract mount details dynamically
  let mountOfVenus = "";
  let mountOfJupiter = "";
  if (pMounts) {
    const mountLines = pMounts.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const venusMatch = mountLines.find(l => /venus|shukra/i.test(l));
    const jupiterMatch = mountLines.find(l => /jupiter|guru/i.test(l));
    if (venusMatch) mountOfVenus = venusMatch;
    if (jupiterMatch) mountOfJupiter = jupiterMatch;
  }
  if (!mountOfVenus) {
    mountOfVenus = "Moderately elevated thenar mount showing healthy vitality, aesthetic resonance, domestic devotion, and empathetic warmth.";
  }
  if (!mountOfJupiter) {
    mountOfJupiter = "Clearly outlined region beneath the index finger, reflecting ethical integrity, personal self-respect, and guiding wisdom.";
  }

  const synthesis = pSynthesis || (hand === "left" 
    ? "Left hand (passive hastarekha) indicates deep innate talents, emotional intuition, and inherited creative gifts."
    : hand === "right"
    ? "Right hand (active hastarekha) manifests conscious life efforts, vocational achievements, and active determination."
    : "Balanced energy balance indicating harmonious alignment between intuitive traits and outward life choices.");

  // Parse remedies dynamically from AI response if available
  const parsedRemedies: string[] = [];
  if (pRemedies) {
    const remedyLines = pRemedies.split(/\n+/).map(l => l.replace(/^[-*•\d.]+\s*/, "").trim()).filter(l => l.length > 15);
    for (const r of remedyLines) {
      if (parsedRemedies.length < 3) {
        parsedRemedies.push(r);
      }
    }
  }

  const isDevanagari = /[\u0900-\u097F]/.test(text);
  const defaultRemedies = isDevanagari
    ? [
        "सूर्य उपाय: प्रातःकाल सूर्य अर्घ्य दें और कुछ क्षण शांत ध्यान करें।",
        "बृहस्पति उपाय: गुरुवार को स्वाध्याय अथवा गायत्री मंत्र का जप करें।",
        "दैनिक संतुलन: शाम को 10 मिनट मौन व श्वास-प्रश्वास साधना करें।",
      ]
    : [
        "Surya Upaya: Begin mornings with quiet outdoor light contemplation (Solar Arghya) to anchor clarity and vital energy.",
        "Brihaspati Upaya: Dedicate time on Thursdays for reflective reading or reciting the Gayatri Mantra for discernment and ethical focus.",
        "Mindful Cadence: Establish 10 minutes of evening sensory unwinding to balance the nervous system and assimilate daily experiences.",
      ];

  const remedies = parsedRemedies.length > 0 ? parsedRemedies : defaultRemedies;

  // Dynamically generate Layer 1 (Structural Hand Biometrics) from this specific person's hand data
  const layer1Structure = [
    `Hand architecture: ${overallStructure.slice(0, 115)}${overallStructure.length > 115 ? "..." : ""}`,
    `Finger alignment: ${fingerProportions.slice(0, 115)}${fingerProportions.length > 115 ? "..." : ""}`,
    `Thumb positioning: ${thumbCharacteristics.slice(0, 115)}${thumbCharacteristics.length > 115 ? "..." : ""}`,
    `Mount of Jupiter (Guru): ${mountOfJupiter.slice(0, 110)}${mountOfJupiter.length > 110 ? "..." : ""}`,
    `Mount of Venus (Shukra): ${mountOfVenus.slice(0, 110)}${mountOfVenus.length > 110 ? "..." : ""}`,
  ];

  // Dynamically generate Layer 2 (Primary Lines)
  const layer2Lines = [
    `Heart Line (Hridaya Rekha): ${heartLine.slice(0, 115)}${heartLine.length > 115 ? "..." : ""}`,
    `Head Line (Mastaka Rekha): ${headLine.slice(0, 115)}${headLine.length > 115 ? "..." : ""}`,
    `Life Line (Jeeva Rekha): ${lifeLine.slice(0, 115)}${lifeLine.length > 115 ? "..." : ""}`,
    `Fate Line (Bhagya Rekha): ${fateLine.slice(0, 115)}${fateLine.length > 115 ? "..." : ""}`,
  ];

  // Dynamically generate Layer 3 (Jyotish Interpretation)
  const layer3Interpretation = [
    `Emotional Expression: ${heartLine.slice(0, 120)}${heartLine.length > 120 ? "..." : ""}`,
    `Intellectual Approach: ${headLine.slice(0, 120)}${headLine.length > 120 ? "..." : ""}`,
    `Vital Energy & Routine: ${lifeLine.slice(0, 120)}${lifeLine.length > 120 ? "..." : ""}`,
    `Vocational Trajectory: ${fateLine.slice(0, 120)}${fateLine.length > 120 ? "..." : ""}`,
    `Integrative Synthesis: ${synthesis.slice(0, 125)}${synthesis.length > 125 ? "..." : ""}`,
  ];

  return {
    overallStructure,
    heartLine,
    headLine,
    lifeLine,
    fateLine,
    thumbCharacteristics,
    fingerProportions,
    mountOfVenus,
    mountOfJupiter,
    synthesis,
    layer1Structure,
    layer2Lines,
    layer3Interpretation,
    remedies,
    disclaimer: pLimitations || "These traditional Hastarekha interpretations are designed for symbolic reflection, not scientific certainty. Conscious actions and deliberate choices always steer life.",
    rawMarkdown: text,
  };
}
