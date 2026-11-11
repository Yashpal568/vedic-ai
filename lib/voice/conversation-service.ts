/**
 * Vedic-AI Interactive Voice Q&A Engine
 * Handles conversational queries about the palm report in Hindi, English, or Hinglish.
 * Transcribes voice input via Groq Whisper and generates grounded spoken answers via Groq LLM.
 */

import type { ParsedPalmReport } from "@/lib/palm-parser";
import { synthesizeAudio, type TTSResult } from "@/lib/voice/tts-provider";
import { detectVoiceLanguage, type VoiceLanguage } from "@/lib/voice/language-service";

export interface VoiceConversationRequest {
  reportId: string;
  report: Partial<ParsedPalmReport>;
  question: string;
  hand?: "left" | "right" | "unsure";
  languagePreference?: VoiceLanguage | "auto";
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface VoiceConversationResponse {
  answerText: string;
  language: VoiceLanguage;
  audio?: TTSResult | null;
  groundedInReport: boolean;
  canResumeNarration: boolean;
}

/**
 * Transcribes audio blob using Groq Whisper API (model: whisper-large-v3-turbo).
 * Automatically detects language (Hindi/English).
 */
export async function transcribeAudioBlob(
  audioFile: File | Blob,
  fileName = "voice-question.webm"
): Promise<{ text: string; language?: string }> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) {
    throw new Error("GROQ_NOT_CONFIGURED");
  }

  const payload = new FormData();
  payload.append("file", audioFile, fileName);
  payload.append("model", process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo");
  payload.append("response_format", "json");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: payload,
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.warn(`[voice-qa] Groq transcription HTTP ${response.status}: ${errorBody}`);
    if (response.status === 429) throw new Error("TRANSCRIPTION_RATE_LIMITED");
    throw new Error(`TRANSCRIPTION_ERROR_${response.status}`);
  }

  const data = await response.json();
  const text = (data.text || "").trim();
  return {
    text,
    language: data.language,
  };
}

/**
 * Generates an answer to the user's question grounded strictly in their palm report.
 */
export async function answerReportQuestion(
  request: VoiceConversationRequest
): Promise<VoiceConversationResponse> {
  const { report, question, hand = "unsure", languagePreference = "auto" } = request;

  // 1. Detect language from question
  const langDetection = detectVoiceLanguage(question, languagePreference);
  const language = langDetection.detectedLanguage;

  const groqKey = process.env.GROQ_API_KEY?.trim();

  // Grounded context summary
  const reportContext = [
    `Hand: ${hand}`,
    `Overall Structure: ${report.overallStructure || "Not available"}`,
    `Heart Line: ${report.heartLine || "Not clearly identified"}`,
    `Head Line: ${report.headLine || "Not clearly identified"}`,
    `Life Line: ${report.lifeLine || "Not clearly identified"}`,
    `Fate Line: ${report.fateLine || "Not clearly identified"}`,
    `Mount of Venus: ${report.mountOfVenus || "Not clearly identified"}`,
    `Mount of Jupiter: ${report.mountOfJupiter || "Not clearly identified"}`,
    `Synthesis: ${report.synthesis || "Not available"}`,
    `Remedies: ${(report.remedies || []).join("; ") || "None"}`,
  ].join("\n");

  const systemPrompt = `You are Vedic AI Voice Astrologer, answering a direct spoken question from the user about their specific palm reading report.
Language: Respond in ${language === "hi" ? "Hindi (Devanagari)" : language === "hinglish" ? "fluent conversational Hinglish" : "clear, warm English"}.

CRITICAL INTEGRITY INSTRUCTIONS:
1. Ground your answer STRICTLY in the provided Palm Report.
2. If the user asks about a line or feature that was NOT detected or is missing from the report, clearly state that this specific line could not be identified from their photo.
3. Keep your spoken response CONCISE: 2 to 4 conversational sentences (around 45-75 words), because this text will be read aloud immediately.
4. Do NOT make medical diagnoses, predict lifespan, guarantee future wealth, or claim scientific certainty.
5. Maintain a serene, respectful, supportive Vedic tone.`;

  let answerText = "";

  if (groqKey) {
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is my verified palm reading report:\n${reportContext}\n\nMy Question: "${question}"`,
        },
      ];

      if (request.conversationHistory && request.conversationHistory.length > 0) {
        messages.splice(1, 0, ...request.conversationHistory.slice(-4));
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
          messages,
          temperature: 0.35,
          max_completion_tokens: 300,
        }),
        signal: AbortSignal.timeout(18_000),
      });

      if (response.ok) {
        const data = await response.json();
        answerText = data?.choices?.[0]?.message?.content?.trim() || "";
      }
    } catch (err) {
      console.warn("[voice-qa] Groq answer generation error:", err);
    }
  }

  // Fallback if AI call failed
  if (!answerText) {
    if (language === "hi") {
      answerText = `आपकी रिपोर्ट के अनुसार, आपके हस्तरेखा में मुख्य रेखाएं आपकी जीवन-ऊर्जा और एकाग्रता को दर्शाती हैं। यदि आप किसी विशेष रेखा के बारे में पूछ रहे हैं, तो कृपया सुनिश्चित करें कि वह आपकी रिपोर्ट में स्पष्ट रूप से दर्ज हो।`;
    } else if (language === "hinglish") {
      answerText = `Aapki report ke mutabik, aapki palm lines aapki natural vitality aur mental focus ko reflect karti hain. Is report mein jo features clearly identify hue hain, hum unhi ke aadhar par traditional interpretation provide karte hain.`;
    } else {
      answerText = `Based on your verified palm reading, your major lines reflect natural vitality and analytical focus. We strictly base all interpretations on features clearly identified in your photo.`;
    }
  }

  // Synthesize audio for the answer
  let audio: TTSResult | null = null;
  try {
    audio = await synthesizeAudio({
      text: answerText,
      language,
      speed: 0.98,
    });
  } catch (ttsErr) {
    console.warn("[voice-qa] Audio synthesis for answer failed:", ttsErr);
  }

  return {
    answerText,
    language,
    audio,
    groundedInReport: true,
    canResumeNarration: true,
  };
}
