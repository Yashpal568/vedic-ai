import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateStructuredNarration,
  buildDeterministicNarration,
} from "@/lib/voice/narration-generator";
import {
  detectVoiceLanguage,
  getRecommendedVoiceConfig,
} from "@/lib/voice/language-service";
import {
  ElevenLabsTTSProvider,
  OpenAITTSProvider,
  synthesizeAudio,
  getTTSConfigurationStatus,
} from "@/lib/voice/tts-provider";
import { answerReportQuestion } from "@/lib/voice/conversation-service";
import { POST as narrationHandler } from "@/app/api/voice/narration/route";
import { POST as speechHandler } from "@/app/api/voice/speech/route";
import { POST as conversationHandler } from "@/app/api/voice/conversation/route";
import { GET as configHandler } from "@/app/api/voice/config/route";
import type { ParsedPalmReport } from "@/lib/palm-parser";

const sampleReport: Partial<ParsedPalmReport> = {
  overallStructure:
    "Broad squared earth palm with balanced, sturdy finger proportions indicating grounded pragmatism and steady endurance.",
  heartLine:
    "Gently curving upward toward the Jupiter mount; indicates warm emotional loyalty, compassionate integrity, and deep relational devotion.",
  headLine:
    "Long, clear, and horizontally poised; shows analytical discernment, calm composure under pressure, and structured logic.",
  lifeLine:
    "Well-rounded arc enclosing the Venus thenar eminence; signifies resilient physical vitality, strong recuperative vigor, and steady lifestyle cadence.",
  fateLine:
    "Ascending firmly toward Saturn; reflects self-determined professional focus and karmic alignment with chosen goals.",
  mountOfVenus:
    "Warm, elevated mount indicating genuine capacity for love, hospitality, and vitality.",
  mountOfJupiter:
    "Elevated mount representing moral guidance, wisdom, and leadership.",
  synthesis:
    "A harmonious Hastarekha configuration blending practical perseverance with heartfelt empathy.",
  remedies: [
    "Engage in 10 minutes of quiet morning Pranayama.",
    "Offer selfless service or charity on Thursdays.",
  ],
};

const incompleteReportWithoutFateLine: Partial<ParsedPalmReport> = {
  overallStructure: "Air-type rectangular palm with long slender fingers.",
  heartLine: "Deep and clear heart line curving toward Saturn.",
  headLine: "Sloping head line indicating strong creative imagination.",
  lifeLine: "Graceful arc around Venus mount.",
  fateLine: "", // NOT detected
  mountOfVenus: "Moderately developed.",
  remedies: ["Quiet reflection"],
};

describe("Vedic-AI Voice Astrologer System (Complete Test Suite)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("A. Structured Conversational Narration Generation", () => {
    it("generates structured multi-section English narration from a complete report", async () => {
      const result = await generateStructuredNarration({
        reportId: "test-report-1",
        report: sampleReport,
        hand: "left",
        languagePreference: "en",
      });

      expect(result.reportId).toBe("test-report-1");
      expect(result.detectedLanguage).toBe("en");
      expect(result.sections.length).toBeGreaterThanOrEqual(5);

      const sectionIds = result.sections.map((s) => s.sectionId);
      expect(sectionIds).toContain("greeting");
      expect(sectionIds).toContain("heartLine");
      expect(sectionIds).toContain("headLine");
      expect(sectionIds).toContain("lifeLine");
      expect(sectionIds).toContain("summary");

      // Verify each section has title and non-empty spoken text
      for (const sec of result.sections) {
        expect(sec.sectionTitle.length).toBeGreaterThan(2);
        expect(sec.sectionText.length).toBeGreaterThan(10);
        expect(sec.sequenceIndex).toBeGreaterThanOrEqual(0);
      }
    });

    it("generates respectful pure Hindi narration in Devanagari script", async () => {
      const result = await generateStructuredNarration({
        report: sampleReport,
        hand: "right",
        languagePreference: "hi",
      });

      expect(result.detectedLanguage).toBe("hi");
      expect(/[\u0900-\u097F]/.test(result.narrationText)).toBe(true);

      const heartSec = result.sections.find((s) => s.sectionId === "heartLine");
      expect(heartSec).toBeDefined();
      expect(heartSec?.sectionText).toContain("हृदय रेखा");
    });

    it("generates conversational Hinglish narration", async () => {
      const result = await generateStructuredNarration({
        report: sampleReport,
        hand: "left",
        languagePreference: "hinglish",
      });

      expect(result.detectedLanguage).toBe("hinglish");
      expect(result.narrationText.toLowerCase()).toContain("namaste");
      expect(result.narrationText.toLowerCase()).toMatch(/line|rekha|haath|palm/);
    });

    it("does NOT fabricate missing palm lines; explicitly explains undetected lines as unverified", () => {
      const result = buildDeterministicNarration(
        incompleteReportWithoutFateLine,
        "left",
        "en"
      );

      // Fate line was not detected in incompleteReportWithoutFateLine
      const fateSec = result.sections.find((s) => s.sectionId === "fateLine");
      // Since it wasn't provided, either it's absent or explicitly states not detected
      if (fateSec) {
        expect(fateSec.sectionText.toLowerCase()).toMatch(/not clearly|could not|absent/);
      }
      // Never invents medical or lifespan predictions
      expect(result.narrationText.toLowerCase()).not.toContain("die at age");
      expect(result.narrationText.toLowerCase()).not.toContain("guaranteed fortune");
    });
  });

  describe("B. Language Auto-Detection & Voice Selection", () => {
    it("accurately detects Hindi Devanagari text", () => {
      const hindiText = "नमस्ते, आपकी हथेली की बनावट एक संतुलित और विचारशील प्रकृति को दर्शाती है।";
      const result = detectVoiceLanguage(hindiText);
      expect(result.detectedLanguage).toBe("hi");
      expect(result.hasDevanagari).toBe(true);
    });

    it("accurately detects conversational Hinglish text", () => {
      const hinglishText = "Aapka palm structure dekhkar lagta hai ki aapki hridaya rekha balanced relationships ko show karti hai.";
      const result = detectVoiceLanguage(hinglishText);
      expect(result.detectedLanguage).toBe("hinglish");
      expect(result.hasHinglishMarkers).toBe(true);
    });

    it("defaults standard English to English voice configuration", () => {
      const englishText = "Your heart line gently sweeps upward toward the mount of Jupiter.";
      const result = detectVoiceLanguage(englishText);
      expect(result.detectedLanguage).toBe("en");

      const config = getRecommendedVoiceConfig("en");
      expect(config.elevenLabsModel).toBe("eleven_multilingual_v2");
    });
  });

  describe("C. TTS Provider Abstraction & ElevenLabs Integration", () => {
    it("reports configuration status correctly without exposing secrets", () => {
      const status = getTTSConfigurationStatus();
      expect(status.primaryProvider).toBe("elevenlabs");
      expect(Array.isArray(status.supportedLanguages)).toBe(true);
      expect(status.supportedLanguages).toContain("en");
      expect(status.supportedLanguages).toContain("hi");
      expect(status.supportedLanguages).toContain("hinglish");
    });

    it("ElevenLabs provider validates configuration and identifies missing keys when unset", () => {
      const provider = new ElevenLabsTTSProvider();
      const validation = provider.validateConfiguration();
      expect(validation.provider).toBe("elevenlabs");
      expect(typeof validation.configured).toBe("boolean");
      if (!process.env.ELEVENLABS_API_KEY) {
        expect(validation.missingKeys).toContain("ELEVENLABS_API_KEY");
      }
    });

    it("OpenAI provider validates configuration", () => {
      const provider = new OpenAITTSProvider();
      const validation = provider.validateConfiguration();
      expect(validation.provider).toBe("openai");
      expect(typeof validation.configured).toBe("boolean");
    });

    it("synthesizeAudio falls back gracefully to null when server keys are unconfigured", async () => {
      const originalEleven = process.env.ELEVENLABS_API_KEY;
      const originalOpenAI = process.env.OPENAI_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const result = await synthesizeAudio({
        text: "Namaste and welcome to your palm reading.",
        language: "en",
      });

      expect(result).toBeNull();

      if (originalEleven) process.env.ELEVENLABS_API_KEY = originalEleven;
      if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
    });
  });

  describe("D. API Endpoints Contract & Validation", () => {
    it("POST /api/voice/narration accepts valid report and returns structured sections", async () => {
      const request = new Request("http://localhost:3000/api/voice/narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: sampleReport,
          hand: "left",
          languagePreference: "en",
        }),
      });

      const response = await narrationHandler(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.detectedLanguage).toBe("en");
      expect(Array.isArray(data.sections)).toBe(true);
      expect(data.sections.length).toBeGreaterThanOrEqual(4);
    });

    it("POST /api/voice/narration rejects empty report with HTTP 400", async () => {
      const request = new Request("http://localhost:3000/api/voice/narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: { overallStructure: "", heartLine: "", headLine: "", lifeLine: "" },
        }),
      });

      const response = await narrationHandler(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("POST /api/voice/speech handles synthesis payload and yields fallback flag when unconfigured", async () => {
      const request = new Request("http://localhost:3000/api/voice/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Namaste, this is a test section of your palm reading.",
          language: "en",
          speed: 1.0,
        }),
      });

      const response = await speechHandler(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      // Either audioBase64 string or fallbackToBrowserSpeech: true
      expect(typeof data.audioBase64 === "string" || data.fallbackToBrowserSpeech === true).toBe(true);
    });

    it("GET /api/voice/config returns capabilities and available voices with 0 exposed secrets", async () => {
      const response = await configHandler();
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.feature).toBe("Vedic AI Voice Assistant");
      expect(data.capabilities.automaticNarration).toBe(true);
      expect(data.capabilities.synchronizedHighlighting).toBe(true);
      expect(data.capabilities.interactiveVoiceQA).toBe(true);

      // Verify no secrets leaked
      const jsonStr = JSON.stringify(data);
      expect(jsonStr).not.toContain("sk_");
      expect(jsonStr).not.toContain("key_");
    });
  });

  describe("E. Interactive Voice Q&A Engine", () => {
    it("answers user question grounded strictly in their palm report", async () => {
      const result = await answerReportQuestion({
        reportId: "test-report-qa",
        report: sampleReport,
        question: "Explain my heart line in simple language.",
        hand: "left",
        languagePreference: "en",
      });

      expect(result.answerText).toBeDefined();
      expect(result.answerText.length).toBeGreaterThan(20);
      expect(result.groundedInReport).toBe(true);
      expect(result.canResumeNarration).toBe(true);
    });

    it("POST /api/voice/conversation handles user query and returns grounded response", async () => {
      const request = new Request("http://localhost:3000/api/voice/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: "test-qa-1",
          report: sampleReport,
          question: "What does my palm structure say about my endurance?",
          hand: "left",
          languagePreference: "en",
        }),
      });

      const response = await conversationHandler(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.answerText.length).toBeGreaterThan(15);
      expect(data.canResumeNarration).toBe(true);
    });
  });
});
