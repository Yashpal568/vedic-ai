import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  const limit = await checkRateLimit(request, "voice-transcription", 12, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many voice requests. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Voice transcription is not configured yet. Add GROQ_API_KEY in Vercel → Settings → Environment Variables, then redeploy." },
      { status: 503 },
    );
  }

  try {
    const incoming = await request.formData();
    const audio = incoming.get("audio");
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "No audio recording was received. Please record again." }, { status: 400 });
    }
    if (audio.size < 1500) {
      return NextResponse.json({ error: "The recording was too short. Please speak for a little longer." }, { status: 400 });
    }
    if (audio.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Recording is too large. Please record a shorter message under 10 MB." }, { status: 413 });
    }
    const payload = new FormData();
    payload.append("file", audio, audio.name || "voice-input.webm");
    payload.append("model", process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo");
    payload.append("response_format", "json");
    // Let Whisper detect Hindi/English automatically; do not force a language.
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key },
      body: payload,
      signal: AbortSignal.timeout(22_000),
    });
    if (!response.ok) {
      const providerError = await response.json().catch(() => null) as { error?: { message?: string; code?: string } } | null;
      console.error("[vedic-ai] voice transcription failed", {
        httpStatus: response.status,
        code: providerError?.error?.code || "unknown",
        message: providerError?.error?.message || "No provider error message",
      });
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "Voice transcription API access was denied. Check that GROQ_API_KEY is valid in Vercel and redeploy." }, { status: 502 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: "Voice transcription is rate-limited right now. Please wait and try again." }, { status: 429 });
      }
      return NextResponse.json({ error: "Voice transcription provider failed temporarily. Please try again." }, { status: 502 });
    }
    const data = await response.json() as { text?: unknown };
    const text = typeof data.text === "string" ? data.text.trim() : "";
    if (!text) return NextResponse.json({ text: "" });
    return NextResponse.json({ text });
  } catch (error) {
    console.error("[vedic-ai] voice transcription request failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "Could not transcribe the audio. Check your connection and try again." }, { status: 502 });
  }
}
