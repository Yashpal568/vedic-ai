/**
 * Vedic-AI Kundli Voice Extraction & Text Sanitization Utility
 * Extracts ONLY Section 5 and Section 6 from generated Kundli reports.
 * Strictly excludes Sections 1, 2, 3, 4, intro text, Section 7, and footers.
 * Replaces robotic "Point 5 explain" / "Point 6 explain" / "5." / "6." with natural,
 * human introductory phrasing:
 * - English: "Important points about your Kundli" & "Practical guidance for your Kundli"
 * - Hindi: "आपकी कुंडली के महत्वपूर्ण बिंदु" & "आपकी कुंडली के लिए व्यावहारिक मार्गदर्शन"
 */

/**
 * Extracts only Section 5 and Section 6 content from a Kundli assistant response.
 * Works across both Hindi and English headings and variations.
 * Returns null if Sections 5 and 6 are not present in the content.
 */
export function extractKundliSections5And6(content: string): string | null {
  if (!content || typeof content !== "string") return null;

  // Locate the start of Section 5:
  // Matches "### 5.", "## 5.", "5.", "**5.", or "point 5" followed by section title
  const startRegex = /(?:^|\n)(?:#{1,4}\s*|\*{1,2}\s*)?(?:5\.|point\s*5\b)\s*([^\n]+)/i;
  const startMatch = content.match(startRegex);
  if (!startMatch || startMatch.index === undefined) return null;

  const startIndex = startMatch.index + (startMatch[0].startsWith("\n") ? 1 : 0);
  const remaining = content.slice(startIndex);

  // Locate the start of Section 7 or footer/boundary:
  // Matches "### 7.", "## 7.", "7.", "**7.", or "---" or "Vedic AI"
  const endRegex = /(?:\n(?:#{1,4}\s*|\*{1,2}\s*)?(?:7\.|point\s*7\b)\s*[^\n]+|\n\s*---|(?:\n|^)\s*Vedic AI\b)/i;
  const endMatch = remaining.match(endRegex);

  const rawSection5And6 = endMatch && endMatch.index !== undefined
    ? remaining.slice(0, endMatch.index).trim()
    : remaining.trim();

  // Verify that it contains Section 6 as well
  if (!/(?:^|\n)(?:#{1,4}\s*|\*{1,2}\s*)?(?:6\.|point\s*6\b)\s*[^\n]+/i.test(rawSection5And6)) {
    return null;
  }

  return rawSection5And6;
}

/**
 * Strips markdown syntax, bullets, special characters, and repeated punctuation
 * so the text is spoken fluently by Text-to-Speech (TTS) engines without
 * vocalizing punctuation marks or markdown artifacts.
 *
 * Replaces robotic "Point 5 explain" and "Point 6 explain" headings with warm,
 * respectful phrasing:
 * - English: "Important points about your Kundli:" & "Practical guidance for your Kundli:"
 * - Hindi: "आपकी कुंडली के महत्वपूर्ण बिंदु:" & "आपकी कुंडली के लिए व्यावहारिक मार्गदर्शन:"
 */
export function sanitizeTextForTTS(markdown: string, language?: "en" | "hi"): string {
  if (!markdown) return "";

  // Auto-detect Hindi if explicit language is 'hi' or text contains Devanagari Unicode
  const isHi = language === "hi" || /[\u0900-\u097F]/.test(markdown);

  // Warm, expressive introductory phrasing infused with curiosity, intrigue, and authentic Vedic warmth
  const s5Replacement = isHi
    ? "नमस्ते! आपकी जन्म कुंडली में कुछ बहुत ही दिलचस्प और महत्वपूर्ण बिंदु सामने आए हैं... इन्हें ध्यान से समझिए: आपकी कुंडली के महत्वपूर्ण बिंदु: "
    : "Namaste! Looking deeply into your birth chart, there are some truly fascinating and important observations to explore. Important points about your Kundli: ";

  // Empathetic, caring transition into practical daily life guidance
  const s6Replacement = isHi
    ? ". और आपके दैनिक जीवन में शांति व संतुलन के लिए, आपकी कुंडली के लिए व्यावहारिक मार्गदर्शन: "
    : ". And to bring daily harmony and conscious balance into your life, Practical guidance for your Kundli: ";

  // Match line 5 header safely up to end-of-line
  const s5Regex = /(?:^|\n)\s*(?:#{1,6}\s*|\*{1,2}\s*)?(?:point\s*5(?:\s*explain)?|5\.)(?:\s*explain)?(?:\s*(?:important\s*points(?:\s*about\s*your\s*kundli)?|key\s*(?:points|highlights)|मुख्य\s*बिंदु|महत्वपूर्ण\s*बिंदु))?[^\n]*/gi;

  // Match line 6 header safely up to end-of-line
  const s6Regex = /(?:^|\n)\s*(?:#{1,6}\s*|\*{1,2}\s*)?(?:point\s*6(?:\s*explain)?|6\.)(?:\s*explain)?(?:\s*(?:practical\s*guidance(?:\s*for\s*your\s*kundli)?|actionable\s*advice|व्यावहारिक\s*मार्गदर्शन))?[^\n]*/gi;

  let text = markdown
    // Replace Section 5 and 6 headers with natural human voice phrasing infused with curiosity & emotion
    .replace(s5Regex, "\n" + s5Replacement)
    .replace(s6Regex, "\n" + s6Replacement)
    // Remove markdown headers (#, ##, ###, etc.)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold and italic markers (**text**, *text*, __text__, _text_)
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    // Remove inline code formatting (`code`)
    .replace(/`([^`]+)`/g, "$1")
    // Natural ordinal house pronunciations in Hindi so it doesn't sound mechanical like "char-tha bhav"
    .replace(/4-था\s*भाव|4th\s*भाव/gi, "चौथे भाव")
    .replace(/10-वाँ\s*भाव|10-वां\s*भाव|10th\s*भाव/gi, "दसवें भाव")
    .replace(/11-वाँ\s*भाव|11-वां\s*भाव|11th\s*भाव/gi, "ग्यारहवें भाव")
    .replace(/12-वाँ\s*भाव|12-वां\s*भाव|12th\s*भाव/gi, "बारहवें भाव")
    .replace(/1-ला\s*भाव|1st\s*भाव/gi, "प्रथम भाव")
    .replace(/2-रा\s*भाव|2nd\s*भाव/gi, "दूसरे भाव")
    .replace(/3-रा\s*भाव|3rd\s*भाव/gi, "तीसरे भाव")
    .replace(/5-वाँ\s*भाव|5-वां\s*भाव|5th\s*भाव/gi, "पांचवें भाव")
    .replace(/6-ठा\s*भाव|6-वां\s*भाव|6th\s*भाव/gi, "छठे भाव")
    .replace(/7-वाँ\s*भाव|7-वां\s*भाव|7th\s*भाव/gi, "सातवें भाव")
    .replace(/8-वाँ\s*भाव|8-वां\s*भाव|8th\s*भाव/gi, "आठवें भाव")
    .replace(/9-वाँ\s*भाव|9-वां\s*भाव|9th\s*भाव/gi, "नवम भाव")
    // Clean grouped planet dashes inside parentheses e.g. (मंगल-बृहस्पति-केतु)
    .replace(/\(([^\)]+)-([^\)]+)-([^\)]+)\)/g, isHi ? " में $1, $2 और $3 " : " with $1, $2 and $3 ")
    .replace(/\(([^\)]+)-([^\)]+)\)/g, isHi ? " में $1 और $2 " : " with $1 and $2 ")
    // Remove leading bullet points (-, *, •, +, >)
    .replace(/^[\s*•\-+>]+\s*/gm, "")
    // Turn em-dashes and en-dashes into commas for natural conversational pauses
    .replace(/\s*[—–]\s*/g, ", ")
    // Clean markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove stray symbols (#, ~, `, |, >)
    .replace(/[#~`|]/g, "")
    // Remove empty parentheses
    .replace(/\(\s*\)/g, "")
    // Strip any remaining literal "point 5 explain", "point 6 explain", or isolated "point 5/6"
    .replace(/\bpoint\s*5(?:\s*explain)?\b/gi, "")
    .replace(/\bpoint\s*6(?:\s*explain)?\b/gi, "")
    // Normalize spaces and line breaks
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    // Normalize punctuation after header colons
    .replace(/:\s*,\s*/g, ": ")
    // Collapse duplicate punctuation (e.g. ",," or "..")
    .replace(/([.,?!])\s*([.,?!])+/g, "$1 ")
    // Clean punctuation around sentence boundaries
    .replace(/,\s*\./g, ".")
    .replace(/\.\s*,/g, ".")
    .replace(/^[,.\s]+/, "")
    .trim();

  // Conclude with warm, supportive Vedic wisdom
  const closingWisdom = isHi
    ? ". याद रखें, जन्म कुंडली संभावनाओं का सुंदर दर्पण है, आपका सजग कर्म, धैर्य और आत्म-विश्वास ही आपकी सच्ची शक्ति है।"
    : ". Always remember, your birth chart reflects celestial potentials, but your conscious karma, clarity of mind, and inner strength guide your path.";

  if (!text.endsWith("।") && !text.endsWith(".")) {
    text += ".";
  }

  return text + closingWisdom;
}
