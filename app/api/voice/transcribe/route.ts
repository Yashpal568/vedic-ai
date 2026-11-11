import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { transcribeAudioBlob } from "@/lib/voice/conversation-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit(request, "voice-transcribe", 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many transcription requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Missing multipart audio data." }, { status: 400 });
    }

    const audio = formData.get("audio");
    if (!audio || typeof audio === "string") {
      return NextResponse.json({ error: "No audio file provided in request." }, { status: 400 });
    }

    if (audio.size < 800) {
      return NextResponse.json({ error: "Audio recording was too short. Please speak again." }, { status: 400 });
    }

    if (audio.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio recording exceeds 8 MB limit." }, { status: 413 });
    }

    const result = await transcribeAudioBlob(audio);

    return NextResponse.json({
      success: true,
      text: result.text,
      detectedLanguage: result.language,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "GROQ_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Voice transcription is not configured. Please add GROQ_API_KEY." },
        { status: 503 }
      );
    }
    console.error("[api/voice/transcribe] Error:", error);
    return NextResponse.json(
      { error: "Audio transcription failed." },
      { status: 500 }
    );
  }
}
