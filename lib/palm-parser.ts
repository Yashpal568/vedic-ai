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

export function parsePalmReading(
  markdown: string,
  _hand: "left" | "right" | "unsure" = "unsure",
  language: "en" | "hi" | "hinglish" = "en"
): ParsedPalmReport {
  const text = markdown || "";
  const isHi = language === "hi" || /[\u0900-\u097F]/.test(text);
  
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
    /(?:#{1,4}|\*\*)\s*(?:1\.)?\s*(?:हथेली|हाथ|Palm Overview|Overview|Hand Structure|Photo Observations)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n\*\*\s*\d+\.|\n\d+\.\s+(?:[A-Z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,}:|##)|\n---|$)/i,
    /##\s*(?:हथेली|Palm Overview)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /1\.\s*(?:हथेली|Palm Overview)[^\n]*\n([\s\S]*?)(?=\n\d+\.\s+[A-Za-z\u0900-\u097F]|\n---|$)/i,
  ]);

  const pHeart = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:2\.)?\s*(?:हृदय रेखा|Heart Line|Heart|Hrdaya)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n\*\*\s*\d+\.|\n\d+\.\s+(?:[A-Z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,}:|##)|\n---|$)/i,
    /##\s*(?:हृदय रेखा|Heart Line)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /2\.\s*(?:हृदय रेखा|Heart Line)[^\n]*\n([\s\S]*?)(?=\n\d+\.\s+[A-Za-z\u0900-\u097F]|\n---|$)/i,
  ]);

  const pHead = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:3\.)?\s*(?:मस्तिष्क रेखा|Head Line|Head|Mastaka)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n\*\*\s*\d+\.|\n\d+\.\s+(?:[A-Z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,}:|##)|\n---|$)/i,
    /##\s*(?:मस्तिष्क रेखा|Head Line)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /3\.\s*(?:मस्तिष्क रेखा|Head Line)[^\n]*\n([\s\S]*?)(?=\n\d+\.\s+[A-Za-z\u0900-\u097F]|\n---|$)/i,
  ]);

  const pLife = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:4\.)?\s*(?:जीवन रेखा|Life Line|Life|Jeeva)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n\*\*\s*\d+\.|\n\d+\.\s+(?:[A-Z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,}:|##)|\n---|$)/i,
    /##\s*(?:जीवन रेखा|Life Line)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /4\.\s*(?:जीवन रेखा|Life Line)[^\n]*\n([\s\S]*?)(?=\n\d+\.\s+[A-Za-z\u0900-\u097F]|\n---|$)/i,
  ]);

  const pThumbFingers = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:5\.)?\s*(?:अंगूठा|उंगलियां|Thumb & Finger|Thumb|Finger Characteristics|Fingers)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n\*\*\s*\d+\.|\n\d+\.\s+(?:[A-Z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,}:|##)|\n---|$)/i,
    /##\s*(?:अंगूठा|Thumb)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /5\.\s*(?:अंगूठा|Thumb)[^\n]*\n([\s\S]*?)(?=\n\d+\.\s+[A-Za-z\u0900-\u097F]|\n---|$)/i,
  ]);

  const pMounts = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:6\.)?\s*(?:ग्रह पर्वत|पर्वत|Planetary Mount|Mount Elevations|Mounts)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n\*\*\s*\d+\.|\n\d+\.\s+(?:[A-Z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,}:|##)|\n---|$)/i,
    /##\s*(?:ग्रह पर्वत|Planetary Mounts)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /6\.\s*(?:ग्रह पर्वत|Planetary Mounts)[^\n]*\n([\s\S]*?)(?=\n\d+\.\s+[A-Za-z\u0900-\u097F]|\n---|$)/i,
  ]);

  const pFate = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:7|5)\.?\s*(?:भाग्य रेखा|Fate Line|Fate|Bhagya|Distinct Markings)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n\*\*\s*\d+\.|\n\d+\.\s+(?:[A-Z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,}:|##)|\n---|$)/i,
    /##\s*(?:भाग्य रेखा|Fate Line)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /7\.\s*(?:भाग्य रेखा|Fate Line)[^\n]*\n([\s\S]*?)(?=\n\d+\.\s+[A-Za-z\u0900-\u097F]|\n---|$)/i,
  ]);

  const pSynthesis = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:8|6)\.?\s*(?:निष्कर्ष|Overall Traditional Reading|Traditional Reading|Synthesis)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n\*\*\s*\d+\.|\n\d+\.\s+(?:[A-Z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{2,}:|##)|\n---|$)/i,
    /##\s*(?:निष्कर्ष|Overall Traditional Reading)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /8\.\s*(?:निष्कर्ष|Overall Traditional Reading)[^\n]*\n([\s\S]*?)(?=\n\d+\.\s+[A-Za-z\u0900-\u097F]|\n---|$)/i,
  ]);

  const pRemedies = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:9\.)?\s*(?:वैदिक उपाय|उपाय|Karmic Harmonization|Upaya|Remedies|Prescribed)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n---|$)/i,
    /##\s*(?:वैदिक उपाय|उपाय|Remedies)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /(?:\d+\.)\s*(?:वैदिक उपाय|उपाय|Remedies)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n---|$)/i,
  ]);

  const pLimitations = extractSection([
    /(?:#{1,4}|\*\*)\s*(?:10|8|7)\.?\s*(?:मार्गदर्शन|Limitations|Guidance|Ethical)[^\n]*\n([\s\S]*?)(?=\n#{1,4}|\n---|$)/i,
    /##\s*(?:मार्गदर्शन|Limitations)[^\n]*\n([\s\S]*?)(?=\n##|\n---|$)/i,
    /10\.\s*(?:मार्गदर्शन|Limitations)[^\n]*\n([\s\S]*?)(?=\n---|$)/i,
  ]);

  // Extract or synthesize 10-point personalised items from available content
  const notVisible = isHi
    ? "इस चित्र में यह रेखा या लक्षण स्पष्ट रूप से दृश्य नहीं है। बिना प्रत्यक्ष अवलोकन के इसका अनुमान नहीं लगाया जाएगा।"
    : "Not clearly distinguishable in this photo. The report will not infer this feature without a clear visual observation.";
  const overallStructure = pOverview || notVisible;

  const heartLine = pHeart || notVisible;
  const headLine = pHead || notVisible;
  const lifeLine = pLife || notVisible;
  const fateLine = pFate || notVisible;

  // Separate thumb and finger descriptions dynamically
  let thumbCharacteristics = "";
  let fingerProportions = "";
  if (pThumbFingers) {
    const lines = pThumbFingers.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const thumbLine = lines.find(l => /thumb|अंगूठा/i.test(l));
    const fingerLine = lines.find(l => /finger|apollo|jupiter|phalange|knuckle|उंगली|उंगलियां|तर्जनी|अनामिका|मध्यमा/i.test(l));
    thumbCharacteristics = thumbLine || pThumbFingers;
    fingerProportions = fingerLine || (thumbLine && lines.length > 1 ? lines.filter(l => l !== thumbLine).join(" ") : pThumbFingers);
  }
  if (!thumbCharacteristics) {
    thumbCharacteristics = notVisible;
  }
  if (!fingerProportions) {
    fingerProportions = notVisible;
  }

  // Extract mount details dynamically
  let mountOfVenus = "";
  let mountOfJupiter = "";
  if (pMounts) {
    const mountLines = pMounts.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const venusMatch = mountLines.find(l => /venus|shukra|शुक्र/i.test(l));
    const jupiterMatch = mountLines.find(l => /jupiter|guru|बृहस्पति|गुरू/i.test(l));
    if (venusMatch) mountOfVenus = venusMatch;
    if (jupiterMatch) mountOfJupiter = jupiterMatch;
  }
  if (!mountOfVenus) {
    mountOfVenus = notVisible;
  }
  if (!mountOfJupiter) {
    mountOfJupiter = notVisible;
  }

  const synthesis = pSynthesis || (isHi
    ? "चित्र से पर्याप्त स्पष्ट अवलोकन प्राप्त न होने के कारण व्यक्तिगत निष्कर्ष तैयार नहीं किया जा सका। कृपया स्पष्ट फोटो के साथ पुनः प्रयास करें।"
    : "A personalised synthesis cannot be produced because the vision response did not include enough image-grounded observations. Please analyse the photo again.");

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

  const defaultRemedies = isHi
    ? ["व्यक्तिगत उपाय नहीं दिए गए: फोटो से पर्याप्त विशिष्ट संकेत प्राप्त नहीं हुए।", "पहले स्पष्ट फोटो के साथ रेखाओं और पर्वतों का पुनः विश्लेषण करें।", "किसी भी उपाय को निश्चित परिणाम या वैज्ञानिक सलाह न मानें।"]
    : ["No personalised remedy was generated because the image did not provide enough specific visual evidence.", "Retake the photo in even lighting and request a fresh analysis of the visible lines and mounts.", "Treat traditional practices as reflective guidance, not guaranteed outcomes or medical advice."];

  const remedies = parsedRemedies.length > 0 ? parsedRemedies : defaultRemedies;

  // Dynamically generate Layer 1 (Structural Hand Biometrics) from this specific person's hand data
  const layer1Structure = isHi
    ? [
        `हथेली की संरचना: ${overallStructure.slice(0, 115)}${overallStructure.length > 115 ? "..." : ""}`,
        `उंगलियों का अनुपात: ${fingerProportions.slice(0, 115)}${fingerProportions.length > 115 ? "..." : ""}`,
        `अंगूठे की स्थिति: ${thumbCharacteristics.slice(0, 115)}${thumbCharacteristics.length > 115 ? "..." : ""}`,
        `बृहस्पति पर्वत (गुरु): ${mountOfJupiter.slice(0, 110)}${mountOfJupiter.length > 110 ? "..." : ""}`,
        `शुक्र पर्वत: ${mountOfVenus.slice(0, 110)}${mountOfVenus.length > 110 ? "..." : ""}`,
      ]
    : [
        `Hand architecture: ${overallStructure.slice(0, 115)}${overallStructure.length > 115 ? "..." : ""}`,
        `Finger alignment: ${fingerProportions.slice(0, 115)}${fingerProportions.length > 115 ? "..." : ""}`,
        `Thumb positioning: ${thumbCharacteristics.slice(0, 115)}${thumbCharacteristics.length > 115 ? "..." : ""}`,
        `Mount of Jupiter (Guru): ${mountOfJupiter.slice(0, 110)}${mountOfJupiter.length > 110 ? "..." : ""}`,
        `Mount of Venus (Shukra): ${mountOfVenus.slice(0, 110)}${mountOfVenus.length > 110 ? "..." : ""}`,
      ];

  // Dynamically generate Layer 2 (Primary Lines)
  const layer2Lines = isHi
    ? [
        `हृदय रेखा (Hridaya Rekha): ${heartLine.slice(0, 115)}${heartLine.length > 115 ? "..." : ""}`,
        `मस्तिष्क रेखा (Mastaka Rekha): ${headLine.slice(0, 115)}${headLine.length > 115 ? "..." : ""}`,
        `जीवन रेखा (Jeeva Rekha): ${lifeLine.slice(0, 115)}${lifeLine.length > 115 ? "..." : ""}`,
        `भाग्य रेखा (Bhagya Rekha): ${fateLine.slice(0, 115)}${fateLine.length > 115 ? "..." : ""}`,
      ]
    : [
        `Heart Line (Hridaya Rekha): ${heartLine.slice(0, 115)}${heartLine.length > 115 ? "..." : ""}`,
        `Head Line (Mastaka Rekha): ${headLine.slice(0, 115)}${headLine.length > 115 ? "..." : ""}`,
        `Life Line (Jeeva Rekha): ${lifeLine.slice(0, 115)}${lifeLine.length > 115 ? "..." : ""}`,
        `Fate Line (Bhagya Rekha): ${fateLine.slice(0, 115)}${fateLine.length > 115 ? "..." : ""}`,
      ];

  // Dynamically generate Layer 3 (Jyotish Interpretation)
  const layer3Interpretation = isHi
    ? [
        `भावनात्मक अभिव्यक्ति: ${heartLine.slice(0, 120)}${heartLine.length > 120 ? "..." : ""}`,
        `बौद्धिक दृष्टिकोण: ${headLine.slice(0, 120)}${headLine.length > 120 ? "..." : ""}`,
        `प्राणशक्ति व दिनचर्या: ${lifeLine.slice(0, 120)}${lifeLine.length > 120 ? "..." : ""}`,
        `करियर व कर्म पथ: ${fateLine.slice(0, 120)}${fateLine.length > 120 ? "..." : ""}`,
        `समग्र वैदिक निष्कर्ष: ${synthesis.slice(0, 125)}${synthesis.length > 125 ? "..." : ""}`,
      ]
    : [
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
    disclaimer: pLimitations || (isHi
      ? "ये पारंपरिक हस्तरेखा व्याख्याएं आत्म-चिंतन के लिए हैं, निश्चित वैज्ञानिक भविष्यवाणी नहीं। आपके सजग विचार और सत्कर्म ही जीवन को दिशा देते हैं।"
      : "These traditional Hastarekha interpretations are designed for symbolic reflection, not scientific certainty. Conscious actions and deliberate choices always steer life."),
    rawMarkdown: text,
  };
}
