/**
 * Vedic-AI Structured Conversational Narration Generator
 * Converts completed palm reports into synchronized, multi-section spoken scripts
 * using Groq LLM integration with deterministic grounded fallbacks.
 */

import type { ParsedPalmReport } from "@/lib/palm-parser";
import { detectVoiceLanguage, type VoiceLanguage } from "@/lib/voice/language-service";

export interface NarrationSection {
  sectionId: string;
  sectionTitle: string;
  sectionText: string;
  correspondingReportSection?: string;
  sequenceIndex: number;
}

export interface StructuredNarrationResponse {
  reportId: string;
  detectedLanguage: VoiceLanguage;
  narrationText: string;
  sections: NarrationSection[];
  provider: "groq" | "gemini" | "openai" | "template";
}

export interface NarrationOptions {
  reportId?: string;
  report: Partial<ParsedPalmReport>;
  hand?: "left" | "right" | "unsure";
  languagePreference?: VoiceLanguage | "auto";
}

function cleanSpokenSentence(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/^["']|["']$/g, "")
    .replace(/[#*_~`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\[(?:pause|smile|laugh|breath|music)\]/gi, "")
    .replace(/\((?:pause|smile|laugh|breath|music)\)/gi, "")
    .trim();
}

function summarizeClause(text?: string | null, maxLen = 130): string {
  if (!text) return "";
  const cleaned = cleanSpokenSentence(text);
  const firstSentence = cleaned.split(/(?<=[.?!])\s+/)[0] || cleaned;
  if (firstSentence.length <= maxLen) return firstSentence;
  return firstSentence.slice(0, maxLen).replace(/,\s*$/, "") + ".";
}

/**
 * Deterministic, grounded fallback generator that builds structured sections
 * without inventing any absent lines or making fatalistic claims.
 */
export function buildDeterministicNarration(
  report: Partial<ParsedPalmReport>,
  hand: "left" | "right" | "unsure" = "unsure",
  language: VoiceLanguage = "en",
  reportId = "report-active"
): StructuredNarrationResponse {
  const isHi = language === "hi";
  const isHinglish = language === "hinglish";

  const handName =
    hand === "left"
      ? isHi ? "बाएं हाथ" : isHinglish ? "left hand" : "left hand"
      : hand === "right"
      ? isHi ? "दाएं हाथ" : isHinglish ? "right hand" : "right hand"
      : isHi ? "हथेली" : isHinglish ? "haath" : "palm";

  const sections: NarrationSection[] = [];
  let seq = 0;

  // 1. Greeting & Introduction
  const greetingText = isHi
    ? `नमस्ते! आपके वैदिक हस्तरेखा विश्लेषण में आपका हार्दिक स्वागत है। आज हम आपके ${handName} के मुख्य लक्षणों और ऊर्जा प्रवाह को समझेंगे।`
    : isHinglish
    ? `Namaste! Aapke Vedic Hastarekha analysis mein aapka swagat hai. Aaj hum aapke ${handName} ke main observations aur planetary energy flow ko explore karenge.`
    : `Namaste, and welcome to your personalized Vedic Hastarekha explanation. Today, we will examine the contours and traditional indicators of your ${handName}.`;

  sections.push({
    sectionId: "greeting",
    sectionTitle: isHi ? "प्रस्तावना व स्वागत" : isHinglish ? "Welcome & Introduction" : "Welcome & Introduction",
    sectionText: greetingText,
    sequenceIndex: seq++,
  });

  // 2. Overall Palm Structure
  if (report.overallStructure?.trim()) {
    const structSummary = summarizeClause(report.overallStructure);
    const structText = isHi
      ? `आपकी हथेली की बनावट: ${structSummary} यह ढांचा आपकी अंतर्निहित कार्यशैली और जीवन के प्रति व्यावहारिक दृष्टिकोण को प्रकट करता है।`
      : isHinglish
      ? `Aapki palm structure: ${structSummary} Yeh foundation aapke practical approach aur steady temperament ko darshaata hai.`
      : `Looking at your palm structure: ${structSummary} This physical foundation reflects your natural temperament and daily lifestyle rhythm.`;

    sections.push({
      sectionId: "overallStructure",
      sectionTitle: isHi ? "हथेली का स्वरूप" : isHinglish ? "Palm Structure" : "Overall Palm Structure",
      sectionText: structText,
      correspondingReportSection: "overallStructure",
      sequenceIndex: seq++,
    });
  }

  // 3. Heart Line (Hridaya Rekha)
  if (report.heartLine?.trim() && !report.heartLine.toLowerCase().includes("not clearly")) {
    const heartSummary = summarizeClause(report.heartLine);
    const heartText = isHi
      ? `आपकी हृदय रेखा, यानी हृदया रेखा: ${heartSummary} यह भावनात्मक निष्ठा, आत्मीय संबंधों में संवेदनशीलता और रिश्तों के संतुलन को इंगित करती है।`
      : isHinglish
      ? `Aapki Heart Line, yaani Hridaya Rekha: ${heartSummary} Yeh emotional warmth, sincere relationships aur empathetic nature ko highlight karti hai.`
      : `Moving to your Heart Line, or Hridaya Rekha: ${heartSummary} This crease reflects emotional resonance, interpersonal loyalty, and how you express empathy.`;

    sections.push({
      sectionId: "heartLine",
      sectionTitle: isHi ? "हृदय रेखा (Hridaya Rekha)" : isHinglish ? "Heart Line (Hridaya Rekha)" : "Heart Line (Hridaya Rekha)",
      sectionText: heartText,
      correspondingReportSection: "heartLine",
      sequenceIndex: seq++,
    });
  } else {
    const absentHeartText = isHi
      ? `आपकी हृदय रेखा इस फोटो में स्पष्ट रूप से दिखाई नहीं दे रही है। इसलिए पारंपरिक रूप से इसके बारे में कोई अनुमान नहीं लगाया गया है।`
      : isHinglish
      ? `Aapki Heart Line is photo mein clearly visible nahi ho paayi, isliye yahan koi assumed reading include nahi ki gayi hai.`
      : `Your Heart Line was not clearly identifiable in this photo, so no speculative interpretation is made.`;

    sections.push({
      sectionId: "heartLine",
      sectionTitle: isHi ? "हृदय रेखा (अस्पष्ट)" : "Heart Line (Not Clearly Identified)",
      sectionText: absentHeartText,
      correspondingReportSection: "heartLine",
      sequenceIndex: seq++,
    });
  }

  // 4. Head Line (Mastaka Rekha)
  if (report.headLine?.trim() && !report.headLine.toLowerCase().includes("not clearly")) {
    const headSummary = summarizeClause(report.headLine);
    const headText = isHi
      ? `आपकी मस्तिष्क रेखा, यानी मस्तका रेखा: ${headSummary} यह विचारशीलता, मानसिक एकाग्रता और निर्णय लेने के आपके विवेकपूर्ण ढंग को दर्शाती है।`
      : isHinglish
      ? `Aapki Head Line, yaani Mastaka Rekha: ${headSummary} Yeh analytical clarity, thoughtful decision-making aur focus ko reveal karti hai.`
      : `Examining your Head Line, or Mastaka Rekha: ${headSummary} This reveals your intellectual focus, analytical approach, and thoughtful discernment.`;

    sections.push({
      sectionId: "headLine",
      sectionTitle: isHi ? "मस्तिष्क रेखा (Mastaka Rekha)" : isHinglish ? "Head Line (Mastaka Rekha)" : "Head Line (Mastaka Rekha)",
      sectionText: headText,
      correspondingReportSection: "headLine",
      sequenceIndex: seq++,
    });
  }

  // 5. Life Line (Jeeva Rekha)
  if (report.lifeLine?.trim() && !report.lifeLine.toLowerCase().includes("not clearly")) {
    const lifeSummary = summarizeClause(report.lifeLine);
    const lifeText = isHi
      ? `आपकी जीवन रेखा, यानी जीवा रेखा: ${lifeSummary} ध्यान रखें, पारंपरिक ज्योतिष में यह रेखा किसी आयु या बीमारी की घोषणा नहीं करती, बल्कि आपकी शारीरिक जीवन-ऊर्जा और पुनः स्वास्थ्य-लाभ की क्षमता का प्रतीक है।`
      : isHinglish
      ? `Aapki Life Line, yaani Jeeva Rekha: ${lifeSummary} Note karein, traditional Jyotish mein yeh lifespan predict nahi karti, balki aapki physical resilience aur daily stamina ka prateek hai.`
      : `Considering your Life Line, or Jeeva Rekha: ${lifeSummary} Please remember that in authentic Vedic Hastarekha, this line does not predict lifespan or illness, but symbolizes physical vitality and endurance.`;

    sections.push({
      sectionId: "lifeLine",
      sectionTitle: isHi ? "जीवन रेखा (Jeeva Rekha)" : isHinglish ? "Life Line (Jeeva Rekha)" : "Life Line (Jeeva Rekha)",
      sectionText: lifeText,
      correspondingReportSection: "lifeLine",
      sequenceIndex: seq++,
    });
  }

  // 6. Fate Line (Bhagya Rekha)
  if (report.fateLine?.trim() && !report.fateLine.toLowerCase().includes("not clearly")) {
    const fateSummary = summarizeClause(report.fateLine);
    const fateText = isHi
      ? `आपकी भाग्य रेखा: ${fateSummary} यह कर्म में स्वावलंबन और व्यक्तिगत प्रयासों द्वारा उद्देश्य की स्पष्टता को व्यक्त करती है।`
      : isHinglish
      ? `Aapki Fate Line: ${fateSummary} Yeh self-directed efforts aur career direction mein badhti hui clarity ko indicate karti hai.`
      : `Regarding your Fate Line, or Bhagya Rekha: ${fateSummary} This points to self-directed vocation and purposeful clarity gained through your own efforts.`;

    sections.push({
      sectionId: "fateLine",
      sectionTitle: isHi ? "भाग्य रेखा (Bhagya Rekha)" : isHinglish ? "Fate Line (Bhagya Rekha)" : "Fate Line (Bhagya Rekha)",
      sectionText: fateText,
      correspondingReportSection: "fateLine",
      sequenceIndex: seq++,
    });
  }

  // 7. Planetary Mounts
  if (report.mountOfJupiter?.trim() || report.mountOfVenus?.trim()) {
    const jupiter = summarizeClause(report.mountOfJupiter);
    const venus = summarizeClause(report.mountOfVenus);
    const mountsText = isHi
      ? `ग्रह पर्वतों की स्थिति: ${jupiter ? `गुरु पर्वत ${jupiter}। ` : ""}${venus ? `शुक्र पर्वत ${venus}।` : ""}`
      : isHinglish
      ? `Planetary mounts par: ${jupiter ? `Jupiter Mount ${jupiter}. ` : ""}${venus ? `Venus Mount ${venus}.` : ""}`
      : `Regarding the planetary mounts: ${jupiter ? `Jupiter mount reflects ${jupiter}. ` : ""}${venus ? `Venus mount indicates ${venus}.` : ""}`;

    sections.push({
      sectionId: "mounts",
      sectionTitle: isHi ? "ग्रह पर्वत (Planetary Mounts)" : isHinglish ? "Planetary Mounts" : "Planetary Mounts",
      sectionText: mountsText,
      correspondingReportSection: "mountOfJupiter",
      sequenceIndex: seq++,
    });
  }

  // 8. Remedies & Upaya
  if (report.remedies && report.remedies.length > 0) {
    const remedySample = report.remedies.slice(0, 2).map((r) => cleanSpokenSentence(r)).join("; ");
    const remediesText = isHi
      ? `संतुलन और आत्मिक शांति के लिए सरल उपाय: ${remedySample}। प्रतिदिन सुबह कुछ क्षण शांत चिंतन और ध्यान अवश्य करें।`
      : isHinglish
      ? `Daily harmony aur balance ke liye suggestions: ${remedySample}. Morning mein shant contemplation helpful rahega.`
      : `For constructive daily harmony: ${remedySample}. Beginning mornings with quiet meditation brings steady clarity.`;

    sections.push({
      sectionId: "remedies",
      sectionTitle: isHi ? "सकारात्मक उपाय व मार्गदर्शन" : isHinglish ? "Guidance & Upaya" : "Constructive Guidance & Upaya",
      sectionText: remediesText,
      correspondingReportSection: "remedies",
      sequenceIndex: seq++,
    });
  }

  // 9. Summary & Ethical Disclaimer
  const summaryText = isHi
    ? `याद रखें, हस्तरेखा शास्त्र आत्म-चिंतन का एक सुंदर दर्पण है, कोई अटल भाग्य नहीं। आपके सजग विचार और सत्कर्म ही आपका भविष्य गढ़ते हैं।`
    : isHinglish
    ? `Yaad rakhein, Hastarekha self-reflection ka ek cultural mirror hai. Aapke conscious efforts aur daily actions hi aapki life guide karte hain.`
    : `Remember that palmistry is a traditional symbolic discipline for self-reflection, not scientific certainty. Your conscious choices, efforts, and character always shape your destiny.`;

  sections.push({
    sectionId: "summary",
    sectionTitle: isHi ? "निष्कर्ष व संकल्प" : isHinglish ? "Summary & Reflection" : "Summary & Reflection",
    sectionText: summaryText,
    correspondingReportSection: "disclaimer",
    sequenceIndex: seq++,
  });

  const narrationText = sections.map((s) => s.sectionText).join(" ");

  return {
    reportId,
    detectedLanguage: language,
    narrationText,
    sections,
    provider: "template",
  };
}

/**
 * Generates structured conversational narration using Groq LLM with deterministic fallback.
 */
export async function generateStructuredNarration(
  options: NarrationOptions
): Promise<StructuredNarrationResponse> {
  const { report, hand = "unsure", languagePreference = "auto" } = options;
  const reportId = options.reportId || `report-${Date.now()}`;

  // 1. Detect language automatically from report content or user preference
  const sampleReportText = [
    report.overallStructure,
    report.heartLine,
    report.headLine,
    report.lifeLine,
    report.synthesis,
  ]
    .filter(Boolean)
    .join(" ");

  const langResult = detectVoiceLanguage(sampleReportText, languagePreference);
  const language = langResult.detectedLanguage;

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (!groqKey) {
    return buildDeterministicNarration(report, hand, language, reportId);
  }

  // 2. Groq LLM structured prompt
  const systemPrompt = `You are Vedic AI Voice Astrologer, an eloquent, compassionate, traditional Indian Jyotish companion.
Your task is to convert the user's verified Palm Reading report into a structured conversational narration in JSON format.
Language to use: ${language === "hi" ? "Hindi (Pure spoken Devanagari Hindi)" : language === "hinglish" ? "Hinglish (Conversational Romanized Hindi/English)" : "English (Warm, respectful, conversational English)"}.

CRITICAL ACCURACY & INTEGRITY RULES:
1. Explain Heart Line, Head Line, Life Line, and Fate Line ONLY if findings are actually present in the report.
2. If any line or mount is not detected or unclear in the report, explicitly state that it could not be clearly identified. NEVER invent missing lines, coordinates, or fake palm annotations.
3. NEVER make fatalistic predictions, medical diagnoses, lifespan predictions, or guaranteed wealth outcomes. Distinguish traditional symbolic reflections from scientific certainty.
4. Output MUST be valid JSON with this exact structure:
{
  "narrationText": "Full complete spoken text...",
  "sections": [
    {
      "sectionId": "greeting",
      "sectionTitle": "Title",
      "sectionText": "Spoken text for this section...",
      "sequenceIndex": 0
    },
    {
      "sectionId": "overallStructure",
      "sectionTitle": "Palm Structure",
      "sectionText": "Spoken text...",
      "correspondingReportSection": "overallStructure",
      "sequenceIndex": 1
    },
    {
      "sectionId": "heartLine",
      "sectionTitle": "Heart Line",
      "sectionText": "Spoken text...",
      "correspondingReportSection": "heartLine",
      "sequenceIndex": 2
    },
    ...
  ]
}`;

  const userPrompt = `Here is the verified palm report to narrate for the user's ${hand} hand:
- Overall Structure: ${report.overallStructure || "Not provided"}
- Heart Line: ${report.heartLine || "Not clearly identified"}
- Head Line: ${report.headLine || "Not clearly identified"}
- Life Line: ${report.lifeLine || "Not clearly identified"}
- Fate Line: ${report.fateLine || "Not clearly identified"}
- Mount of Venus: ${report.mountOfVenus || "Not clearly identified"}
- Mount of Jupiter: ${report.mountOfJupiter || "Not clearly identified"}
- Synthesis: ${report.synthesis || "Not provided"}
- Remedies: ${(report.remedies || []).join("; ") || "None"}

Please produce the structured JSON narration script now.`;

  const candidateModels = [
    process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
  ];

  for (const model of candidateModels) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.35,
          response_format: { type: "json_object" },
          max_completion_tokens: 2200,
        }),
        signal: AbortSignal.timeout(24_000),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content?.trim();
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.sections) && parsed.sections.length >= 3) {
            return {
              reportId,
              detectedLanguage: language,
              narrationText: parsed.narrationText || parsed.sections.map((s: NarrationSection) => s.sectionText).join(" "),
              sections: parsed.sections.map((s: NarrationSection, idx: number) => ({
                sectionId: s.sectionId || `section-${idx}`,
                sectionTitle: s.sectionTitle || `Section ${idx + 1}`,
                sectionText: cleanSpokenSentence(s.sectionText),
                correspondingReportSection: s.correspondingReportSection,
                sequenceIndex: idx,
              })),
              provider: "groq",
            };
          }
        }
      }
    } catch (err) {
      console.warn(`[narration-generator] Groq attempt failed with ${model}:`, err);
    }
  }

  // Fallback to grounded deterministic sections if Groq fails or rate limits
  return buildDeterministicNarration(report, hand, language, reportId);
}
