import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 45;

const schema = z.object({
  image: z.string().min(1).max(8_000_000),
  hand: z.enum(["left", "right", "unsure"]).default("unsure"),
  question: z.string().max(800).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const match = body.image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return NextResponse.json({ error: "Upload a JPG, PNG, or WebP palm photo." }, { status: 400 });
    const mimeType = match[1];
    const base64 = match[2];
    if (base64.length > 6_500_000) return NextResponse.json({ error: "Image is too large. Please upload a photo under 4 MB." }, { status: 413 });
    const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
    const useGroqVision = provider === "groq" || (!process.env.GEMINI_API_KEY && Boolean(process.env.GROQ_API_KEY));
    let response: Response;
    if (useGroqVision) {
      const key = process.env.GROQ_API_KEY;
      if (!key) return NextResponse.json({ error: "Palm reading needs GROQ_API_KEY or GEMINI_API_KEY configured on the server." }, { status: 503 });
      const model = process.env.PALM_GROQ_MODEL || "qwen/qwen3.8-27b";
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
          max_completion_tokens: 1200,
          response_format: { type: "json_object" }
        }),
        signal: AbortSignal.timeout(35_000),
      });
      if (!response.ok) {
        const upstream = await response.json().catch(() => ({}));
        console.error("[palm-reading] Groq vision provider status:", response.status, "code:", upstream?.error?.code || "unknown", "model:", model);
        return NextResponse.json({ error: response.status === 429 ? "Palm-reading AI has reached its usage limit. Please try later." : response.status === 401 || response.status === 403 ? "Groq rejected the API key. Check GROQ_API_KEY in Vercel Production." : "Palm-reading AI could not process this image. Check the configured vision model and try again." }, { status: response.status === 429 ? 429 : 502 });
      }
    } else {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return NextResponse.json({ error: "Palm reading needs GEMINI_API_KEY or GROQ_API_KEY configured on the server." }, { status: 503 });
      const model = process.env.PALM_GEMINI_MODEL || process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-3.8-flash";
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: 1200 }
        }),
        signal: AbortSignal.timeout(35_000),
      });
      if (!response.ok) {
        const upstream = await response.json().catch(() => ({}));
        console.error("[palm-reading] Gemini provider status:", response.status, "code:", upstream?.error?.status || "unknown", "model:", model);
        return NextResponse.json({ error: response.status === 429 ? "Palm-reading service is at its current usage limit. Please try later." : response.status === 401 || response.status === 403 ? "Gemini rejected API access. Check GEMINI_API_KEY and model access in Google AI Studio." : "Palm-reading service could not process this image right now." }, { status: response.status === 429 ? 429 : 502 });
      }
    }
    const data = await response.json();
    const raw = useGroqVision
      ? data?.choices?.[0]?.message?.content || ""
      : data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
    let result: { clear?: boolean; reason?: string; reading?: string };
    try {
      result = JSON.parse(raw.replace(/^\s*```json\s*/i, "").replace(/\s*```\s*$/, ""));
    } catch {
      return NextResponse.json({ error: "The image result was inconclusive. Please upload a clearer palm photo." }, { status: 422 });
    }
    if (result.clear !== true) return NextResponse.json({ clear: false, reason: String(result.reason || "The main palm lines are not clear enough to interpret.") });
    if (typeof result.reading !== "string" || !result.reading.trim()) return NextResponse.json({ clear: false, reason: "The main palm lines are not clear enough to interpret." });
    return NextResponse.json({ clear: true, reading: result.reading });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid request. Upload a supported image under 4 MB." }, { status: 400 });
    if (error instanceof Error && error.name === "TimeoutError") return NextResponse.json({ error: "Image analysis timed out. Please try again with a smaller photo." }, { status: 504 });
    console.error("[palm-reading] request failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not analyse this image right now. Please try again." }, { status: 500 });
  }
}
