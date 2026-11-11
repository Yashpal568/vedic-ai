import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateStructuredNarration } from "@/lib/voice/narration-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const requestSchema = z.object({
  reportId: z.string().optional(),
  report: z.object({
    overallStructure: z.string().optional(),
    heartLine: z.string().optional(),
    headLine: z.string().optional(),
    lifeLine: z.string().optional(),
    fateLine: z.string().optional(),
    thumbCharacteristics: z.string().optional(),
    fingerProportions: z.string().optional(),
    mountOfVenus: z.string().optional(),
    mountOfJupiter: z.string().optional(),
    synthesis: z.string().optional(),
    remedies: z.array(z.string()).optional(),
  }),
  hand: z.enum(["left", "right", "unsure"]).optional(),
  languagePreference: z.enum(["en", "hi", "hinglish", "auto"]).optional(),
});

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit(request, "voice-narration", 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many narration requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const json = await request.json().catch(() => null);
    if (!json) {
      return NextResponse.json(
        { error: "Invalid request payload. A completed palm report is required." },
        { status: 400 }
      );
    }

    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid report schema for voice narration.", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { report, hand = "unsure", languagePreference = "auto", reportId } = parsed.data;

    // Verify minimum required report content
    if (
      !report.heartLine?.trim() &&
      !report.headLine?.trim() &&
      !report.lifeLine?.trim() &&
      !report.overallStructure?.trim()
    ) {
      return NextResponse.json(
        { error: "The provided palm report does not contain sufficient findings for spoken narration." },
        { status: 400 }
      );
    }

    const narration = await generateStructuredNarration({
      reportId: reportId || `palm-${Date.now()}`,
      report,
      hand,
      languagePreference,
    });

    return NextResponse.json({
      success: true,
      reportId: narration.reportId,
      detectedLanguage: narration.detectedLanguage,
      narrationText: narration.narrationText,
      sections: narration.sections,
      provider: narration.provider,
    });
  } catch (error) {
    console.error("[api/voice/narration] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate structured voice narration." },
      { status: 500 }
    );
  }
}
