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
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "Palm reading is not configured yet. The site owner must add GEMINI_API_KEY." }, { status: 503 });
    const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-3.8-flash";
    const prompt = [
      "You are a cautious assistant explaining traditional palmistry as a cultural/reflective practice, not a scientifically validated way to predict facts or the future.",
      "FIRST assess image quality. If the palm is not clearly visible, too small, blurry, overexposed, cropped, obscured, or the major lines cannot be distinguished, return ONLY JSON: {\"clear\":false,\"reason\":\"specific short reason\",\"reading\":\"\"}. Do not guess or attempt a reading.",
      "If clear enough, return ONLY valid JSON: {\"clear\":true,\"reason\":\"\",\"reading\":\"...\"}.",
      "For a clear image, describe only visible features and distinguish visual observations from traditional interpretations. Do not claim medical diagnosis, lifespan, death, exact marriage/job/wealth dates, identity, personality certainty, or guaranteed outcomes. Never invent lines hidden by the photo. If one line is uncertain, say so.",
      "Offer a balanced, non-fatalistic reading: heart line, head line, life line, fate line only when visible; palm shape/fingers only when adequately shown; say which features are not assessable. Explain that the life line is not a lifespan measure. Keep it clear and useful.",
      "Hand indicated by user: " + body.hand + ". User's question: " + (body.question || "Give a cautious overview of visible major palm lines.") + ".",
      "If the hand is reversed, unclear, or a line cannot confidently be distinguished, do not infer. The output must be JSON only."
    ].join("\n");
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
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
      console.error("[palm-reading] provider status:", response.status, "code:", upstream?.error?.status || "unknown");
      return NextResponse.json({ error: response.status === 429 ? "Palm-reading service is at its current usage limit. Please try later." : "Palm-reading service could not process this image right now." }, { status: response.status === 429 ? 429 : 502 });
    }
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
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
