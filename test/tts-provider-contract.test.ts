import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiTTSProvider } from "../lib/voice/tts-provider";

const originalEnv = {
  key: process.env.GEMINI_API_KEY,
  voice: process.env.GEMINI_TTS_VOICE,
  model: process.env.GEMINI_TTS_MODEL,
};
const originalFetch = global.fetch;

afterEach(() => {
  if (originalEnv.key === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalEnv.key;
  if (originalEnv.voice === undefined) delete process.env.GEMINI_TTS_VOICE;
  else process.env.GEMINI_TTS_VOICE = originalEnv.voice;
  if (originalEnv.model === undefined) delete process.env.GEMINI_TTS_MODEL;
  else process.env.GEMINI_TTS_MODEL = originalEnv.model;
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("Gemini TTS REST contract", () => {
  it("sets a prebuilt voice, language, audio modality, and keeps the API key out of the URL", async () => {
    process.env.GEMINI_API_KEY = "unit-test-key";
    process.env.GEMINI_TTS_VOICE = "Kore";
    process.env.GEMINI_TTS_MODEL = "gemini-3.8-flash-tts";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ inlineData: { data: "UklGRg==", mimeType: "audio/wav" } }] } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await new GeminiTTSProvider().generateSpeech({
      text: "A unique mocked Gemini voice payload test 7819.",
      language: "hi",
    });

    expect(result.provider).toBe("gemini");
    expect(result.contentType).toBe("audio/wav");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).not.toContain("unit-test-key");
    expect(new Headers(init.headers).get("x-goog-api-key")).toBe("unit-test-key");
    const payload = JSON.parse(String(init.body));
    expect(payload.generationConfig.responseModalities).toEqual(["AUDIO"]);
    expect(payload.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe("Kore");
    expect(payload.generationConfig.speechConfig.languageCode).toBe("hi-IN");
  });
});
