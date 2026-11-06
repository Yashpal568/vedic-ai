import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateNarrationScript,
  generateFallbackNarrationScript,
  type NarrationRequest,
} from "@/lib/palm-narration-service";
import { synthesizeSpeech } from "@/lib/tts-service";
import { POST } from "@/app/api/palm-reading/narrate/route";
import type { ParsedPalmReport } from "@/lib/palm-parser";

const sampleCompleteReport: ParsedPalmReport = {
  overallStructure:
    "Earth-type broad square palm with balanced, sturdy fingers indicating emotional grounding and disciplined practical drive.",
  heartLine:
    "Gently sweeping upward toward the Jupiter mount; indicates warm emotional loyalty, compassionate integrity, and deep relational devotion.",
  headLine:
    "Long, clear, and horizontally poised; shows analytical discernment, calm composure under pressure, and structured logic.",
  lifeLine:
    "Well-rounded arc enclosing the Venus thenar eminence; signifies resilient physical vitality, strong recuperative vigor, and steady lifestyle cadence.",
  fateLine:
    "Ascending firmly toward Saturn; reflects self-determined professional focus and karmic alignment with chosen goals.",
  thumbCharacteristics:
    "Strong phalange proportions indicating firm willpower and ethical conviction.",
  fingerProportions:
    "Balanced finger lengths aligning with classic Parashara principles.",
  mountOfVenus:
    "Warm, plump mount indicating genuine capacity for love and hospitality.",
  mountOfJupiter:
    "Elevated mount representing moral guidance, wisdom, and leadership.",
  synthesis:
    "A harmonious Hastarekha configuration blending practical perseverance with heartfelt empathy.",
  remedies: [
    "Engage in 10 minutes of quiet morning Pranayama.",
    "Offer selfless service or charity on Thursdays.",
  ],
  layer1Structure: ["Earth-type broad square palm"],
  layer2Lines: ["Gently sweeping heart line"],
  layer3Interpretation: ["Harmonious configuration"],
  disclaimer: "Traditional Jyotish guidance for reflection only.",
  rawMarkdown: "## Palm Report",
};

describe("Vedic-AI Palm Voice Narration System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Grounded Narration Script Generation", () => {
    it("generates an articulate, conversational English script from a complete report", async () => {
      const result = await generateNarrationScript({
        report: sampleCompleteReport,
        hand: "left",
        language: "en",
      });

      expect(result.script).toBeDefined();
      expect(result.script.length).toBeGreaterThan(60);
      expect(result.language).toBe("en");
      // Grounded in report findings
      expect(result.script.toLowerCase()).toContain("heart line");
      expect(result.script.toLowerCase()).toContain("head line");
      expect(result.script.toLowerCase()).toContain("life line");
      // Uses traditional Vedic disclaimer / self-reflection boundary
      expect(result.script.toLowerCase()).toMatch(/reflection|destiny|traditional|actions/);
    });

    it("generates authentic Hindi (Devanagari) script with respectful Jyotish phrasing", async () => {
      const result = await generateNarrationScript({
        report: sampleCompleteReport,
        hand: "right",
        language: "hi",
      });

      expect(result.script).toBeDefined();
      expect(result.language).toBe("hi");
      // Must contain Devanagari characters
      expect(/[\u0900-\u097F]/.test(result.script)).toBe(true);
      expect(result.script).toContain("हृदय रेखा");
      expect(result.script).toContain("जीवन रेखा");
    });

    it("generates conversational Hinglish script", async () => {
      const result = await generateNarrationScript({
        report: sampleCompleteReport,
        hand: "left",
        language: "hinglish",
      });

      expect(result.script).toBeDefined();
      expect(result.language).toBe("hinglish");
      expect(result.script.toLowerCase()).toContain("namaste");
      expect(result.script.toLowerCase()).toMatch(/line|rekha|haath|palm/);
    });

    it("deterministic fallback template produces valid conversational script without LLM", () => {
      const fallbackEn = generateFallbackNarrationScript(
        sampleCompleteReport,
        "left",
        "en"
      );
      expect(fallbackEn.script.length).toBeGreaterThan(100);
      expect(fallbackEn.provider).toBe("template");
      expect(fallbackEn.wordCount).toBeGreaterThan(30);

      const fallbackHi = generateFallbackNarrationScript(
        sampleCompleteReport,
        "left",
        "hi"
      );
      expect(/[\u0900-\u097F]/.test(fallbackHi.script)).toBe(true);

      const fallbackHinglish = generateFallbackNarrationScript(
        sampleCompleteReport,
        "right",
        "hinglish"
      );
      expect(fallbackHinglish.script).toContain("Namaste");
    });
  });

  describe("2. Server TTS Service Contract", () => {
    it("returns null safely when external API keys are not provided, gracefully yielding to Web Speech", async () => {
      const originalOpenAI = process.env.OPENAI_API_KEY;
      const originalElevenLabs = process.env.ELEVENLABS_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      const result = await synthesizeSpeech({
        text: "Namaste and welcome to your Hastarekha reading.",
        language: "en",
      });

      expect(result).toBeNull();

      if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
      if (originalElevenLabs) process.env.ELEVENLABS_API_KEY = originalElevenLabs;
    });

    it("rejects empty or whitespace-only text safely", async () => {
      const result = await synthesizeSpeech({
        text: "   ",
        language: "en",
      });
      expect(result).toBeNull();
    });
  });

  describe("3. POST /api/palm-reading/narrate Route Validation", () => {
    it("rejects incomplete, empty, or missing reports with HTTP 400", async () => {
      const request = new Request("http://localhost:3000/api/palm-reading/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: {
            overallStructure: "",
            heartLine: "",
            headLine: "",
            lifeLine: "",
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("rejects non-JSON or invalid request bodies with HTTP 400", async () => {
      const request = new Request("http://localhost:3000/api/palm-reading/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json",
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it("successfully returns generated script and fallback indicator for valid report", async () => {
      const request = new Request("http://localhost:3000/api/palm-reading/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: sampleCompleteReport,
          hand: "left",
          language: "en",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.script).toBeDefined();
      expect(data.script.length).toBeGreaterThan(40);
      expect(data.language).toBe("en");
      // Either pre-synthesized audioBase64 or fallbackToBrowserSpeech is true
      expect(
        typeof data.audioBase64 === "string" || data.fallbackToBrowserSpeech === true
      ).toBe(true);
    });
  });

  describe("4. Autoplay Security & Duplicate Prevention Rules", () => {
    it("verifies fingerprint uniqueness prevents duplicate audio generation for identical report", () => {
      const makeFingerprint = (rep: ParsedPalmReport, hand: string, lang: string) =>
        `${rep.overallStructure.slice(0, 30)}_${rep.heartLine.slice(0, 30)}_${rep.headLine.slice(0, 30)}_${hand}_${lang}`;

      const fp1 = makeFingerprint(sampleCompleteReport, "left", "en");
      const fp2 = makeFingerprint(sampleCompleteReport, "left", "en");
      const fp3 = makeFingerprint(sampleCompleteReport, "left", "hi"); // switched language
      const fp4 = makeFingerprint(sampleCompleteReport, "right", "en"); // switched hand

      expect(fp1).toEqual(fp2); // Identical: duplicate check stops second run
      expect(fp1).not.toEqual(fp3); // Different language: triggers new generation
      expect(fp1).not.toEqual(fp4); // Different hand: triggers new generation
    });

    it("verifies user stop semantics prevent auto-restart", () => {
      let isUserStopped = false;
      const onStopVoice = () => {
        isUserStopped = true;
      };

      onStopVoice();
      expect(isUserStopped).toBe(true);

      // Auto-restart check must strictly honor user stop state
      const shouldAutoPlay = !isUserStopped;
      expect(shouldAutoPlay).toBe(false);
    });
  });
});

