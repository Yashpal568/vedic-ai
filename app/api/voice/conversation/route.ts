import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { answerReportQuestion } from "@/lib/voice/conversation-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const requestSchema = z.object({
  reportId: z.string().optional().default("active-report"),
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
  question: z.string().min(2).max(1000),
  hand: z.enum(["left", "right", "unsure"]).optional(),
  languagePreference: z.enum(["en", "hi", "hinglish", "auto"]).optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit(request, "voice-conversation", 25, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many questions asked in a short time. Please wait a moment." },
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
        { error: "Invalid question request payload.", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { reportId, report, question, hand, languagePreference, conversationHistory } = parsed.data;

    // Optional user authentication check
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // User-scoped rate limit
          const userRate = await checkRateLimit(request, "voice-qa-user", 20, 60_000, user.id);
          if (!userRate.allowed) {
            return NextResponse.json(
              { error: "Usage limit reached for voice questions. Please wait a moment." },
              { status: 429 }
            );
          }
        }
      } catch {
        // Continue if Supabase session is unavailable
      }
    }

    const response = await answerReportQuestion({
      reportId,
      report,
      question,
      hand,
      languagePreference,
      conversationHistory,
    });

    return NextResponse.json({
      success: true,
      answerText: response.answerText,
      language: response.language,
      audioBase64: response.audio?.audioBase64 || null,
      contentType: response.audio?.contentType || "audio/mpeg",
      provider: response.audio?.provider || "browser",
      fallbackToBrowserSpeech: !response.audio,
      groundedInReport: response.groundedInReport,
      canResumeNarration: response.canResumeNarration,
    });
  } catch (error) {
    console.error("[api/voice/conversation] Error:", error);
    return NextResponse.json(
      { error: "Failed to answer question about report." },
      { status: 500 }
    );
  }
}
