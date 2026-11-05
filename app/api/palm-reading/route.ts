import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 45;

const jsonSchema = z.object({
  image: z.string().min(1).max(10_000_000),
  hand: z.enum(["left", "right", "unsure"]).default("unsure"),
  question: z.string().max(800).optional(),
});

function buildPalmPrompt(hand: "left" | "right" | "unsure", question?: string) {
  const userFocus = question?.trim() ? `\nUser's specific inquiry: "${question.trim()}"\n` : "";
  return `You are a careful visual assistant producing a structured, beginner-friendly traditional palmistry report from the supplied palm photograph. Palmistry is a cultural interpretive practice, not a scientifically validated way to predict a person's life or future.
${userFocus}
IMAGE QUALITY GATE:
First, inspect the photo to verify that it clearly shows a human open palm, with fingers and major creases in sufficient lighting and focus.
- If the image is NOT clearly an open palm, is severely blurry, too dark, washed out, or missing key line areas, return:
  {"clear":false,"reason":"..."}
  where reason provides a practical, polite instruction (e.g. "The photo is too blurry or dark to see your palm lines clearly. Please hold your hand steady in bright, even light with your palm facing the camera.").
- Do NOT guess or fabricate lines from blur, shadows, jewellery, tattoos, or digital artifacts.

IF CLEAR, generate a structured, respectful report in plain, everyday English using these exact markdown sections:

## 1. Palm Overview & Photo Observations
State the observed hand (${hand !== "unsure" ? `${hand} hand` : "hand shown"}), overall palm shape, and visible clarity level. Distinguish clearly what is visible from what cannot be assessed.

## 2. Heart Line (Emotions & Connection)
Describe its visible starting point, curve, depth, and length. Provide the traditional symbolic interpretation (how you express care, sensitivity, and connection) in simple, accessible language.

## 3. Head Line (Thinking & Focus)
Describe the visible path across the palm (e.g. straight vs gently sloped). Provide the traditional symbolic meaning (decision-making style, curiosity, and mental focus).

## 4. Life Line (Energy & Vitality)
Describe its arc around the thumb base. EXPLICITLY CLARIFY that the life line does NOT predict lifespan, health diagnoses, or death; it traditionally symbolizes vitality, routine, and lifestyle rhythm.

## 5. Fate Line & Other Visible Features
If the fate line or other features (e.g. Sun line, Mount of Venus, Mount of Jupiter) are visible, describe them simply. If not clearly visible, explicitly state: "Not clearly distinguishable in this photo."

## 6. Overall Traditional Reading
Synthesize the observations into a balanced, empowering overview of your natural style and tendencies. Do not make dramatic promises or alarming claims.

## 7. Limitations & Guidance
Explain that palmistry is a reflective, symbolic art rather than a fixed destiny. Remind the reader that real-life actions, choices, and environment always take precedence.

Return ONLY a valid JSON object:
{
  "clear": true,
  "reading": "...",
  "detectedLines": {
    "heartLine": { "visible": true, "clarity": "clear" },
    "headLine": { "visible": true, "clarity": "clear" },
    "lifeLine": { "visible": true, "clarity": "clear" },
    "fateLine": { "visible": true, "clarity": "clear" }
  }
}
Note for detectedLines: If the Fate line or any line is faint, broken, or not clearly identifiable in this photo, set "visible": false and "clarity": "not_detected" honestly. Do NOT fabricate missing lines.
or if the image is NOT a clear palm:
{"clear":false,"reason":"..."}
Do not enclose the JSON in markdown code blocks or add text outside the JSON object.`;
}

function errorMessage(status: number, provider: "Groq" | "Gemini") {
  if (status === 429) return "The palm-reading service is busy or at its usage limit. Please wait a moment and try again.";
  if (status === 401 || status === 403) return `${provider} rejected the server API key. Please check your API key in environment variables.`;
  if (status === 404) return "The configured vision model is unavailable. Update the palm vision model configuration and redeploy.";
  return "The palm-reading service could not analyse this image. Please try again with a clear, well-lit photo.";
}

export async function POST(request: Request) {
  try {
    let base64 = "";
    let mimeType = "image/jpeg";
    let hand: "left" | "right" | "unsure" = "unsure";
    let question = "";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") || formData.get("image");
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: "Please select a palm photo to upload." }, { status: 400 });
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Image is larger than 10 MB. Please upload a smaller photo." }, { status: 413 });
      }
      const rawType = file.type || "image/jpeg";
      if (!rawType.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test((file as File).name || "")) {
        return NextResponse.json({ error: "Upload a JPG, PNG, WebP, or HEIC palm photo." }, { status: 400 });
      }
      mimeType = rawType.startsWith("image/") ? rawType : "image/jpeg";
      const arrayBuffer = await file.arrayBuffer();
      base64 = Buffer.from(arrayBuffer).toString("base64");

      const rawHand = formData.get("hand");
      if (rawHand === "left" || rawHand === "right" || rawHand === "unsure") {
        hand = rawHand;
      }
      const rawQuestion = formData.get("question");
      if (typeof rawQuestion === "string") {
        question = rawQuestion.slice(0, 800);
      }
    } else {
      const rawBody = await request.json().catch(() => null);
      if (!rawBody) {
        return NextResponse.json({ error: "Invalid request payload. Please send a valid palm image." }, { status: 400 });
      }
      const body = jsonSchema.parse(rawBody);
      hand = body.hand;
      question = body.question || "";

      const match = body.image.match(/^data:(image\/(?:jpeg|png|webp|jpg));base64,([A-Za-z0-9+/=]+)$/i);
      if (!match) {
        return NextResponse.json({ error: "Upload a valid JPG, PNG, or WebP palm photo." }, { status: 400 });
      }
      mimeType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
      base64 = match[2];
    }

    if (!base64 || base64.length < 50) {
      return NextResponse.json({ error: "No readable image data received. Please select a photo again." }, { status: 400 });
    }

    const imageBytes = Buffer.from(base64, "base64");
    if (!imageBytes.length || imageBytes.length > 6 * 1024 * 1024) {
      return NextResponse.json({ error: "The image data is invalid or exceeds 6 MB. Please choose a smaller photo." }, { status: 413 });
    }

    const prompt = buildPalmPrompt(hand, question);
    const provider = (process.env.AI_PROVIDER || "").toLowerCase();
    const useGroqVision = provider === "groq" || (!process.env.GEMINI_API_KEY && Boolean(process.env.GROQ_API_KEY));

    let selectedProvider: "Groq" | "Gemini" = useGroqVision ? "Groq" : "Gemini";
    let raw: string | undefined;
    let lastError = "The palm-reading service could not analyse this image. Please try again with a clear, well-lit photo.";
    let lastStatus = 502;

    const tryGroq = async (): Promise<boolean> => {
      const key = process.env.GROQ_API_KEY;
      if (!key) return false;
      const configuredModel = process.env.PALM_GROQ_MODEL?.trim();
      // Groq's current documented multimodal model for image input + JSON mode.
      // Retired model IDs are ignored so a stale Vercel env value cannot break scans.
      const invalidOrRetiredModels = [
        "qwen/qwen3.6-27b",
        "qwen/qwen3.6-27b-preview",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "meta-llama/llama-4-maverick-17b-128e-instruct",
        "llama-3.2-11b-vision-preview",
        "llama-3.2-90b-vision-preview",
      ];
      const model = !configuredModel || invalidOrRetiredModels.includes(configuredModel)
        ? "qwen/qwen3.8-27b"
        : configuredModel;

      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
          body: JSON.stringify({
            model,
            messages: [{
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
              ]
            }],
            // Qwen 3.8 instruct mode is the low-latency setting for this image task.
            temperature: 0.7,
            reasoning_effort: "none",
            max_completion_tokens: 2200,
            response_format: { type: "json_object" }
          }),
          signal: AbortSignal.timeout(40_000),
        });
        if (res.ok) {
          const data = await res.json();
          raw = data?.choices?.[0]?.message?.content;
          selectedProvider = "Groq";
          return Boolean(raw?.trim());
        }
        lastStatus = res.status;
        const providerBody = await res.text().catch(() => "");
        console.error("[palm-reading] Groq vision provider status:", res.status, "model:", model, "body:", providerBody.slice(0, 1200));
        lastError = errorMessage(res.status, "Groq");
      } catch (e) {
        console.warn("[palm-reading] Groq attempt failed:", e);
      }
      return false;
    };

    const tryGemini = async (): Promise<boolean> => {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return false;
      const candidateModels = [
        process.env.PALM_GEMINI_MODEL?.trim() || "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
      ].filter(Boolean);

      for (const model of candidateModels) {
        try {
          const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
              generationConfig: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: 2200 }
            }),
            signal: AbortSignal.timeout(35_000),
          });
          if (geminiRes.ok) {
            const data = await geminiRes.json();
            raw = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
            selectedProvider = "Gemini";
            return Boolean(raw?.trim());
          }
          lastStatus = geminiRes.status;
          lastError = errorMessage(geminiRes.status, "Gemini");
        } catch (e) {
          console.warn("[palm-reading] Gemini attempt failed for model:", model, e);
        }
      }
      return false;
    };

    if (useGroqVision) {
      const ok = await tryGroq();
      if (!ok && process.env.GEMINI_API_KEY) {
        await tryGemini();
      }
    } else {
      const ok = await tryGemini();
      if (!ok && process.env.GROQ_API_KEY) {
        await tryGroq();
      }
    }

    if (!raw || !raw.trim()) {
      if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "Palm reading requires GEMINI_API_KEY or GROQ_API_KEY configured on the server." }, { status: 503 });
      }
      return NextResponse.json({ error: lastError }, { status: lastStatus === 429 ? 429 : lastStatus === 401 || lastStatus === 403 ? 503 : 502 });
    }

    if (typeof raw !== "string" || !raw.trim()) {
      console.error("[palm-reading] Empty model response from", selectedProvider);
      return NextResponse.json({ error: "The vision model returned no readable analysis. Please try again with a sharper, well-lit palm photo." }, { status: 422 });
    }

    interface PalmModelResponse {
      clear?: boolean;
      reason?: string;
      reading?: string;
      detectedLines?: {
        heartLine?: { visible?: boolean; clarity?: string };
        headLine?: { visible?: boolean; clarity?: string };
        lifeLine?: { visible?: boolean; clarity?: string };
        fateLine?: { visible?: boolean; clarity?: string };
      };
      mounts?: Record<string, { x: number; y: number }>;
    }

    let result: PalmModelResponse;
    try {
      const cleaned = raw.trim().replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
      result = JSON.parse(cleaned) as PalmModelResponse;
    } catch {
      console.error("[palm-reading] Could not parse model JSON response from", selectedProvider, raw.slice(0, 200));
      return NextResponse.json({ error: "The image analysis was inconclusive. Please upload a clearer palm photo and try again." }, { status: 422 });
    }

    if (result.clear !== true) {
      return NextResponse.json({
        clear: false,
        reason: String(result.reason || "The main palm lines could not be clearly seen. Please upload a brighter, sharper photo of your open palm.")
      });
    }

    if (typeof result.reading !== "string" || !result.reading.trim()) {
      return NextResponse.json({
        clear: false,
        reason: "The main palm lines are not clear enough to interpret. Please take a sharper photo in bright light."
      });
    }

    return NextResponse.json({
      clear: true,
      reading: result.reading.trim(),
      detectedLines: result.detectedLines || null,
      mounts: result.mounts || null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request payload. Please upload a supported image under 6 MB." }, { status: 400 });
    }
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return NextResponse.json({ error: "Image analysis timed out. Please try again with a clear photo." }, { status: 504 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "The request could not be read. Please choose the palm image again." }, { status: 400 });
    }
    console.error("[palm-reading] request failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not analyse this image right now. Please try again." }, { status: 500 });
  }
}
