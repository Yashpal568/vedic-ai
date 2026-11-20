/**
 * Vedic-AI Dedicated Chat Message Localization & Translation Service
 *
 * Provides reactive translation of chat assistant messages when the user
 * toggles between English and Hindi, preserving Jyotish terminology and
 * caching translations to avoid redundant network requests.
 */

import type { SupportedLanguage } from "./types";
import {
  computeReportHash,
  isDevanagariText,
  deterministicTranslateToHindi,
} from "./report-translator";

export { isDevanagariText };

const CHAT_CACHE_KEY = "vedic-chat-translations-v1";
const inMemoryChatCache = new Map<string, string>();

// Canonical standard greetings in English and Hindi
const GREETING_EN =
  "Hi there! 👋 Welcome to Vedic AI — I can help you explore what your birth chart says about personality, career, relationships, Mahadashas, or even today's Panchang. Feel free to ask a question or share your birth details so we can calculate your chart together.";

const GREETING_HI =
  "नमस्ते! 👋 वैदिक एआई (Vedic AI) में आपका स्वागत है — मैं यह जानने में आपकी सहायता कर सकता हूँ कि आपकी जन्म कुंडली आपके व्यक्तित्व, करियर, संबंधों, महादशाओं या आज के पंचांग के बारे में क्या कहती है। बेझिझक कोई प्रश्न पूछें या अपने जन्म का विवरण साझा करें ताकि हम आपकी कुंडली की गणना कर सकें।";

const WELCOME_EN =
  "Namaste! 🙏 How can I assist you with your cosmic chart today? Explore the language of the planets, your questions, and traditional Jyotish concepts.";

const WELCOME_HI =
  "नमस्ते! 🙏 आज मैं आपके जन्मांग और आकाशीय मानचित्र में क्या सहायता कर सकता हूँ? ग्रहों की भाषा, आपके प्रश्न और पारंपरिक ज्योतिष सिद्धांतों को समझें।";

// Canonical 7-section headers
const SECTION_HEADERS_EN_TO_HI: Array<[RegExp, string]> = [
  [/###\s*1\.\s*Your Question/gi, "### 1. आपका प्रश्न"],
  [/###\s*2\.\s*Simple Answer/gi, "### 2. संक्षेप में उत्तर"],
  [/###\s*3\.\s*What Your Kundli Shows/gi, "### 3. आपकी कुंडली क्या दर्शाती है"],
  [/###\s*4\.\s*What This Means for You/gi, "### 4. आपके लिए इसका क्या अर्थ है"],
  [/###\s*5\.\s*Important Points(?:\s*About\s*Your\s*Kundli)?/gi, "### 5. मुख्य बिंदु"],
  [/###\s*6\.\s*Practical Guidance(?:\s*For\s*Your\s*Kundli)?/gi, "### 6. व्यावहारिक मार्गदर्शन"],
  [/###\s*7\.\s*Limitations & Context/gi, "### 7. परंपरा व संदर्भ"],
  [/\*\*1\.\s*Your Question\*\*/gi, "**1. आपका प्रश्न**"],
  [/\*\*2\.\s*Simple Answer\*\*/gi, "**2. संक्षेप में उत्तर**"],
  [/\*\*3\.\s*What Your Kundli Shows\*\*/gi, "**3. आपकी कुंडली क्या दर्शाती है**"],
  [/\*\*4\.\s*What This Means for You\*\*/gi, "**4. आपके लिए इसका क्या अर्थ है**"],
  [/\*\*5\.\s*Important Points(?:\s*About\s*Your\s*Kundli)?\*\*/gi, "**5. मुख्य बिंदु**"],
  [/\*\*6\.\s*Practical Guidance(?:\s*For\s*Your\s*Kundli)?\*\*/gi, "**6. व्यावहारिक मार्गदर्शन**"],
  [/\*\*7\.\s*Limitations & Context\*\*/gi, "**7. परंपरा व संदर्भ**"],
];

const SECTION_HEADERS_HI_TO_EN: Array<[RegExp, string]> = [
  [/###\s*1\.\s*आपका प्रश्न/g, "### 1. Your Question"],
  [/###\s*2\.\s*संक्षेप में उत्तर/g, "### 2. Simple Answer"],
  [/###\s*3\.\s*आपकी कुंडली क्या दर्शाती है/g, "### 3. What Your Kundli Shows"],
  [/###\s*4\.\s*आपके लिए इसका क्या अर्थ है/g, "### 4. What This Means for You"],
  [/###\s*5\.\s*मुख्य बिंदु/g, "### 5. Important Points"],
  [/###\s*6\.\s*व्यावहारिक मार्गदर्शन/g, "### 6. Practical Guidance"],
  [/###\s*7\.\s*परंपरा व संदर्भ/g, "### 7. Limitations & Context"],
  [/\*\*1\.\s*आपका प्रश्न\*\*/g, "**1. Your Question**"],
  [/\*\*2\.\s*संक्षेप में उत्तर\*\*/g, "**2. Simple Answer**"],
  [/\*\*3\.\s*आपकी कुंडली क्या दर्शाती है\*\*/g, "**3. What Your Kundli Shows**"],
  [/\*\*4\.\s*आपके लिए इसका क्या अर्थ है\*\*/g, "**4. What This Means for You**"],
  [/\*\*5\.\s*मुख्य बिंदु\*\*/g, "**5. Important Points**"],
  [/\*\*6\.\s*व्यावहारिक मार्गदर्शन\*\*/g, "**6. Practical Guidance**"],
  [/\*\*7\.\s*परंपरा व संदर्भ\*\*/g, "**7. Limitations & Context**"],
];

/**
 * Get cached chat translation
 */
export function getCachedChatTranslation(contentHash: string, targetLang: SupportedLanguage): string | null {
  const key = `chat:${contentHash}:${targetLang}`;
  if (inMemoryChatCache.has(key)) return inMemoryChatCache.get(key)!;

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(CHAT_CACHE_KEY);
      if (raw) {
        const store = JSON.parse(raw) as Record<string, string>;
        if (store[key]) {
          inMemoryChatCache.set(key, store[key]);
          return store[key];
        }
      }
    } catch {}
  }
  return null;
}

/**
 * Save chat translation to cache
 */
export function setCachedChatTranslation(
  contentHash: string,
  targetLang: SupportedLanguage,
  translatedText: string
): void {
  const key = `chat:${contentHash}:${targetLang}`;
  inMemoryChatCache.set(key, translatedText);

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(CHAT_CACHE_KEY);
      const store: Record<string, string> = raw ? JSON.parse(raw) : {};
      store[key] = translatedText;

      // Bound cache to 80 items
      const keys = Object.keys(store);
      if (keys.length > 80) {
        delete store[keys[0]];
      }
      window.localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(store));
    } catch {}
  }
}

/**
 * Translate an assistant chat message reactively when the user switches language
 */
export async function translateAssistantChatMessage(
  content: string,
  targetLang: SupportedLanguage
): Promise<string> {
  if (!content || !content.trim()) return content;

  const isDevanagari = isDevanagariText(content);
  // If content is already in target language, return as is
  if (targetLang === "hi" && isDevanagari) return content;
  if (targetLang === "en" && !isDevanagari) return content;

  const contentHash = computeReportHash(content);
  const cached = getCachedChatTranslation(contentHash, targetLang);
  if (cached) return cached;

  // 1. Check for standard greetings
  if (targetLang === "hi") {
    if (content.includes("Welcome to Vedic AI") || content.includes("welcome to Vedic AI")) {
      setCachedChatTranslation(contentHash, "hi", GREETING_HI);
      return GREETING_HI;
    }
    if (content.includes("assist you with your cosmic chart") || content.includes("Explore the language of the planets")) {
      setCachedChatTranslation(contentHash, "hi", WELCOME_HI);
      return WELCOME_HI;
    }
  } else {
    if (content.includes("वैदिक एआई (Vedic AI) में आपका स्वागत है") || content.includes("वैदिक एआई में आपका स्वागत है")) {
      setCachedChatTranslation(contentHash, "en", GREETING_EN);
      return GREETING_EN;
    }
    if (content.includes("आज मैं आपके जन्मांग") || content.includes("ग्रहों की भाषा")) {
      setCachedChatTranslation(contentHash, "en", WELCOME_EN);
      return WELCOME_EN;
    }
  }

  // 2. Prepare sections for server-side translation
  // If message contains markdown sections (### or ** headings), translate them cleanly
  let preprocessed = content;
  if (targetLang === "hi") {
    for (const [re, rep] of SECTION_HEADERS_EN_TO_HI) {
      preprocessed = preprocessed.replace(re, rep);
    }
  } else {
    for (const [re, rep] of SECTION_HEADERS_HI_TO_EN) {
      preprocessed = preprocessed.replace(re, rep);
    }
  }

  // Split content into manageable chunks for translate-report API
  const paragraphs = preprocessed.split("\n\n").filter((p) => p.trim().length > 0);
  const sections = paragraphs.map((p, idx) => ({
    id: `p_${idx}`,
    text: p.slice(0, 2800),
  }));

  try {
    if (typeof window !== "undefined" && window.location?.origin) {
      const res = await fetch("/api/translate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLanguage: targetLang === "hi" ? "en" : "hi",
          targetLanguage: targetLang,
          sections,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.translations && Array.isArray(json.translations)) {
          const map: Record<string, string> = {};
          for (const item of json.translations) {
            if (item.id && typeof item.text === "string" && item.text.trim()) {
              map[item.id] = item.text.trim();
            }
          }
          const translatedParagraphs = sections.map((s) => map[s.id] || s.text);
          const fullTranslation = translatedParagraphs.join("\n\n");
          if (fullTranslation.trim()) {
            setCachedChatTranslation(contentHash, targetLang, fullTranslation);
            return fullTranslation;
          }
        }
      }
    }
  } catch (err) {
    console.warn("[vedic-ai] translateAssistantChatMessage fetch failed:", err);
  }

  // 3. Deterministic Fallback if network translation failed
  const fallback = targetLang === "hi" ? deterministicTranslateToHindi(preprocessed) : preprocessed;
  setCachedChatTranslation(contentHash, targetLang, fallback);
  return fallback;
}
