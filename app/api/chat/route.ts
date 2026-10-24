import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(12000),
  })).min(1).max(30),
  birthProfile: z.object({
    name: z.string().max(100).optional(),
    date: z.string().max(20),
    time: z.string().max(10),
    place: z.string().max(300),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    timezone: z.string().max(100).optional(),
  }).optional(),
  chartContext: z.record(z.string(), z.unknown()).optional(),
});

const systemInstruction = [
  "You are Vedic AI, a thoughtful guide to traditional Vedic astrology (Jyotish).",
  "Be warm, clear, respectful, and precise. Match the user's language, including Hindi when they write in Hindi.",
  "Important: no verified chart calculation engine is connected in this MVP. Never invent a user's ascendant, planetary longitude, house placement, nakshatra, yoga, dasha period, or exact timing.",
  "If birth details are supplied but no calculated chart JSON is supplied, explain that birth details alone are not enough to state exact placements; the calculation service must first resolve coordinates/timezone and calculate the chart.",
  "You may explain general Jyotish concepts and how practitioners traditionally interpret them. Distinguish traditional belief from scientifically established fact and avoid presenting predictions as guarantees.",
  "Do not present astrology as medical, legal, financial, or mental-health advice. Encourage qualified professional support for high-stakes decisions.",
  "Do not claim you calculated a kundli unless structured chart data is explicitly included in the context.",
].join("\n");

async function callGemini(messages: Array<{ role: "user" | "assistant"; content: string }>, birthProfile?: z.infer<typeof requestSchema>["birthProfile"], chartContext?: Record<string, unknown>) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("AI_NOT_CONFIGURED");
  const model = process.env.AI_MODEL || "gemini-2.5-flash";
  const context = birthProfile
    ? "\n\nUser-provided birth details (not yet calculated): " + JSON.stringify(birthProfile)
    : "";
  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction + context }] },
      contents,
      generationConfig: { temperature: 0.45, maxOutputTokens: 1200 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error("AI_RATE_LIMITED");
    throw new Error("AI_PROVIDER_ERROR");
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
  if (!text) throw new Error("AI_EMPTY_RESPONSE");
  return text as string;
}

async function callOpenAI(messages: Array<{ role: "user" | "assistant"; content: string }>, birthProfile?: z.infer<typeof requestSchema>["birthProfile"], chartContext?: Record<string, unknown>) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("AI_NOT_CONFIGURED");
  const model = process.env.AI_MODEL || "gpt-4.1-mini";
  const context = birthProfile
    ? "\n\nUser-provided birth details (not yet calculated): " + JSON.stringify(birthProfile)
    : "";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemInstruction + context },
        ...messages,
      ],
      temperature: 0.45,
      max_tokens: 1200,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error("AI_RATE_LIMITED");
    throw new Error("AI_PROVIDER_ERROR");
  }
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (typeof text !== "string" || !text) throw new Error("AI_EMPTY_RESPONSE");
  return text as string;
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
    const reply = provider === "openai"
      ? await callOpenAI(body.messages, body.birthProfile, body.chartContext)
      : provider === "gemini"
        ? await callGemini(body.messages, body.birthProfile, body.chartContext)
        : null;

    if (!reply) {
      return NextResponse.json({ error: "Unsupported AI provider. Set AI_PROVIDER to gemini or openai." }, { status: 500 });
    }
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request. Please check your message and try again." }, { status: 400 });
    }
    const code = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (code === "AI_NOT_CONFIGURED") {
      return NextResponse.json({ error: "AI is not configured yet. Add GEMINI_API_KEY or OPENAI_API_KEY to your server environment variables." }, { status: 503 });
    }
    if (code === "AI_RATE_LIMITED") {
      return NextResponse.json({ error: "The AI provider is rate limiting requests. Please wait a moment and try again." }, { status: 429 });
    }
    if (code === "AI_EMPTY_RESPONSE") {
      return NextResponse.json({ error: "The AI provider returned an empty response. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ error: "The AI service could not complete this request. Please try again shortly." }, { status: 502 });
  }
}
