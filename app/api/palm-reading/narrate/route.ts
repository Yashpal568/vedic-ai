import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateNarrationScript } from "@/lib/palm-narration-service";
import { synthesizeSpeech } from "@/lib/tts-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const requestSchema = z.object({
  report: z.object({
    overallStructure: z.string().min(5),
    heartLine: z.string().min(5),
    headLine: z.string().min(5),
    lifeLine: z.string().min(5),
    fateLine: z.string().optional(),
    thumbCharacteristics: z.string().optional(),
    fingerProportions: z.string().optional(),
    mountOfVenus: z.string().optional(),
    mountOfJupiter: z.string().optional(),
    synthesis: z.string().optional(),
    remedies: z.array(z.string()).optional(),
  }),
  hand: z.enum(["left", "right", "unsure"]).optional(),
  language: z.enum(["en", "hi", "hinglish"]).optional(),
});

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit(request, "palm-narrate", 25, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many voice requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const json = await request.json().catch(() => null);
    if (!json) {
      return NextResponse.json(
        { error: "Invalid request payload. A valid completed palm report is required." },
        { status: 400 }
      );
    }

    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Cannot generate voice narration from an incomplete or missing report." },
        { status: 400 }
      );
    }

    const { report, hand = "unsure", language = "en" } = parsed.data;

    // Reject empty reports
    if (
      !report.heartLine.trim() ||
      !report.headLine.trim() ||
      !report.lifeLine.trim() ||
      !report.overallStructure.trim()
    ) {
      return NextResponse.json(
        { error: "The provided palm report does not contain enough data for spoken narration." },
        { status: 400 }
      );
    }

    // 1. Generate conversational spoken narration script using Groq / LLM
    const narration = await generateNarrationScript({
      report,
      hand,
      language,
    });

    if (!narration.script || narration.script.length < 20) {
      return NextResponse.json(
        { error: "Could not generate speech script for this palm report." },
        { status: 502 }
      );
    }

    // 2. Attempt server-side speech synthesis via configured TTS provider (OpenAI / ElevenLabs)
    const ttsResult = await synthesizeSpeech({
      text: narration.script,
      language,
    });

    if (ttsResult && ttsResult.audioBase64) {
      return NextResponse.json({
        success: true,
        script: narration.script,
        language: narration.language,
        audioBase64: ttsResult.audioBase64,
        contentType: ttsResult.contentType,
        provider: ttsResult.provider,
        fallbackToBrowserSpeech: false,
      });
    }

    // 3. Fallback to browser Web Speech API
    return NextResponse.json({
      success: true,
      script: narration.script,
      language: narration.language,
      provider: narration.provider,
      fallbackToBrowserSpeech: true,
    });
  } catch (error) {
    console.error("[api/palm-reading/narrate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate voice report explanation. Please try again." },
      { status: 500 }
    );
  }
}

