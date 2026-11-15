import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const requestSchema = z.object({
  reportId: z.string().optional(),
  sourceLanguage: z.enum(["en", "hi"]),
  targetLanguage: z.enum(["en", "hi"]),
  sections: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(1).max(3000),
      })
    )
    .min(1)
    .max(30),
});

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit(request, "translate-report", 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many translation requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const json = await request.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload.", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { sourceLanguage, targetLanguage, sections } = parsed.data;

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({
        ok: true,
        translations: sections.map((s) => ({ id: s.id, text: s.text })),
      });
    }

    const targetDesc =
      targetLanguage === "hi"
        ? "natural, respectful, authentic Hindi (हिन्दी) in Devanagari script using classical Jyotish and Hastarekha terminology"
        : "clear, plain, respectful everyday English";

    const prompt = `You are an expert Vedic astrology and Hastarekha translator. Your sole duty is to faithfully translate the following sections from ${sourceLanguage.toUpperCase()} to ${targetLanguage.toUpperCase()} (${targetDesc}).

NON-NEGOTIABLE TRANSLATION RULES:
1. FAITHFUL TRANSLATION ONLY: Do not reinterpret, recalculate, or alter any astrological claims or observations.
2. DO NOT OMIT ANYTHING: Every condition, nuance, caveat, and paragraph must be fully translated.
3. DO NOT ADD CONTENT: Do not invent new predictions, remedies, or claims not present in the original text.
4. PRESERVE ALL IMMUTABLE VALUES: All degrees, numbers, dates, hand landmarks, mounts, and line classifications must remain completely intact.
5. Return ONLY a valid JSON object with the exact format:
{
  "translations": [
    { "id": "section_id", "text": "translated text" }
  ]
}

Input Sections to translate:
${JSON.stringify(sections, null, 2)}`;

    const groqKey = process.env.GROQ_API_KEY?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    // 1. Try Groq first with JSON mode
    if (groqKey) {
      const groqModel = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: groqModel,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_completion_tokens: 1500,
          }),
          signal: AbortSignal.timeout(14000),
        });

        if (response.ok) {
          const data = await response.json();
          const raw = data?.choices?.[0]?.message?.content;
          if (raw) {
            const parsedOutput = JSON.parse(raw);
            if (Array.isArray(parsedOutput?.translations) && parsedOutput.translations.length > 0) {
              return NextResponse.json({
                ok: true,
                provider: "groq",
                translations: parsedOutput.translations,
              });
            }
          }
        }
      } catch {
        // Fall through to Gemini or fallback
      }
    }

    // 2. Try Gemini with JSON response schema
    if (geminiKey) {
      const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
          signal: AbortSignal.timeout(14000),
        });

        if (response.ok) {
          const data = await response.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsedOutput = JSON.parse(raw);
            if (Array.isArray(parsedOutput?.translations) && parsedOutput.translations.length > 0) {
              return NextResponse.json({
                ok: true,
                provider: "gemini",
                translations: parsedOutput.translations,
              });
            }
          }
        }
      } catch {
        // Fall through to fallback
      }
    }

    // 3. Fallback: Return original sections with clear indicator
    return NextResponse.json(
      {
        ok: false,
        warning: "AI translation unavailable; using deterministic client-side localization.",
        translations: sections.map((s) => ({ id: s.id, text: s.text })),
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Translation request failed.", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

