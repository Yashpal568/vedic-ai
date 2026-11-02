import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 45;

const schema = z.object({
  image: z.string().min(1).max(8_000_000),
  hand: z.enum(["left", "right", "unsure"]).default("unsure"),
  question: z.string().max(800).optional(),
});

function buildPalmPrompt(hand: "left" | "right" | "unsure", question?: string) {
  return `You are a careful visual assistant producing a detailed, beginner-friendly traditional palmistry report from the supplied palm photograph. Palmistry is cultural symbolism, not a scientifically validated way to predict a person's life.

IMAGE QUALITY GATE:
First decide whether this is clearly a real palm photo, with the open palm, major creases and enough focus/light to inspect. If not, return {"clear":false,"reason":"..."} with one practical instruction. Do not guess lines from blur, shadows, jewellery, tattoos, scars or image artifacts.

Hand identified by the user: ${hand}.
User's question: ${question?.trim() || "Explain the visible major palm lines in simple language."}

IF CLEAR, write a detailed but cautious report in plain English, using these headings:
## Photo and hand observations
Describe only what is visibly clear; say when a feature cannot be assessed.
## Heart line
Explain where it appears to run and its visible shape, then clearly label any traditional symbolic interpretation.
## Head line
Describe only visible features and explain the traditional symbolism.
## Life line
Describe its visible path. Explicitly explain that it does NOT measure lifespan or predict death or health.
## Fate line and other visible lines
Discuss only if clearly visible; otherwise say "not clear enough to assess".
## Overall traditional reading
Give a balanced summary without certainty or dramatic claims.
## Important note
Remind the user this is a cultural/reflective interpretation, not a factual assessment or prediction.

Use short paragraphs and bullet points. Distinguish "What I can see" from "Traditional meaning". Do not claim certainty about health, lifespan, death, marriage dates, pregnancy, wealth, or exact future events. Do not diagnose any medical condition. Do not invent line features.

Return ONLY valid JSON:
{"clear":true,"reading":"..."}
or
{"clear":false,"reason":"..."}
Escape quotation marks correctly. No markdown fences around the JSON.`;
}

function errorMessage(status: number, provider: "Groq" | "Gemini") {
  if (status === 429) return "The palm-reading service is busy or at its usage limit. Please wait a moment and try again.";
  if (status === 401 || status === 403) return provider + " rejected the server API key. Check the corresponding key in your production environment variables.";
  if (status === 404) return "The configured vision model is unavailable. Update the palm vision model configuration and redeploy.";
  return "The palm-reading service could not analyse this image. Please try again with a clear, well-lit photo.";
}

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const match = body.image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return NextResponse.json({ error: "Upload a JPG, PNG, or WebP palm photo." }, { status: 400 });
    const mimeType = match[1];
    const base64 = match[2];
    if (base64.length > 6_000_000) return NextResponse.json({ error: "Image is too large. Please upload a photo under 4 MB." }, { status: 413 });
    const imageBytes = Buffer.from(base64, "base64");
    if (!imageBytes.length || imageBytes.length > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "The image data is invalid or exceeds 4 MB. Please choose another photo." }, { status: 413 });
    }

    const prompt = buildPalmPrompt(body.hand, body.question);
    const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
    const useGroqVision = provider === "groq" || (!process.env.GEMINI_API_KEY && Boolean(process.env.GROQ_API_KEY));
    let response: Response;
    let selectedProvider: "Groq" | "Gemini";

    if (useGroqVision) {
      selectedProvider = "Groq";
      const key = process.env.GROQ_API_KEY;
      if (!key) return NextResponse.json({ error: "Palm reading needs GROQ_API_KEY or GEMINI_API_KEY configured on the server." }, { status: 503 });

      // Llama 4 Scout was shut down on Groq in July 2026. Migrate old env overrides too.
      const configuredModel = process.env.PALM_GROQ_MODEL?.trim();
      const retiredModels = ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"];
      const model = !configuredModel || retiredModels.includes(configuredModel)
        ? "qwen/qwen3.6-27b"
        : configuredModel;

      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: "data:" + mimeType + ";base64," + base64 } }
          ] }],
          temperature: 0.2,
          max_completion_tokens: 1800,
          response_format: { type: "json_object" }
        }),
        signal: AbortSignal.timeout(35_000),
      });
      if (!response.ok) {
        const upstream = await response.json().catch(() => ({}));
        console.error("[palm-reading] Groq vision provider status:", response.status, "code:", upstream?.error?.code || upstream?.error?.type || "unknown", "model:", model);
        return NextResponse.json({ error: errorMessage(response.status, "Groq") }, { status: response.status === 429 ? 429 : response.status === 401 || response.status === 403 ? 503 : 502 });
      }
    } else {
      selectedProvider = "Gemini";
      const key = process.env.GEMINI_API_KEY;
      if (!key) return NextResponse.json({ error: "Palm reading needs GEMINI_API_KEY or GROQ_API_KEY configured on the server." }, { status: 503 });
      const model = process.env.PALM_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: 1800 }
        }),
        signal: AbortSignal.timeout(35_000),
      });
      if (!response.ok) {
        const upstream = await response.json().catch(() => ({}));
        console.error("[palm-reading] Gemini provider status:", response.status, "code:", upstream?.error?.status || "unknown", "model:", model);
        return NextResponse.json({ error: errorMessage(response.status, "Gemini") }, { status: response.status === 429 ? 429 : response.status === 401 || response.status === 403 ? 503 : 502 });
      }
    }

    const data = await response.json();
    const raw = useGroqVision
      ? data?.choices?.[0]?.message?.content
      : data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
    if (typeof raw !== "string" || !raw.trim()) {
      console.error("[palm-reading] Empty model response from", selectedProvider, "finish reason:", data?.candidates?.[0]?.finishReason || data?.choices?.[0]?.finish_reason || "unknown");
      return NextResponse.json({ error: "The vision model returned no readable analysis. Please try again with a sharper, well-lit palm photo." }, { status: 422 });
    }

    let result: { clear?: boolean; reason?: string; reading?: string };
    try {
      const cleaned = raw.trim().replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
      result = JSON.parse(cleaned);
    } catch {
      console.error("[palm-reading] Could not parse model JSON response from", selectedProvider);
      return NextResponse.json({ error: "The image result was inconclusive. Please upload a clearer palm photo and try again." }, { status: 422 });
    }
    if (result.clear !== true) {
      return NextResponse.json({ clear: false, reason: String(result.reason || "The main palm lines are not clear enough to interpret.") });
    }
    if (typeof result.reading !== "string" || !result.reading.trim()) {
      return NextResponse.json({ clear: false, reason: "The main palm lines are not clear enough to interpret. Please upload a sharper photo." });
    }
    return NextResponse.json({ clear: true, reading: result.reading.trim() });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid request. Upload a supported image under 4 MB." }, { status: 400 });
    if (error instanceof Error && error.name === "TimeoutError") return NextResponse.json({ error: "Image analysis timed out. Please try again with a smaller photo." }, { status: 504 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "The request could not be read. Please choose the palm image again." }, { status: 400 });
    console.error("[palm-reading] request failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not analyse this image right now. Please try again." }, { status: 500 });
  }
}
