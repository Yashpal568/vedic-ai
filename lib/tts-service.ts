/**
 * Vedic-AI Text-to-Speech (TTS) Service
 * Synthesizes spoken audio from narration text using configured server-side TTS providers.
 * Supports OpenAI TTS, ElevenLabs, and graceful fallback to browser speech synthesis.
 */

export interface SpeechSynthesisOptions {
  text: string;
  language: "en" | "hi" | "hinglish";
}

export interface SpeechSynthesisResult {
  audioBase64: string;
  contentType: string;
  provider: "openai" | "elevenlabs" | "google";
}

/**
 * Attempts server-side speech synthesis using configured API keys.
 * Returns null if no server-side TTS provider is available, triggering client-side Web Speech fallback.
 */
export async function synthesizeSpeech(
  options: SpeechSynthesisOptions
): Promise<SpeechSynthesisResult | null> {
  const { text, language } = options;
  if (!text || !text.trim()) return null;

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY?.trim();

  // Tier 1: OpenAI TTS (High fidelity, supports multilingual Hindi and English, fast response)
  if (openaiKey) {
    try {
      const voice = language === "hi" ? "nova" : "alloy";
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          voice,
          input: text.slice(0, 4096),
          response_format: "mp3",
          speed: 0.96,
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
          audioBase64: buffer.toString("base64"),
          contentType: "audio/mpeg",
          provider: "openai",
        };
      } else {
        console.warn("[tts-service] OpenAI TTS responded with status:", response.status);
      }
    } catch (err) {
      console.warn("[tts-service] OpenAI TTS error:", err);
    }
  }

  // Tier 2: ElevenLabs TTS (if configured)
  if (elevenLabsKey) {
    try {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel/Adam default
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": elevenLabsKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.slice(0, 4096),
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.72,
            similarity_boost: 0.75,
          },
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
          audioBase64: buffer.toString("base64"),
          contentType: "audio/mpeg",
          provider: "elevenlabs",
        };
      } else {
        console.warn("[tts-service] ElevenLabs responded with status:", response.status);
      }
    } catch (err) {
      console.warn("[tts-service] ElevenLabs TTS error:", err);
    }
  }

  // Fallback to client-side speech synthesis
  return null;
}

