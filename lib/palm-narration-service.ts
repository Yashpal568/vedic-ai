/**
 * Vedic-AI Palm Narration Service
 * Generates natural, conversational spoken explanations from completed Palm Reading reports.
 * Powered by Groq LLM integration with automatic multilingual support (English, Hindi, Hinglish)
 * and fail-safe deterministic Vedic speech templates.
 */

import type { ParsedPalmReport } from "@/lib/palm-parser";

export type NarrationLanguage = "en" | "hi" | "hinglish";

export interface NarrationRequest {
  report: Partial<ParsedPalmReport>;
  hand?: "left" | "right" | "unsure";
  language?: NarrationLanguage;
}

export interface NarrationResult {
  script: string;
  language: NarrationLanguage;
  provider: "groq" | "gemini" | "openai" | "template";
  wordCount: number;
}

function cleanScriptText(text: string): string {
  return text
    .replace(/^["']|["']$/g, "")
    .replace(/[#*_~`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\[(?:pause|smile|laugh|breath|music)\]/gi, "")
    .replace(/\((?:pause|smile|laugh|breath|music)\)/gi, "")
    .trim();
}

function summarizeClause(text?: string | null, maxLen = 95): string {
  if (!text) return "";
  const cleaned = text.split(/[.;]/)[0] || text;
  const trimmed = cleaned.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).replace(/,\s*$/, "");
}

/**
 * Fallback grounded speech generator when upstream LLM is unreachable or unconfigured.
 */
export function generateFallbackNarrationScript(
  report: Partial<ParsedPalmReport>,
  hand: "left" | "right" | "unsure" = "unsure",
  language: NarrationLanguage = "en"
): NarrationResult {
  const handEn = hand === "left" ? "left hand" : hand === "right" ? "right hand" : "palm";
  const handHi = hand === "left" ? "बाएं हाथ" : hand === "right" ? "दाएं हाथ" : "हथेली";
  const handHinglish = hand === "left" ? "left hand" : hand === "right" ? "right hand" : "haath";

  const heartSummary = summarizeClause(report.heartLine) || "genuine emotional warmth and thoughtful loyalty";
  const headSummary = summarizeClause(report.headLine) || "structured focus paired with reflective decision-making";
  const lifeSummary = summarizeClause(report.lifeLine) || "balanced physical resilience and steady endurance";
  const fateSummary = summarizeClause(report.fateLine) || summarizeClause(report.mountOfJupiter) || "clear vocational dedication and guiding inner values";

  let script = "";

  if (language === "hi") {
    script = `नमस्ते, आपके हस्तरेखा विश्लेषण में आपका स्वागत है। आपकी ${handHi} की बनावट एक संतुलित और विचारशील प्रकृति को दर्शाती है। आपकी हृदय रेखा, यानी हृदया रेखा, ${heartSummary} को उजागर करती है। आपकी मस्तिष्क रेखा, विचारशील चिंतन और व्यावहारिक निर्णय लेने की क्षमता दिखाती है। जीवन रेखा ${lifeSummary} का प्रतीक है; ध्यान रखें, पारंपरिक हस्तरेखा शास्त्र में यह रेखा आयु या किसी बीमारी की भविष्यवाणी नहीं करती, बल्कि आपके जीवन-ताल और आंतरिक शक्ति को दर्शाती है। इसके साथ ही, आपकी भाग्य रेखा जीवन में सतत प्रयास और उद्देश्य की स्पष्टता की ओर संकेत करती है। आत्मिक संतुलन के लिए, प्रतिदिन सुबह कुछ क्षण शांत ध्यान करें। याद रखें, हस्तरेखा आत्म-चिंतन का एक सुंदर दर्पण है, आपकी सजग इच्छाशक्ति और कर्म ही आपका मार्ग तय करते हैं।`;
  } else if (language === "hinglish") {
    script = `Namaste! Aapke Hastarekha analysis mein aapka swagat hai. Aapke ${handHinglish} ko dekhkar, aapka palm structure ek grounded aur balanced constitution reflect karta hai. Aapki Heart Line, yaani Hridaya Rekha, ${heartSummary} ko darshaati hai. Aapki Head Line, yaani Mastaka Rekha, thoughtful analytical approach aur clear focus ko show karti hai. Jeeva Rekha ${lifeSummary} ka prateek hai; dhyan rahe, traditional Jyotish mein yeh line lifespan predict nahi karti, balki aapki lifestyle rhythm ko symbolize karti hai. Aapki Fate Line purpose aur self-reliance ko indicate karti hai. Daily harmony ke liye, subah thoda samay quiet contemplation mein bitaayein. Yaad rakhein, Hastarekha self-reflection ke liye hai; aapke conscious karmas hi aapki life guide karte hain.`;
  } else {
    script = `Namaste, and welcome to your personalized Hastarekha palmistry explanation. Observing your ${handEn}, the structural architecture of your palm reflects a grounded, balanced temperament. Your Heart Line, or Hridaya Rekha, highlights ${heartSummary}. Moving to your Head Line, or Mastaka Rekha, your thinking style demonstrates ${headSummary}. Your Life Line reflects ${lifeSummary}; remember, in traditional Vedic Hastarekha, this line does not predict lifespan or illness, but symbolizes your recuperative vitality and personal rhythm. Furthermore, your lines and mounts indicate ${fateSummary}. For daily harmonization, begin your mornings with a few moments of quiet reflection. Remember that palmistry is a traditional symbolic discipline for self-reflection; your conscious choices and actions always guide your destiny.`;
  }

  const cleaned = cleanScriptText(script);
  return {
    script: cleaned,
    language,
    provider: "template",
    wordCount: cleaned.split(/\s+/).length,
  };
}

/**
 * Generates an articulate, conversational speech narration script using Groq or configured LLM.
 */
export async function generateNarrationScript(
  request: NarrationRequest
): Promise<NarrationResult> {
  const { report, hand = "unsure", language = "en" } = request;

  const groqKey = process.env.GROQ_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  const langInstructions: Record<NarrationLanguage, { name: string; desc: string }> = {
    en: {
      name: "English",
      desc: "Warm, respectful, conversational English with classical Sanskrit palm terms explained simply in parentheses.",
    },
    hi: {
      name: "Hindi (हिन्दी)",
      desc: "Pure, polite, and empathetic spoken Hindi in Devanagari script, natural for an elder Jyotish guide.",
    },
    hinglish: {
      name: "Hinglish (Hindi-English blend)",
      desc: "Natural conversational urban Hinglish written in Latin script (e.g., 'Namaste! Aapke hastarekha analysis mein...'), friendly and contemporary.",
    },
  };

  const selectedLang = langInstructions[language] || langInstructions.en;

  const prompt = `You are the Vedic AI Voice Assistant, an authentic, warm, and comforting guide explaining a seeker's traditional Hastarekha palmistry report.
Your voice should sound calm, natural, and conversational — like a thoughtful elder or wise mentor speaking directly to the listener.

CRITICAL INSTRUCTIONS:
1. Speak in ${selectedLang.name} (${selectedLang.desc}).
2. Keep the explanation concise and engaging (approximately 130 to 180 words, spoken in about 50-60 seconds).
3. Walk through the key findings step-by-step:
   - Warm welcome ("Namaste") and brief note on their hand structure (${hand !== "unsure" ? `${hand} hand` : "palm"}).
   - Heart Line (Hridaya Rekha): ${report.heartLine}
   - Head Line (Mastaka Rekha): ${report.headLine}
   - Life Line (Jeeva Rekha): ${report.lifeLine} (ALWAYS explicitly remind the listener that Hastarekha does NOT predict lifespan or illness; it reflects vitality and daily endurance).
   - Fate Line (Bhagya Rekha) or Mounts: ${report.fateLine || report.mountOfJupiter}
   - One actionable, peaceful Upaya or daily habit for balance: ${report.remedies?.[0] || "morning contemplation"}
   - Gentle concluding reminder that palmistry is a symbolic cultural mirror for self-reflection, not a deterministic destiny.
4. Use commas, short clauses, and conversational cadence so speech synthesis sounds human.
5. Do NOT output markdown headings, bullets, asterisks, quotation marks, emojis, or audio tags (no "[pause]"). Output purely the spoken words.
6. Never invent palm lines or findings absent from the provided report.`;

  // Try Groq first
  if (groqKey) {
    const groqModels = [
      process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
    ].filter(Boolean);

    for (const model of groqModels) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.35,
            max_completion_tokens: 450,
          }),
          signal: AbortSignal.timeout(12000),
        });

        if (response.ok) {
          const data = await response.json();
          const raw = data?.choices?.[0]?.message?.content?.trim();
          if (raw && raw.length > 50) {
            const cleaned = cleanScriptText(raw);
            return {
              script: cleaned,
              language,
              provider: "groq",
              wordCount: cleaned.split(/\s+/).length,
            };
          }
        }
      } catch (err) {
        console.warn("[palm-narration] Groq attempt failed for model:", model, err);
      }
    }
  }

  // Try Gemini fallback
  if (geminiKey) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 450 },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (raw && raw.length > 50) {
          const cleaned = cleanScriptText(raw);
          return {
            script: cleaned,
            language,
            provider: "gemini",
            wordCount: cleaned.split(/\s+/).length,
          };
        }
      }
    } catch (err) {
      console.warn("[palm-narration] Gemini attempt failed:", err);
    }
  }

  // Try OpenAI fallback
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.35,
          max_tokens: 450,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data?.choices?.[0]?.message?.content?.trim();
        if (raw && raw.length > 50) {
          const cleaned = cleanScriptText(raw);
          return {
            script: cleaned,
            language,
            provider: "openai",
            wordCount: cleaned.split(/\s+/).length,
          };
        }
      }
    } catch (err) {
      console.warn("[palm-narration] OpenAI attempt failed:", err);
    }
  }

  // Use reliable deterministic Vedic template
  return generateFallbackNarrationScript(report, hand, language);
}

