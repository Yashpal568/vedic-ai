/**
 * Vedic-AI Text-to-Speech (TTS) Provider Abstraction
 * Supports ElevenLabs as primary provider with OpenAI TTS and browser speech fallbacks.
 * Includes server-side audio caching and stream management.
 */

import crypto from "crypto";

export type TTSLanguage = "en" | "hi" | "hinglish";

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender?: "male" | "female";
  description?: string;
  provider: "elevenlabs" | "openai" | "browser";
}

export interface TTSGenerateOptions {
  text: string;
  language: TTSLanguage;
  voiceId?: string;
  speed?: number; // 0.75 to 1.5
}

export interface TTSResult {
  audioBase64: string;
  contentType: string;
  provider: "elevenlabs" | "openai" | "browser";
  voiceId: string;
  cached?: boolean;
}

export interface TTSProvider {
  id: "elevenlabs" | "openai";
  name: string;
  generateSpeech(options: TTSGenerateOptions): Promise<TTSResult>;
  streamSpeech?(options: TTSGenerateOptions): Promise<ReadableStream<Uint8Array>>;
  getAvailableVoices(language?: TTSLanguage): Promise<TTSVoice[]>;
  validateConfiguration(): {
    configured: boolean;
    provider: string;
    missingKeys: string[];
  };
}

// In-memory bounded cache for synthesized audio to eliminate redundant TTS calls
interface CacheEntry {
  audioBase64: string;
  contentType: string;
  provider: "elevenlabs" | "openai" | "browser";
  voiceId: string;
  timestamp: number;
}

const audioCache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateCacheKey(text: string, provider: string, voiceId: string, speed = 1.0): string {
  const hash = crypto.createHash("sha256");
  hash.update(`${provider}:${voiceId}:${speed}:${text.trim()}`);
  return hash.digest("hex");
}

function getFromCache(key: string): CacheEntry | null {
  const entry = audioCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    audioCache.delete(key);
    return null;
  }
  return entry;
}

function setToCache(key: string, entry: Omit<CacheEntry, "timestamp">) {
  if (audioCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }
  audioCache.set(key, { ...entry, timestamp: Date.now() });
}

/**
 * ElevenLabs TTS Provider (Primary)
 */
export class ElevenLabsTTSProvider implements TTSProvider {
  id = "elevenlabs" as const;
  name = "ElevenLabs";

  validateConfiguration() {
    const key = process.env.ELEVENLABS_API_KEY?.trim();
    return {
      configured: Boolean(key),
      provider: "elevenlabs",
      missingKeys: key ? [] : ["ELEVENLABS_API_KEY"],
    };
  }

  async getAvailableVoices(language?: TTSLanguage): Promise<TTSVoice[]> {
    const configuredVoiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || "21m00Tcm4TlvDq8ikWAM";
    return [
      {
        id: configuredVoiceId,
        name: "Aditi / Vedic Guide",
        language: language || "hi",
        gender: "female",
        description: "Natural, warm, conversational Indian voice calibrated for Vedic wisdom",
        provider: "elevenlabs",
      },
      {
        id: "onwK4e9ZLuTAKqWW03F9",
        name: "Aarav / Astrologer Sage",
        language: language || "en",
        gender: "male",
        description: "Deep, calm, reflective tone ideal for traditional Jyotish analysis",
        provider: "elevenlabs",
      },
    ];
  }

  async generateSpeech(options: TTSGenerateOptions): Promise<TTSResult> {
    const key = process.env.ELEVENLABS_API_KEY?.trim();
    if (!key) {
      throw new Error("ELEVENLABS_NOT_CONFIGURED");
    }

    const voiceId =
      options.voiceId?.trim() ||
      process.env.ELEVENLABS_VOICE_ID?.trim() ||
      "21m00Tcm4TlvDq8ikWAM"; // Default natural multilingual voice

    const cacheKey = generateCacheKey(options.text, "elevenlabs", voiceId, options.speed);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return {
        audioBase64: cached.audioBase64,
        contentType: cached.contentType,
        provider: "elevenlabs",
        voiceId,
        cached: true,
      };
    }

    // eleven_multilingual_v2 handles Hindi, English, and Hinglish with high naturalness
    const modelId = process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2";

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: options.text.slice(0, 4096),
        model_id: modelId,
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.8,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
      signal: AbortSignal.timeout(22_000),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      console.warn(`[tts-provider] ElevenLabs HTTP ${response.status}: ${errBody}`);
      if (response.status === 401 || response.status === 403) {
        throw new Error("ELEVENLABS_AUTH_FAILED");
      }
      if (response.status === 429) {
        throw new Error("ELEVENLABS_RATE_LIMITED");
      }
      throw new Error(`ELEVENLABS_ERROR_${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString("base64");
    const result: TTSResult = {
      audioBase64,
      contentType: "audio/mpeg",
      provider: "elevenlabs",
      voiceId,
    };

    setToCache(cacheKey, {
      audioBase64,
      contentType: "audio/mpeg",
      provider: "elevenlabs",
      voiceId,
    });

    return result;
  }
}

/**
 * OpenAI TTS Provider (Secondary Fallback)
 */
export class OpenAITTSProvider implements TTSProvider {
  id = "openai" as const;
  name = "OpenAI";

  validateConfiguration() {
    const key = process.env.OPENAI_API_KEY?.trim();
    return {
      configured: Boolean(key),
      provider: "openai",
      missingKeys: key ? [] : ["OPENAI_API_KEY"],
    };
  }

  async getAvailableVoices(): Promise<TTSVoice[]> {
    return [
      { id: "nova", name: "Nova", language: "hi", gender: "female", provider: "openai" },
      { id: "alloy", name: "Alloy", language: "en", gender: "male", provider: "openai" },
      { id: "shimmer", name: "Shimmer", language: "en", gender: "female", provider: "openai" },
    ];
  }

  async generateSpeech(options: TTSGenerateOptions): Promise<TTSResult> {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      throw new Error("OPENAI_NOT_CONFIGURED");
    }

    const defaultVoice = options.language === "hi" ? "nova" : "alloy";
    const voiceId = options.voiceId?.trim() || defaultVoice;

    const cacheKey = generateCacheKey(options.text, "openai", voiceId, options.speed);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return {
        audioBase64: cached.audioBase64,
        contentType: cached.contentType,
        provider: "openai",
        voiceId,
        cached: true,
      };
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: voiceId,
        input: options.text.slice(0, 4096),
        response_format: "mp3",
        speed: options.speed || 0.96,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("OPENAI_RATE_LIMITED");
      throw new Error(`OPENAI_ERROR_${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString("base64");

    const result: TTSResult = {
      audioBase64,
      contentType: "audio/mpeg",
      provider: "openai",
      voiceId,
    };

    setToCache(cacheKey, {
      audioBase64,
      contentType: "audio/mpeg",
      provider: "openai",
      voiceId,
    });

    return result;
  }
}

/**
 * Unified Audio Synthesizer
 * Tries ElevenLabs first, then OpenAI TTS, then yields null to trigger client Web Speech.
 */
export async function synthesizeAudio(options: TTSGenerateOptions): Promise<TTSResult | null> {
  const elevenLabs = new ElevenLabsTTSProvider();
  if (elevenLabs.validateConfiguration().configured) {
    try {
      return await elevenLabs.generateSpeech(options);
    } catch (err) {
      console.warn("[tts-provider] ElevenLabs synthesis failed, falling back:", err);
    }
  }

  const openAI = new OpenAITTSProvider();
  if (openAI.validateConfiguration().configured) {
    try {
      return await openAI.generateSpeech(options);
    } catch (err) {
      console.warn("[tts-provider] OpenAI synthesis failed, falling back:", err);
    }
  }

  // Both server providers unconfigured or failed; returns null so client uses browser Web Speech API
  return null;
}

/**
 * Returns configuration state of available TTS providers for health checks and UI config
 */
export function getTTSConfigurationStatus() {
  const elevenLabs = new ElevenLabsTTSProvider().validateConfiguration();
  const openAI = new OpenAITTSProvider().validateConfiguration();

  return {
    primaryProvider: "elevenlabs",
    elevenLabsConfigured: elevenLabs.configured,
    openAIConfigured: openAI.configured,
    hasServerTTS: elevenLabs.configured || openAI.configured,
    fallbackToBrowserSpeech: !elevenLabs.configured && !openAI.configured,
    supportedLanguages: ["en", "hi", "hinglish"],
  };
}
