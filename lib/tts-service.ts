/**
 * Vedic-AI Text-to-Speech (TTS) Service
 * Primary provider: ElevenLabs (natural human-like multilingual conversational voice)
 * Secondary fallback: OpenAI TTS
 * Client fallback: Web Speech API
 */

import { synthesizeAudio, type TTSLanguage } from "@/lib/voice/tts-provider";

export interface SpeechSynthesisOptions {
  text: string;
  language: TTSLanguage;
  voiceId?: string;
  speed?: number;
}

export interface SpeechSynthesisResult {
  audioBase64: string;
  contentType: string;
  provider: "openai" | "elevenlabs" | "google";
}

/**
 * Attempts server-side speech synthesis using ElevenLabs (primary) or OpenAI (fallback).
 * Returns null if no server-side TTS provider is configured, triggering client Web Speech.
 */
export async function synthesizeSpeech(
  options: SpeechSynthesisOptions
): Promise<SpeechSynthesisResult | null> {
  if (!options.text || !options.text.trim()) return null;

  const result = await synthesizeAudio({
    text: options.text,
    language: options.language,
    voiceId: options.voiceId,
    speed: options.speed,
  });

  if (!result) return null;

  return {
    audioBase64: result.audioBase64,
    contentType: result.contentType,
    provider: result.provider === "elevenlabs" ? "elevenlabs" : "openai",
  };
}
