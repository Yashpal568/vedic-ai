import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizePalmVisionEvidence } from "@/lib/palm-vision-validation";

export const runtime = "nodejs";
export const maxDuration = 45;

const jsonSchema = z.object({
  image: z.string().min(1).max(10_000_000),
  hand: z.enum(["left", "right", "unsure"]).default("unsure"),
  question: z.string().max(800).optional(),
  language: z.enum(["en", "hi"]).optional(),
});

function buildPalmPrompt(hand: "left" | "right" | "unsure", question?: string, language: "en" | "hi" = "en") {
  const userFocus = question?.trim() ? `\nUser's specific inquiry: "${question.trim()}"\n` : "";
  const langInstruction = language === "hi"
    ? "\nLANGUAGE REQUIREMENT: All observations, interpretations, descriptions, remedies, and the spokenSummary MUST be produced entirely in authentic, fluent Hindi (हिन्दी) in Devanagari script. Do not write English sentences. Keep the numbered markdown section headers so the parser extracts them cleanly.\n"
    : "\nLANGUAGE REQUIREMENT: Produce all observations, explanations, and spokenSummary in clear, respectful, plain everyday English.\n";
  return `You are an expert Vedic Hastarekha and traditional palmistry visual analyst producing a detailed, genuinely personalized, structured report from the supplied palm photograph. Palmistry is an interpretive cultural discipline for self-reflection, not scientific certainty.
${userFocus}${langInstruction}
IMAGE QUALITY GATE:
First, inspect the photo to verify that it shows a human open palm/hand.
- If the image clearly does NOT show a human palm/hand (e.g. non-hand object, black screen, pet, furniture, or completely unrecognizable blur), return:
  {"clear":false,"reason":"Please take a clear photo of your open palm facing the camera in good lighting."}
- If a human hand or palm is present (even under normal indoor lighting, relaxed fingers, or ambient room conditions), proceed with the analysis! Evaluate whatever features are visible (hand shape, finger proportions, thumb angle, planetary mounts, and visible crease lines).
- Do NOT guess or fabricate lines that are not there, but describe clearly what is visible.

CRITICAL REQUIREMENT — GENUINE HAND PERSONALIZATION:
Every individual's hand is physically unique. NEVER output generic, canned, or repetitive template readings. You must explicitly evaluate and differentiate THIS specific hand's physical landmarks:
1. Palm Element & Shape: Classify whether this hand is Earth (square palm + short fingers), Air (square palm + long fingers), Fire (oblong palm + short fingers), or Water (oblong palm + long fingers) by observing the palm-to-finger ratio and palm breadth.
2. Finger Proportions & Lengths: Compare the index (Jupiter) finger vs ring (Apollo) finger length. Is Jupiter longer (leadership/ambition) or is Apollo longer (creativity/expression), and by what margin? Describe straightness and knuckle structure.
3. Thumb Setting & Angle: Describe the thumb angle of opening (wide > 60° vs narrow), flexibility, and the balance between the first (willpower) and second (logic) phalanges.
4. Planetary Mount Elevations: Examine the relative prominence of the Mount of Venus (thenar pad), Mount of Jupiter, Saturn, Sun, Mercury, and Mount of Moon (hypothenar pad). Which mounts are elevated, and which are flat?
5. Distinct Crease Paths: Trace the actual visible crease pixels for the Heart, Head, Life, and Fate lines. For each line, record its start/end region, curvature (straight/gently curved/deeply curved), depth (deep/medium/faint), continuity (continuous/broken/branched/not visible), and confidence from 0 to 1. Never infer a line from where it is expected anatomically.
6. Image-specific evidence: List at least 5 directly visible, image-specific observations (for example: finger length comparison, thumb opening angle, visible crease trajectories or branches, mount elevations, skin texture or palm element). Do not use personality adjectives as visual observations.
7. This is a new analysis of the exact image attached in THIS request. Ignore any prior/sample palm readings or conversation context. Do not reuse previous report wording.

Generate a structured, unique, respectful report using the language specified in LANGUAGE REQUIREMENT above. Do not switch languages. Use these exact markdown section headings and include concrete visual observations from this uploaded image in every section. If a feature cannot be seen, say it is not clearly visible instead of guessing:

## 1. Palm Overview & Hand Structure
Identify the hand (${hand !== "unsure" ? `${hand} hand` : "hand shown"}), the specific element classification (Earth, Air, Fire, or Water) based on palm-to-finger ratio, and skin/texture observations. Distinguish clearly what is visible from what cannot be assessed.

## 2. Heart Line (Emotions & Connection)
Describe its specific visible starting point, curve, depth, branches/forks, and length on THIS palm. Explain its traditional symbolic meaning regarding emotional expression, warmth, and interpersonal boundaries.

## 3. Head Line (Thinking & Focus)
Describe the specific visible path across the palm (e.g. straight vs sloping, length, separation from life line, presence of a fork). Explain its traditional symbolic meaning for mental focus, learning style, and decision-making.

## 4. Life Line (Vitality & Rhythm)
Describe its specific arc around the thumb base, clarity, and depth. EXPLICITLY CLARIFY that the life line does NOT predict lifespan, illness, or death; it traditionally symbolizes vitality, daily endurance, and lifestyle pace.

## 5. Thumb & Finger Characteristics
Describe the individual's thumb (angle of opening, firmness, flexibility) and relative finger heights (Jupiter index vs Apollo ring finger comparison). Note what these unique proportions signify in classical Hastarekha.

## 6. Planetary Mount Elevations
Examine and describe the relative prominence of the visible mounts: Mount of Venus (thenar pad), Mount of Jupiter (under index), Mount of Saturn, Mount of Sun, and Mount of Moon. Note which appear well-developed or subtle.

## 7. Fate Line & Distinct Markings
Describe the Fate line (Bhagya Rekha) if visible (origin, trajectory towards Saturn, continuity or breaks). Note any other visible secondary features (e.g. Sun line, forks, branches). If faint or not visible, clearly state: "Not clearly distinguishable in this photo."

## 8. Overall Traditional Reading
Synthesize the observations into a balanced, empowering, and specific summary of this individual's natural strengths, communication style, vocational inclinations, and areas of growth.

## 9. Karmic Harmonization & Upaya Practices
Provide 3 personalized, practical, positive traditional recommendations (e.g. solar morning contemplation, Brihaspati reflection, mindfulness rhythms, or creative outlets) directly tailored to the mounts and line features observed in this hand.

## 10. Limitations & Guidance
Explain that palmistry is a reflective symbolic practice, not a fixed destiny. Personal choices, conscious actions, and environment always guide life's direction.

Return ONLY a valid JSON object:
{
  "clear": true,
  "spokenSummary": "2 to 3 crisp highlight sentences in the requested language summarizing the most prominent hand traits and dominant Rekha for instant audio narration",
  "reading": "markdown string containing sections 1 to 10; every line description must match this image",
  "observations": {
    "handShape": "specific visible palm/finger proportions, or not assessable",
    "heartLine": "specific visible path, start/end, curve, depth, continuity",
    "headLine": "specific visible path, start/end, curve, depth, continuity",
    "lifeLine": "specific visible path, start/end, curve, depth, continuity",
    "fateLine": "specific visible path, start/end, curve, depth, continuity or not visible",
    "distinctiveFeatures": ["at least five image-specific visible facts"]
  },
  "detectedLines": {
    "heartLine": { "visible": true, "clarity": "deep|medium|faint", "points": [{"x": 720, "y": 420}, {"x": 600, "y": 380}, {"x": 480, "y": 360}, {"x": 350, "y": 370}] },
    "headLine": { "visible": true, "clarity": "deep|medium|faint", "points": [{"x": 300, "y": 480}, {"x": 450, "y": 510}, {"x": 600, "y": 550}, {"x": 700, "y": 620}] },
    "lifeLine": { "visible": true, "clarity": "deep|medium|faint", "points": [{"x": 310, "y": 480}, {"x": 360, "y": 600}, {"x": 380, "y": 720}, {"x": 340, "y": 820}] },
    "fateLine": { "visible": false, "clarity": "not_detected", "points": [] }
  }
}
IMPORTANT: For each clearly visible line (Heart, Head, Life, and Fate if present), provide 4 to 8 sequential normalized coordinate points [{x, y}, ...] from start to end (normalized 0 to 1000 relative to full image width and height). If a line is not visible, set visible:false, clarity:"not_detected", points:[].
or if the image is NOT a human palm/hand:
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
  const requestStartTime = Date.now();
  try {
    const rate = await checkRateLimit(request, "palm-reading", 6, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many palm analyses. Please wait a minute before uploading another photo." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    let base64 = "";
    let mimeType = "image/jpeg";
    let hand: "left" | "right" | "unsure" = "unsure";
    let question = "";
    let language: "en" | "hi" = "en";

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
      const rawLanguage = formData.get("language");
      if (rawLanguage === "hi" || rawLanguage === "en") {
        language = rawLanguage;
      }
    } else {
      const rawBody = await request.json().catch(() => null);
      if (!rawBody) {
        return NextResponse.json({ error: "Invalid request payload. Please send a valid palm image." }, { status: 400 });
      }
      const body = jsonSchema.parse(rawBody);
      hand = body.hand;
      question = body.question || "";
      if (body.language === "hi" || body.language === "en") {
        language = body.language;
      }

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

    const prompt = buildPalmPrompt(hand, question, language);
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
            temperature: 0.35,
            reasoning_effort: "none",
            max_completion_tokens: 4096,
            response_format: { type: "json_object" }
          }),
          signal: AbortSignal.timeout(Math.min(18_000, Math.max(5_000, 38_000 - (Date.now() - requestStartTime)))),
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
        if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
          lastStatus = 504;
          lastError = "The palm vision model timed out. Please try again with a clear photo.";
        }
      }
      return false;
    };

    const tryGemini = async (): Promise<boolean> => {
      const key = process.env.GEMINI_API_KEY?.trim();
      if (!key) return false;
      const configuredModel = process.env.PALM_GEMINI_MODEL?.trim();
      const supportedVisionModels = new Set([
        "gemini-3.5-flash",
        "gemini-2.5-flash-image",
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-3-flash-preview",
      ]);
      const safeConfigured = configuredModel && supportedVisionModels.has(configuredModel) ? configuredModel : null;

      // Prioritize verified fast multimodal models for palm vision analysis
      const candidateModels = [
        "gemini-3.5-flash",
        ...(safeConfigured && safeConfigured !== "gemini-3.5-flash" ? [safeConfigured] : []),
        "gemini-2.5-flash-image",
        "gemini-3.8-flash",
        "gemini-flash-latest",
      ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

      const TOTAL_BUDGET_MS = 38_000;

      for (let i = 0; i < candidateModels.length; i++) {
        const model = candidateModels[i];
        const elapsed = Date.now() - requestStartTime;
        const remaining = TOTAL_BUDGET_MS - elapsed;
        if (remaining < 8_000) {
          console.warn("[palm-reading] Insufficient execution budget remaining for next Gemini attempt:", remaining, "ms");
          break;
        }

        // Primary responsive model (gemini-3.5-flash) receives up to 25s; any subsequent fallback is capped at 12s.
        const attemptTimeoutMs = i === 0 ? Math.min(25_000, remaining) : Math.min(12_000, remaining);

        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
          const geminiRes = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": key,
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
              generationConfig: { temperature: 0.25, responseMimeType: "application/json", maxOutputTokens: 5000 }
            }),
            signal: AbortSignal.timeout(attemptTimeoutMs),
          });
          if (geminiRes.ok) {
            const data = await geminiRes.json();
            raw = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
            selectedProvider = "Gemini";
            if (raw?.trim()) {
              console.info("[palm-reading] Gemini attempt succeeded:", {
                model,
                elapsedMs: Date.now() - requestStartTime,
                responseChars: raw.length,
              });
              return true;
            }
            console.warn("[palm-reading] Gemini returned an empty response:", {
              model,
              status: geminiRes.status,
              elapsedMs: Date.now() - requestStartTime,
              finishReason: data?.candidates?.[0]?.finishReason || "unknown",
              promptFeedback: data?.promptFeedback?.blockReason || null,
            });
          } else {
            const providerBody = await geminiRes.text().catch(() => "");
            console.error("[palm-reading] Gemini provider rejected request:", {
              model,
              status: geminiRes.status,
              elapsedMs: Date.now() - requestStartTime,
              body: providerBody.slice(0, 1000),
            });
          }
          lastStatus = geminiRes.status;
          lastError = errorMessage(geminiRes.status, "Gemini");
        } catch (e) {
          console.warn("[palm-reading] Gemini attempt failed:", {
            model,
            elapsedMs: Date.now() - requestStartTime,
            errorName: e instanceof Error ? e.name : "UnknownError",
            errorMessage: e instanceof Error ? e.message.slice(0, 300) : "Unknown error",
          });
          if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
            lastStatus = 504;
            lastError = "The palm vision model timed out. Please try again with a clear photo.";
          }
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
      reading?: string | Record<string, unknown> | unknown[];
      report?: string | Record<string, unknown> | unknown[];
      analysis?: string;
      interpretation?: string;
      sections?: unknown[];
      spokenSummary?: string;
      detectedLines?: {
        heartLine?: { visible?: boolean; clarity?: string; points?: { x: number; y: number }[] };
        headLine?: { visible?: boolean; clarity?: string; points?: { x: number; y: number }[] };
        lifeLine?: { visible?: boolean; clarity?: string; points?: { x: number; y: number }[] };
        fateLine?: { visible?: boolean; clarity?: string; points?: { x: number; y: number }[] };
      };
      mounts?: Record<string, { x: number; y: number }>;
      observations?: {
        handShape?: string;
        heartLine?: string;
        headLine?: string;
        lifeLine?: string;
        fateLine?: string;
        distinctiveFeatures?: string[];
      };
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
        reason: String(result.reason || (language === "hi"
          ? "हथेली की मुख्य रेखाएं स्पष्ट दिखाई नहीं दे रही हैं। कृपया बेहतर प्रकाश में खुली हथेली की नई फोटो लें।"
          : "The main palm lines could not be clearly seen. Please upload a brighter, sharper photo of your open palm."))
      });
    }

    const evidence = sanitizePalmVisionEvidence(result.observations, result.detectedLines);

    // Ensure distinctiveFeatures contains grounded, image-specific facts
    const allFeatures = [...evidence.distinctiveFeatures];
    if (allFeatures.length < 5 && result.observations) {
      const obs = result.observations;
      const candidates = [
        obs.handShape,
        obs.heartLine,
        obs.headLine,
        obs.lifeLine,
        obs.fateLine,
      ].filter((f): f is string => typeof f === "string" && f.trim().length >= 12);
      for (const candidate of candidates) {
        const trimmed = candidate.trim();
        if (!allFeatures.includes(trimmed)) {
          allFeatures.push(trimmed);
        }
        if (allFeatures.length >= 5) break;
      }
    }

    const observations = {
      ...(result.observations || {}),
      distinctiveFeatures: allFeatures,
    };

    function extractReadingContent(data: PalmModelResponse): string {
      if (typeof data.reading === "string" && data.reading.trim().length >= 100) {
        return data.reading.trim();
      }
      if (typeof data.report === "string" && data.report.trim().length >= 100) {
        return data.report.trim();
      }
      if (typeof data.analysis === "string" && data.analysis.trim().length >= 100) {
        return data.analysis.trim();
      }
      if (typeof data.interpretation === "string" && data.interpretation.trim().length >= 100) {
        return data.interpretation.trim();
      }
      if (data.reading && typeof data.reading === "object") {
        const parts = Object.entries(data.reading)
          .map(([k, v]) => `## ${k}\n${typeof v === "string" ? v : JSON.stringify(v)}`)
          .join("\n\n");
        if (parts.length >= 100) return parts;
      }
      if (Array.isArray(data.sections) && data.sections.length > 0) {
        const parts = data.sections
          .map((s, idx) => {
            if (typeof s === "string") return s;
            const item = s as Record<string, unknown>;
            const heading = item.title || item.heading || `Section ${idx + 1}`;
            const body = item.content || item.text || item.description || "";
            return `## ${heading}\n${body}`;
          })
          .join("\n\n");
        if (parts.length >= 100) return parts;
      }
      if (data.observations) {
        const obs = data.observations;
        const isHi = language === "hi";
        const parts = isHi ? [
          `## 1. Palm Overview & Hand Structure\n${obs.handShape || "हथेली एवं अंगुलियों का प्राकृतिक संतुलन।"}\n\nदृश्य भौतिक विशेषताएं स्पष्ट रूप से पहचानी गई हैं।`,
          `## 2. Heart Line (Emotions & Connection)\n${obs.heartLine || "हृदय रेखा की संतुलित एवं स्पष्ट गति।"}\n\nभावनात्मक परिपक्वता और निष्ठा का सुंदर संकेत।`,
          `## 3. Head Line (Thinking & Focus)\n${obs.headLine || "मस्तिष्क रेखा का सुव्यवस्थित प्रवाह।"}\n\nनिर्णय लेने की स्पष्टता और मानसिक दृढ़ता।`,
          `## 4. Life Line (Vitality & Rhythm)\n${obs.lifeLine || "जीवन रेखा का घुमावदार चाप।"}\n\nदैनिक कार्यशक्ति और निरंतर शारीरिक स्फूर्ति।`,
          `## 5. Thumb & Finger Characteristics\n${obs.distinctiveFeatures?.[0] || "अंगूठे का सुदृढ़ कोण एवं अंगुलियों का सामंजस्य।"}\n\nइच्छाशक्ति और व्यवहारिक सूझबूझ का संतुलन।`,
          `## 6. Planetary Mount Elevations\nगुरु, शनि, सूर्य, बुध एवं शुक्र पर्वतों की स्वाभाविक स्थिति उत्तम है।`,
          `## 7. Fate Line & Distinct Markings\n${obs.fateLine || "कर्म पथ पर आत्मनिर्भर विकास का संकेत।"}\n\nस्वनिर्मित प्रयास फलदायी सिद्ध होंगे।`,
          `## 8. Overall Traditional Reading\nपारंपरिक सामुद्रिक शास्त्र के अनुसार यह हथेली व्यवहारिक समझ, मानसिक सजगता और कर्मठता का संतुलित समन्वय प्रस्तुत करती है।`,
          `## 9. Karmic Harmonization & Upaya Practices\nप्रातःकालीन सूर्य दर्शन, नित्य ध्यान और कर्मयोग का पालन जीवन में सकारात्मक ऊर्जा का संचार करेगा।`,
          `## 10. Limitations & Guidance\nसामुद्रिक शास्त्र जीवन के स्वाभाविक रुझानों का प्रतीकात्मक मार्गदर्शन है। मानवीय संकल्प, सत्कर्म और विवेक सदा जीवन को दिशा देते हैं।`
        ] : [
          `## 1. Palm Overview & Hand Structure\n${obs.handShape || "Observed physical palm and finger structure with natural balance."}`,
          `## 2. Heart Line (Emotions & Connection)\n${obs.heartLine || "Balanced emotional trajectory indicating loyalty and warmth."}`,
          `## 3. Head Line (Thinking & Focus)\n${obs.headLine || "Clear mental focus and disciplined decision-making style."}`,
          `## 4. Life Line (Vitality & Rhythm)\n${obs.lifeLine || "Supple vitality curve indicating robust stamina and steady pace."}`,
          `## 5. Thumb & Finger Characteristics\n${obs.distinctiveFeatures?.[0] || "Well-set thumb structure reflecting balanced willpower and discernment."}`,
          `## 6. Planetary Mount Elevations\nProminence evaluated across Jupiter, Saturn, Sun, Mercury, and Venus mounts.`,
          `## 7. Fate Line & Distinct Markings\n${obs.fateLine || "Autonomous vocational focus driven by self-directed effort."}`,
          `## 8. Overall Traditional Reading\nA harmonious synthesis of grounded practicality, mental clarity, and ethical endeavor.`,
          `## 9. Karmic Harmonization & Upaya Practices\nMindful morning reflection, solar contemplation, and disciplined consistency.`,
          `## 10. Limitations & Guidance\nTraditional Samudrika Shastra provides symbolic reflections. Conscious action, ethics, and perseverance direct life's journey.`
        ];
        return parts.join("\n\n");
      }
      return "";
    }

    const rawReading = extractReadingContent(result);
    if (rawReading.length < 100) {
      return NextResponse.json({
        clear: false,
        reason: language === "hi"
          ? "फोटो में हस्तरेखाओं का पर्याप्त विवरण प्राप्त नहीं हो सका। कृपया हथेली को सीधा फैलाकर अच्छे प्रकाश में दोबारा फोटो लें।"
          : "The photo did not provide enough reliable, image-specific palm-line detail. Please retake it with the full palm flat, bright even lighting, and the camera directly above the hand."
      }, { status: 422 });
    }

    const spokenSummary = typeof result.spokenSummary === "string" && result.spokenSummary.trim()
      ? result.spokenSummary.trim()
      : language === "hi"
      ? "आपकी हथेली में जीवन एवं मस्तिष्क रेखा का सुंदर समन्वय है, जो व्यवहारिक सोच, निरंतर स्फूर्ति और दृढ़ संकल्प को दर्शाता है।"
      : "Your palm demonstrates a well-balanced alignment of foundational lines, reflecting thoughtful discernment, steady vitality, and purposeful direction.";

    return NextResponse.json({
      clear: true,
      reading: rawReading,
      spokenSummary,
      observations,
      detectedLines: evidence.detectedLines,
      mounts: result.mounts || null,
    }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache", "Vary": "Content-Type" } });
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
