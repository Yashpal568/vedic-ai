import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { synthesizeAudio } from "@/lib/voice/tts-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const requestSchema = z.object({
  text: z.string().min(1).max(5000),
  language: z.enum(["en", "hi", "hinglish"]).default("en"),
  voiceId: z.string().optional(),
  speed: z.number().min(0.5).max(2.0).optional().default(1.0),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit(request, "voice-speech", 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many speech requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const json = await request.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ error: "Missing JSON payload." }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid speech synthesis payload.", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { text, language, voiceId, speed } = parsed.data;

    const ttsResult = await synthesizeAudio({
      text,
      language,
      voiceId,
      speed,
    });

    if (ttsResult && ttsResult.audioBase64) {
      return NextResponse.json({
        success: true,
        audioBase64: ttsResult.audioBase64,
        contentType: ttsResult.contentType,
        provider: ttsResult.provider,
        voiceId: ttsResult.voiceId,
        cached: ttsResult.cached ?? false,
        fallbackToBrowserSpeech: false,
      });
    }

    // Server TTS not configured; client should use Web Speech API
    return NextResponse.json({
      success: true,
      fallbackToBrowserSpeech: true,
      language,
    });
  } catch (error) {
    console.error("[api/voice/speech] Error:", error);
    return NextResponse.json(
      { error: "Speech synthesis failed." },
      { status: 500 }
    );
  }
}
