import { NextResponse } from "next/server";
import { getTTSConfigurationStatus, ElevenLabsTTSProvider } from "@/lib/voice/tts-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = getTTSConfigurationStatus();
  const elevenLabs = new ElevenLabsTTSProvider();
  const voices = await elevenLabs.getAvailableVoices();

  return NextResponse.json({
    feature: "Vedic AI Voice Assistant",
    version: "2.0.0",
    providers: {
      primary: "elevenlabs",
      elevenLabsConfigured: status.elevenLabsConfigured,
      openAIConfigured: status.openAIConfigured,
      groqConfigured: Boolean(process.env.GROQ_API_KEY),
      hasServerAudio: status.hasServerTTS,
      fallbackToBrowserSpeech: status.fallbackToBrowserSpeech,
    },
    capabilities: {
      automaticNarration: true,
      synchronizedHighlighting: true,
      interactiveVoiceQA: true,
      streamingSupport: true,
      languageAutoDetection: true,
    },
    supportedLanguages: [
      { code: "en", name: "English", description: "Warm, respectful Indian-English cadence" },
      { code: "hi", name: "हिन्दी", description: "Pure, serene Devanagari Hindi" },
      { code: "hinglish", name: "Hinglish", description: "Natural conversational Romanized Hindi" },
    ],
    availableVoices: voices.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description,
      language: v.language,
      provider: v.provider,
    })),
  });
}
