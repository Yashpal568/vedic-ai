/**
 * Vedic-AI Language Detection & Voice Selection Service
 * Automatically identifies Hindi (Devanagari), English, or Hinglish from report text
 * and selects optimal voice metadata for natural conversational audio delivery.
 */

export type VoiceLanguage = "en" | "hi" | "hinglish";

export interface LanguageDetectionResult {
  detectedLanguage: VoiceLanguage;
  confidence: number;
  hasDevanagari: boolean;
  hasHinglishMarkers: boolean;
  reason: string;
}

// Common conversational Hinglish tokens and transliterated Jyotish vocabulary
const HINGLISH_PATTERNS = [
  /\b(?:aapka|aapki|aapke|mein|hai|hain|yeh|woh|kya|kyun|hota|hoti|hote)\b/i,
  /\b(?:rekha|hridaya|mastaka|jeeva|bhagya|parvat|guru|shani|surya|shukra|budha|chandra)\b/i,
  /\b(?:haath|dhyan|rakhein|karmas|upaya|shanti|kundli|nakshatra|lagna)\b/i,
  /\b(?:dekhkar|dikhaata|dikhaati|karti|karta|milta|milti|rahega|rahegi)\b/i,
];

/**
 * Detects whether text is Hindi (Devanagari), Hinglish, or English.
 */
export function detectVoiceLanguage(text: string, userPreference?: VoiceLanguage | "auto"): LanguageDetectionResult {
  if (userPreference && userPreference !== "auto") {
    return {
      detectedLanguage: userPreference,
      confidence: 1.0,
      hasDevanagari: /[\u0900-\u097F]/.test(text),
      hasHinglishMarkers: false,
      reason: `User explicit preference: ${userPreference}`,
    };
  }

  if (!text || !text.trim()) {
    return {
      detectedLanguage: "en",
      confidence: 0.5,
      hasDevanagari: false,
      hasHinglishMarkers: false,
      reason: "Empty text defaulted to English",
    };
  }

  // 1. Check for Devanagari Unicode characters (U+0900 to U+097F)
  const devanagariMatches = text.match(/[\u0900-\u097F]/g);
  const devanagariCount = devanagariMatches ? devanagariMatches.length : 0;
  const totalLetters = (text.match(/[\p{L}]/gu) || []).length || 1;
  const devanagariRatio = devanagariCount / totalLetters;

  if (devanagariRatio > 0.15 || devanagariCount > 20) {
    return {
      detectedLanguage: "hi",
      confidence: Math.min(0.98, Math.max(0.7, devanagariRatio * 1.5)),
      hasDevanagari: true,
      hasHinglishMarkers: false,
      reason: `Devanagari script ratio: ${(devanagariRatio * 100).toFixed(1)}%`,
    };
  }

  // 2. Check for Hinglish vocabulary markers in Roman script
  let hinglishMatches = 0;
  for (const pattern of HINGLISH_PATTERNS) {
    if (pattern.test(text)) {
      hinglishMatches++;
    }
  }

  if (hinglishMatches >= 3) {
    return {
      detectedLanguage: "hinglish",
      confidence: Math.min(0.92, 0.5 + hinglishMatches * 0.1),
      hasDevanagari: false,
      hasHinglishMarkers: true,
      reason: `Identified ${hinglishMatches} Hinglish lexical markers`,
    };
  }

  // 3. Default to English with standard astrological terminology
  return {
    detectedLanguage: "en",
    confidence: 0.88,
    hasDevanagari: false,
    hasHinglishMarkers: false,
    reason: "Standard English structure detected",
  };
}

/**
 * Maps detected language to ElevenLabs and OpenAI voice configurations.
 */
export function getRecommendedVoiceConfig(language: VoiceLanguage) {
  switch (language) {
    case "hi":
      return {
        elevenLabsModel: "eleven_multilingual_v2",
        elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
        openAIVoice: "nova",
        speechSpeed: 0.94,
        promptTone: "respectful, serene, elder Jyotish scholar speaking pure Hindi",
      };
    case "hinglish":
      return {
        elevenLabsModel: "eleven_multilingual_v2",
        elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
        openAIVoice: "alloy",
        speechSpeed: 0.96,
        promptTone: "conversational, warm, modern Indian guide speaking fluent Hinglish",
      };
    case "en":
    default:
      return {
        elevenLabsModel: "eleven_multilingual_v2",
        elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
        openAIVoice: "alloy",
        speechSpeed: 0.96,
        promptTone: "warm, eloquent, mindful guide with clear Indian-English cadence",
      };
  }
}
