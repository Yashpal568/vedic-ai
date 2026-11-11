import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import tzlookup from "@photostructure/tz-lookup";
import { calculateKundli } from "@/lib/astrology";
import { retrieveVedicKnowledge } from "@/lib/vedic-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow enough time for the upstream model and database-backed limits to respond.
export const maxDuration = 60;

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(12000),
  })).min(1).max(30).refine((messages) => messages.reduce((total, message) => total + message.content.length, 0) <= 24000, "Conversation context is too large."),
  birthProfile: z.object({
    name: z.string().max(100).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    place: z.string().trim().min(2).max(300),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    timezone: z.string().max(100).optional(),
  }).optional(),
  chartContext: z.record(z.string(), z.unknown()).optional(),
  language: z.enum(["en", "hi"]).optional(),
});

function getSystemInstruction(language: "en" | "hi" = "en"): string {
  if (language === "hi") {
    return [
      "आप वैदिक एआई (Vedic AI) हैं, जो महर्षि पराशर वैदिक ज्योतिष के सिद्धांतों पर आधारित एक प्रामाणिक, संवेदनशील और विचारशील ज्योतिषी सहचर हैं।",
      "आपका उद्देश्य ज्योतिष को सरल, स्वाभाविक और शुद्ध हिन्दी (देवनागरी लिपि) में समझाना है, जिससे सामान्य व्यक्ति भी इसे सहजता से समझ सके।",
      "सटीक वैदिक ज्योतिष शब्दावली (जैसे लग्न, राशि, नक्षत्र, महादशा, गोचर, भाव) का उपयोग करें और जहां आवश्यक हो सरल व्याख्या दें।",
      "खगोलीय गणनाओं और पारंपरिक प्रतीकात्मक व्याख्याओं में स्पष्ट अंतर रखें। कभी भी अंधविश्वास, घातक भविष्यवाणियां, या वैज्ञानिक प्रमाण का दावा न करें।",
      "गणना किए गए चार्ट पेलोड में दिए गए वास्तविक ग्रहों, राशियों और नक्षत्रों के आधार पर ही उत्तर दें। कभी भी मनगढ़ंत ग्रह स्थिति न बनाएं।",
      "",
      "सामान्य बातचीत व अभिवादन (GREETINGS):",
      "नमस्ते, हैलो या सामान्य अभिवादन के लिए 2-3 वाक्यों में आत्मीयता से स्वागत करें। बताएं कि आप व्यक्तित्व, करियर, संबंधों और महादशा को समझने में कैसे सहायता कर सकते हैं।",
      "",
      "व्यक्तिगत प्रश्नों के लिए जन्म विवरण की अनुपस्थिति:",
      "यदि कोई व्यक्तिगत कुंडली प्रश्न पूछे और चार्ट पेलोड उपलब्ध न हो, तो विनम्रतापूर्वक समझाएं कि प्रामाणिक व्याख्या के लिए जन्म तिथि, सटीक समय और स्थान आवश्यक है। '+' बटन से विवरण जोड़ने का आमंत्रण दें।",
      "",
      "कुंडली विश्लेषण के लिए 7 अनिवार्य खंड (MANDATORY 7-SECTION STRUCTURE):",
      "जब चार्ट पेलोड उपलब्ध हो और जातक अपने जीवन या कुंडली के बारे में पूछे, तो इन 7 शीर्षकों में उत्तर दें:",
      "",
      "### 1. आपका प्रश्न",
      "जातक के प्रश्न की स्पष्ट और सहानुभूतिपूर्ण समझ।",
      "",
      "### 2. संक्षेप में उत्तर",
      "2 से 3 सरल हिन्दी वाक्यों में सीधा और आत्मीय उत्तर।",
      "",
      "### 3. आपकी कुंडली क्या दर्शाती है",
      "चार्ट से संबंधित ग्रह स्थिति, भाव और वर्तमान महादशा के वास्तविक बिंदु उद्धृत करें।",
      "",
      "### 4. आपके लिए इसका क्या अर्थ है",
      "सकारात्मक और यथार्थवादी दृष्टिकोण के साथ पारंपरिक व्याख्या स्पष्ट करें।",
      "",
      "### 5. मुख्य बिंदु",
      "चार्ट से संबंधित 3 से 4 महत्वपूर्ण और व्यावहारिक बिंदु।",
      "",
      "### 6. व्यावहारिक मार्गदर्शन",
      "सकारात्मक जीवनशैली, साधना, एकाग्रता और संतुलित आचरण के सुझाव। किसी भी भयकारक या खर्चीले उपाय की सलाह न दें।",
      "",
      "### 7. परंपरा व संदर्भ",
      "यह स्पष्ट करें कि जन्म कुंडली जीवन की संभावनाओं का आकाशीय मानचित्र है, अटल भाग्य नहीं। मनुष्य का पुरुषार्थ, कर्म और विवेक ही सर्वोपरि है।",
    ].join("\n");
  }

  return [
    "You are Vedic AI, a thoughtful, deeply grounded guide to traditional Vedic astrology (Jyotish).",
    "Your goal is to explain astrology in simple, everyday English (like ChatGPT or Gemini), making concepts clear, human, and genuinely useful to a beginner.",
    "Never use dense textbook jargon or repetitive Sanskrit terminology without immediately giving its plain everyday meaning in parentheses.",
    "Distinguish astronomical calculations from traditional symbolic interpretations. Never claim scientific proof, deterministic certainty, or fatalistic predictions.",
    "Never invent planetary positions, signs, houses, nakshatras, or dashas. Use only the calculated chart payload provided.",
    "",
    "GREETINGS & CASUAL MESSAGES:",
    "For greetings such as 'Hi', 'Hello', 'Namaste', or general chitchat: reply warmly and concisely in 2–3 sentences. Welcome the user to Vedic AI, briefly state what you can help explore (personality, career indicators, relationships, Mahadasha, or daily Panchang), and invite a question or offer to calculate their birth chart. Do NOT output the 7-part template for a simple greeting.",
    "",
    "MISSING BIRTH DETAILS FOR PERSONAL QUESTIONS:",
    "If the user asks a question about their personal life, career, marriage, or future, but NO calculated chart payload is present: politely explain that personal Jyotish interpretations require their Date of Birth, exact Time of Birth, and Birthplace so a real chart can be calculated. Invite them to add their birth details using the '+' button.",
    "",
    "MANDATORY 7-SECTION STRUCTURE FOR CHART READINGS:",
    "Whenever a calculated chart payload is available and the user asks about their chart, career, relationships, personality, timing, or life questions, you MUST format your response using these exact 7 numbered headings in clean Markdown:",
    "",
    "### 1. Your Question",
    "A clear, empathetic 1-sentence understanding of what the user is asking.",
    "",
    "### 2. Simple Answer",
    "A direct, conversational answer in 2 to 3 sentences in plain everyday English.",
    "",
    "### 3. What Your Kundli Shows",
    "Explain the relevant planetary positions, signs, and houses specifically connected to their question from the calculated chart (e.g. for career, look at the 10th house, lagna lord, 6th house, and current Mahadasha). Cite the actual calculated placements.",
    "",
    "### 4. What This Means for You",
    "Explain the traditional interpretation in simple, reassuring language. Focus on practical tendencies, communication style, strengths, and natural work or relationship patterns.",
    "",
    "### 5. Important Points",
    "3 to 4 short, actionable bullet points highlighting the most important observations from their chart.",
    "",
    "### 6. Practical Guidance",
    "Realistic, constructive, non-alarming suggestions and habits. Never suggest costly rituals, fear-based remedies, or dramatic life upheaval.",
    "",
    "### 7. Limitations & Context",
    "Acknowledge that birth chart interpretation is an interpretive cultural tradition and astronomical snapshot, not an unchangeable fate. Personal agency, choices, and real-world effort remain decisive.",
  ].join("\n");
}

async function callGemini(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  birthProfile?: z.infer<typeof requestSchema>["birthProfile"],
  chartContext?: Record<string, unknown>,
  savedMemory = "",
  language: "en" | "hi" = "en"
) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("AI_NOT_CONFIGURED");

  const knowledge = retrieveVedicKnowledge(messages.filter((message) => message.role === "user").at(-1)?.content || "", 3);
  const context = (birthProfile ? "\n\nUser-provided birth details: " + JSON.stringify(birthProfile) : "") +
    (chartContext ? "\n\nCalculated chart payload from the application engine: " + JSON.stringify(chartContext) : "\n\nNo calculated chart payload is available. Do not claim personal placements.") +
    (savedMemory ? "\n\nSaved user context (user-editable notes): " + savedMemory.slice(0, 6000) : "") +
    (knowledge ? "\n\nRetrieved Jyotish knowledge notes:\n" + knowledge : "");

  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  const candidateModels = [
    process.env.GEMINI_MODEL?.trim() || process.env.AI_MODEL?.trim() || "gemini-3.8-flash",
    "gemini-3.8-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ].filter(Boolean);

  let lastStatus = 502;
  for (const model of candidateModels) {
    try {
      const requestUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: getSystemInstruction(language) + context }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 2500 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
        if (text) return text;
      }

      lastStatus = response.status;
      if (response.status === 429) throw new Error("AI_RATE_LIMITED");
      if (response.status === 401 || response.status === 403) throw new Error("AI_PROVIDER_ERROR_" + response.status);
    } catch (e) {
      if (e instanceof Error && (e.message === "AI_RATE_LIMITED" || e.message.startsWith("AI_PROVIDER_ERROR_"))) throw e;
      console.warn("[vedic-ai] Gemini attempt failed for model:", model, e);
    }
  }

  throw new Error("AI_PROVIDER_ERROR_" + lastStatus);
}

async function callOpenAI(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  birthProfile?: z.infer<typeof requestSchema>["birthProfile"],
  chartContext?: Record<string, unknown>,
  savedMemory = "",
  language: "en" | "hi" = "en"
) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("AI_NOT_CONFIGURED");
  const model = process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-4o-mini";
  const knowledge = retrieveVedicKnowledge(messages.filter((message) => message.role === "user").at(-1)?.content || "", 3);
  const context = (birthProfile ? "\n\nUser-provided birth details: " + JSON.stringify(birthProfile) : "") +
    (chartContext ? "\n\nCalculated chart payload from the application engine: " + JSON.stringify(chartContext) : "\n\nNo calculated chart payload is available. Do not claim personal placements.") +
    (savedMemory ? "\n\nSaved user context (user-editable notes): " + savedMemory.slice(0, 6000) : "") +
    (knowledge ? "\n\nRetrieved Jyotish knowledge notes:\n" + knowledge : "");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: getSystemInstruction(language) + context },
        ...messages,
      ],
      temperature: 0.4,
      max_tokens: 2500,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("AI_RATE_LIMITED");
    console.error("[vedic-ai] OpenAI request failed with HTTP", response.status);
    throw new Error("AI_PROVIDER_ERROR_" + response.status);
  }
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (typeof text !== "string" || !text) throw new Error("AI_EMPTY_RESPONSE");
  return text as string;
}

async function callGroq(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  birthProfile?: z.infer<typeof requestSchema>["birthProfile"],
  chartContext?: Record<string, unknown>,
  savedMemory = "",
  language: "en" | "hi" = "en"
) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("AI_NOT_CONFIGURED");

  const knowledge = retrieveVedicKnowledge(messages.filter((message) => message.role === "user").at(-1)?.content || "", 3);
  const context = (birthProfile ? "\n\nUser-provided birth details: " + JSON.stringify(birthProfile) : "") +
    (chartContext ? "\n\nCalculated chart payload from the application engine: " + JSON.stringify(chartContext) : "\n\nNo calculated chart payload is available. Do not claim personal placements.") +
    (savedMemory ? "\n\nSaved user context (user-editable notes): " + savedMemory.slice(0, 6000) : "") +
    (knowledge ? "\n\nRetrieved Jyotish knowledge notes:\n" + knowledge : "");

  const candidateModels = [
    process.env.GROQ_MODEL?.trim() || process.env.AI_MODEL?.trim() || "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
  ].filter(Boolean);

  let lastStatus = 502;
  for (const model of candidateModels) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: getSystemInstruction(language) + context },
            ...messages,
          ],
          temperature: 0.4,
          max_completion_tokens: 2500,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }

      lastStatus = response.status;
      if (response.status === 429) throw new Error("AI_RATE_LIMITED");
      if (response.status === 401 || response.status === 403) throw new Error("AI_PROVIDER_ERROR_" + response.status);
    } catch (e) {
      if (e instanceof Error && (e.message === "AI_RATE_LIMITED" || e.message.startsWith("AI_PROVIDER_ERROR_"))) throw e;
      console.warn("[vedic-ai] Groq attempt failed for model:", model, e);
    }
  }

  throw new Error("AI_PROVIDER_ERROR_" + lastStatus);
}

export async function POST(request: Request) {
  try {
    const rate = await checkRateLimit(request, "chat", 20, 60_000);
    if (!rate.available) {
      return NextResponse.json(
        { error: "The shared rate-limiting service is unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many chat requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = requestSchema.parse(await request.json());

    const sessionClient = await createSupabaseServerClient();
    let signedInUserId: string | null = null;
    let savedMemory = "";

    if (sessionClient) {
      try {
        const authResult = await sessionClient.auth.getUser();
        signedInUserId = authResult.data?.user?.id || null;
      } catch {
        console.warn("[vedic-ai] Supabase session lookup unavailable; continuing.");
      }
    }

    if (signedInUserId) {
      const hourlyQuota = await checkRateLimit(request, "ai-user-hour", 15, 60 * 60 * 1000, signedInUserId);
      if (!hourlyQuota.allowed) {
        return NextResponse.json(
          { error: "You have reached the hourly AI usage limit. Please try again in a little while." },
          { status: 429, headers: { "Retry-After": String(hourlyQuota.retryAfterSeconds) } }
        );
      }
      try {
        const { data: memData } = await sessionClient!.from("user_memory").select("memory").eq("user_id", signedInUserId).maybeSingle();
        if (memData?.memory) savedMemory = memData.memory;
      } catch {}
    }

    let calculatedChart = body.chartContext;
    if (!calculatedChart && body.birthProfile?.date && body.birthProfile?.time && body.birthProfile?.latitude && body.birthProfile?.longitude) {
      try {
        const tz = body.birthProfile.timezone || tzlookup(body.birthProfile.latitude, body.birthProfile.longitude);
        calculatedChart = calculateKundli({
          date: body.birthProfile.date,
          time: body.birthProfile.time,
          place: body.birthProfile.place,
          latitude: body.birthProfile.latitude,
          longitude: body.birthProfile.longitude,
          timezone: tz,
        }) as unknown as Record<string, unknown>;
      } catch (err) {
        console.warn("[vedic-ai] Chart calculation inside chat route failed:", err);
      }
    }

    const { getConfiguredAiProvider } = await import("@/lib/ai-config");
    const provider = getConfiguredAiProvider();
    if (!provider) throw new Error("AI_NOT_CONFIGURED");

    const lang = body.language || "en";
    let reply = "";
    if (provider === "groq") {
      reply = await callGroq(body.messages, body.birthProfile, calculatedChart, savedMemory, lang);
    } else if (provider === "openai") {
      reply = await callOpenAI(body.messages, body.birthProfile, calculatedChart, savedMemory, lang);
    } else {
      reply = await callGemini(body.messages, body.birthProfile, calculatedChart, savedMemory, lang);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid chat payload. Please try again." }, { status: 400 });
    }
    if (error instanceof Error) {
      if (error.message === "AI_RATE_LIMITED") {
        return NextResponse.json({ error: "The AI provider is experiencing high traffic. Please wait a moment and try again." }, { status: 429 });
      }
      if (error.message === "AI_NOT_CONFIGURED") {
        return NextResponse.json({ error: "AI provider is not configured. Please add GEMINI_API_KEY or GROQ_API_KEY to environment variables." }, { status: 503 });
      }
      if (error.message.startsWith("AI_PROVIDER_ERROR_")) {
        return NextResponse.json({ error: "The astrology AI service returned a temporary error. Please try asking your question again." }, { status: 502 });
      }
    }
    console.error("[vedic-ai] Chat route failed:", error);
    return NextResponse.json({ error: "Could not generate an AI response right now. Please try again in a moment." }, { status: 500 });
  }
}
