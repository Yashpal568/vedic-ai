/**
 * Vedic-AI Kundli Voice Extraction & Text Sanitization Utility
 * Extracts ONLY Section 5 and Section 6 from generated Kundli reports.
 * Strictly excludes Sections 1, 2, 3, 4, intro text, Section 7, and footers.
 * Strips markdown and special characters for natural, fluent voice synthesis.
 */

/**
 * Extracts only Section 5 and Section 6 content from a Kundli assistant response.
 * Works across both Hindi and English headings and variations.
 * Returns null if Sections 5 and 6 are not present in the content.
 */
export function extractKundliSections5And6(content: string): string | null {
  if (!content || typeof content !== "string") return null;

  // Locate the start of Section 5:
  // Matches "### 5.", "## 5.", "5.", or "**5." followed by section title
  const startRegex = /(?:^|\n)(?:#{1,4}\s*|\*{1,2}\s*)?5\.\s*([^\n]+)/i;
  const startMatch = content.match(startRegex);
  if (!startMatch || startMatch.index === undefined) return null;

  const startIndex = startMatch.index + (startMatch[0].startsWith("\n") ? 1 : 0);
  const remaining = content.slice(startIndex);

  // Locate the start of Section 7 or footer/boundary:
  // Matches "### 7.", "## 7.", "7.", or "**7." or "---" or "Vedic AI"
  const endRegex = /(?:\n(?:#{1,4}\s*|\*{1,2}\s*)?7\.\s*[^\n]+|\n\s*---|(?:\n|^)\s*Vedic AI\b)/i;
  const endMatch = remaining.match(endRegex);

  const rawSection5And6 = endMatch && endMatch.index !== undefined
    ? remaining.slice(0, endMatch.index).trim()
    : remaining.trim();

  // Verify that it contains Section 6 as well
  if (!/(?:^|\n)(?:#{1,4}\s*|\*{1,2}\s*)?6\.\s*[^\n]+/i.test(rawSection5And6)) {
    return null;
  }

  return rawSection5And6;
}

/**
 * Strips markdown syntax, bullets, special characters, and repeated punctuation
 * so the text is spoken fluently by Text-to-Speech (TTS) engines without
 * vocalizing punctuation marks or markdown artifacts.
 */
export function sanitizeTextForTTS(markdown: string): string {
  if (!markdown) return "";
  return markdown
    // Remove markdown headers (#, ##, ###, etc.)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold and italic markers (**text**, *text*, __text__, _text_)
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    // Remove inline code formatting (`code`)
    .replace(/`([^`]+)`/g, "$1")
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
    // Normalize spaces and line breaks
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    // Collapse duplicate punctuation (e.g. ",," or "..")
    .replace(/([.,?!])\s*([.,?!])+/g, "$1 ")
    .trim();
}
