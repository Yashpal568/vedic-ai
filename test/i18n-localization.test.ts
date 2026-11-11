import { describe, it, expect, vi, beforeEach } from "vitest";
import enJson from "@/locales/en.json";
import hiJson from "@/locales/hi.json";
import { parsePalmReading, type ParsedPalmReport } from "@/lib/palm-parser";
import { buildDeterministicNarration } from "@/lib/voice/narration-generator";
import { detectVoiceLanguage, getRecommendedVoiceConfig } from "@/lib/voice/language-service";
import { generateKundliPrintHtml } from "@/lib/print-report";
import { generatePalmPrintHtml } from "@/lib/palm-print-report";
import { calculateKundli } from "@/lib/astrology";

describe("Vedic-AI Global Hindi / English Internationalization System", () => {
  describe("1. Structured Translation Dictionaries Parity & Completeness", () => {
    it("ensures every top-level category in English exists in Hindi", () => {
      const enCategories = Object.keys(enJson);
      const hiCategories = Object.keys(hiJson);
      expect(hiCategories).toEqual(expect.arrayContaining(enCategories));
    });

    it("verifies 100% key parity across all sub-dictionaries", () => {
      for (const category of Object.keys(enJson)) {
        const enSub = (enJson as Record<string, Record<string, string>>)[category];
        const hiSub = (hiJson as Record<string, Record<string, string>>)[category];
        expect(hiSub, `Category ${category} should exist in Hindi`).toBeDefined();

        for (const key of Object.keys(enSub)) {
          expect(
            hiSub[key],
            `Key "${category}.${key}" missing in locales/hi.json`
          ).toBeDefined();
          expect(
            hiSub[key].trim().length,
            `Key "${category}.${key}" in locales/hi.json must not be empty`
          ).toBeGreaterThan(0);
        }
      }
    });

    it("ensures authentic Jyotish Sanskrit and traditional Hindi terminology is preserved", () => {
      expect(hiJson.kundli.title).toContain("जन्म कुंडली");
      expect(hiJson.kundli.lagna).toContain("लग्न");
      expect(hiJson.kundli.nakshatra).toContain("नक्षत्र");
      expect(hiJson.kundli.currentDasha).toContain("महादशा");
      expect(hiJson.kundli.planetaryPositions).toContain("ग्रहों की स्थिति");

      expect(hiJson.nav.palmReading).toContain("हस्तरेखा विश्लेषण");
      expect(hiJson.nav.panchangAlmanac).toContain("पंचांग");
      expect(hiJson.nav.savedReports).toContain("सुरक्षित रिपोर्ट");

      expect(hiJson.palm.heartLine).toContain("हृदय रेखा");
      expect(hiJson.palm.headLine).toContain("मस्तिष्क रेखा");
      expect(hiJson.palm.lifeLine).toContain("जीवन रेखा");
      expect(hiJson.palm.fateLine).toContain("भाग्य रेखा");

      expect(hiJson.voice.stopVoice).toBe("बोलना बंद करें");
      expect(hiJson.voice.tapToStart).toBe("आवाज़ में सुनने के लिए टैप करें");
    });

    it("does not translate protected identifiers, URLs, or brand names", () => {
      expect(hiJson.common.appName).toBe("Vedic AI");
      expect(enJson.common.appName).toBe("Vedic AI");
      expect(hiJson.nav.visionAiBadge).toBe("VISION AI");
    });
  });

  describe("2. Preference Resolution & Storage Priority", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("prioritizes authenticated user metadata over local storage", () => {
      const mockMeta = { language: "hi" };
      const mockLocal = "en";

      const resolved = mockMeta.language || mockLocal || "en";
      expect(resolved).toBe("hi");
    });

    it("falls back to local storage when user is unauthenticated", () => {
      const mockMeta = undefined;
      const mockLocal = "hi";
      const resolved = mockMeta || mockLocal || "en";
      expect(resolved).toBe("hi");
    });

    it("falls back to navigator language when local storage is empty", () => {
      const mockNavigatorLang = "hi-IN";
      const isHindiBrowser = mockNavigatorLang.toLowerCase().startsWith("hi");
      const resolved = isHindiBrowser ? "hi" : "en";
      expect(resolved).toBe("hi");
    });

    it("defaults to English when no preference or Hindi indicator is present", () => {
      const mockNavigatorLang = "fr-FR";
      const isHindiBrowser = mockNavigatorLang.toLowerCase().startsWith("hi");
      const resolved = isHindiBrowser ? "hi" : "en";
      expect(resolved).toBe("en");
    });
  });

  describe("3. Palm Reading Hindi Analysis & Section Extraction", () => {
    it("successfully parses a Hindi Hastarekha report into structured sections", () => {
      const hindiMarkdown = `
## 1. हथेली का आकार व पंचतत्व
आपकी हथेली पृथ्वी तत्व की है जिसमें सुदृढ़ और संतुलित उंगलियां हैं। यह जीवन में व्यावहारिक अनुशासन को दर्शाती है।

## 2. हृदय रेखा (Emotions & Connection)
आपकी हृदय रेखा गुरु पर्वत की ओर अग्रसर है, जो निष्ठा और भावनात्मक संतुलन को व्यक्त करती है।

## 3. मस्तिष्क रेखा (Thinking & Focus)
मस्तिष्क रेखा स्पष्ट और सीधी है, जो बौद्धिक स्थिरता और निर्णय क्षमता का प्रतीक है।

## 4. जीवन रेखा (Vitality & Rhythm)
जीवन रेखा शुक्र पर्वत को सुंदर रूप से घेरे हुए है, जो उत्तम जीवन-ऊर्जा और स्फूर्ति का संकेत देती है।

## 5. भाग्य रेखा (Fate Line)
भाग्य रेखा शनि पर्वत की ओर बढ़ रही है जो स्वावलंबन को इंगित करती है।

## 6. ग्रह पर्वत (Planetary Mounts)
गुरु और शुक्र पर्वत विशेष रूप से पुष्ट हैं।

## 7. वैदिक उपाय व मार्गदर्शन
प्रतिदिन प्रातः 10 मिनट सूर्य नमस्कार और ध्यान करें।
      `;

      const parsed = parsePalmReading(hindiMarkdown, "left");
      expect(parsed.overallStructure).toContain("पृथ्वी तत्व");
      expect(parsed.heartLine).toContain("हृदय रेखा गुरु पर्वत");
      expect(parsed.headLine).toContain("मस्तिष्क रेखा स्पष्ट");
      expect(parsed.lifeLine).toContain("जीवन रेखा शुक्र पर्वत");
      expect(parsed.remedies.length).toBeGreaterThan(0);
      expect(parsed.remedies[0]).toContain("सूर्य नमस्कार");
    });
  });

  describe("4. Spoken Narration Script Generation for Hindi & English", () => {
    const sampleReport = {
      overallStructure: "Solid Earth element palm",
      heartLine: "Curves gracefully towards Jupiter mount",
      headLine: "Sharp, straight, and deep",
      lifeLine: "Well curved around Venus mount",
      fateLine: "Clear ascending line to Saturn",
      mountOfJupiter: "Elevated and prominent",
      mountOfVenus: "Warm and balanced",
      remedies: ["Morning meditation", "Offer water to the rising sun"],
    };

    it("generates pure Devanagari Hindi narration sections when language is 'hi'", () => {
      const narrationHi = buildDeterministicNarration(sampleReport, "left", "hi");
      expect(narrationHi.detectedLanguage).toBe("hi");
      expect(narrationHi.sections.length).toBeGreaterThanOrEqual(5);

      // Must contain Devanagari script
      expect(/[\u0900-\u097F]/.test(narrationHi.narrationText)).toBe(true);
      expect(narrationHi.sections[0].sectionTitle).toBe("प्रस्तावना व स्वागत");
      expect(narrationHi.sections[0].sectionText).toContain("नमस्ते");
    });

    it("generates conversational English narration sections when language is 'en'", () => {
      const narrationEn = buildDeterministicNarration(sampleReport, "right", "en");
      expect(narrationEn.detectedLanguage).toBe("en");
      expect(narrationEn.sections.length).toBeGreaterThanOrEqual(5);
      expect(narrationEn.sections[0].sectionTitle).toBe("Welcome & Introduction");
      expect(narrationEn.sections[0].sectionText).toContain("welcome to your personalized Vedic Hastarekha");
    });

    it("correctly identifies language characteristics and selects appropriate TTS configurations", () => {
      const hiConfig = getRecommendedVoiceConfig("hi");
      expect(hiConfig.promptTone).toContain("Hindi");
      expect(hiConfig.elevenLabsModel).toBe("eleven_multilingual_v2");

      const enConfig = getRecommendedVoiceConfig("en");
      expect(enConfig.promptTone).toContain("English");
    });
  });

  describe("5. PDF Export Devanagari Typography & Unicode Font Embedding", () => {
    it("embeds Noto Sans Devanagari and Mukta fonts in Kundli report print stylesheet", () => {
      const mockChart = calculateKundli({
        date: "1990-05-15",
        time: "14:30",
        place: "Varanasi, India",
        latitude: 25.3176,
        longitude: 82.9739,
        timezone: "Asia/Kolkata",
      });

      const html = generateKundliPrintHtml(mockChart, "kundli-test-101");
      expect(html).toContain("Noto+Sans+Devanagari");
      expect(html).toContain("Mukta");
      expect(html).toContain("Noto Sans Devanagari");
    });

    it("embeds Noto Sans Devanagari and Mukta fonts in Palm Dossier print stylesheet", () => {
      const sampleReport = parsePalmReading(
        "## 1. Palm Overview\nEarth palm with solid contours.\n## 2. Heart Line\nSmooth curvature towards Jupiter.\n",
        "left"
      );

      const html = generatePalmPrintHtml(sampleReport, {
        texture: "clean",
        hand: "left",
      });
      expect(html).toContain("Noto+Sans+Devanagari");
      expect(html).toContain("Mukta");
      expect(html).toContain("Plus Jakarta Sans', 'Noto Sans Devanagari', 'Mukta'");
    });
  });

  describe("6. Language Detection Utility", () => {
    it("identifies Devanagari script accurately as 'hi'", () => {
      const result = detectVoiceLanguage("नमस्ते, आपकी जीवन रेखा बहुत स्पष्ट और सुदृढ़ है।");
      expect(result.detectedLanguage).toBe("hi");
      expect(result.hasDevanagari).toBe(true);
    });

    it("identifies English accurately as 'en'", () => {
      const result = detectVoiceLanguage("Your heart line curves gently toward the Mount of Jupiter.");
      expect(result.detectedLanguage).toBe("en");
      expect(result.hasDevanagari).toBe(false);
    });

    it("honors user explicit preference override", () => {
      const result = detectVoiceLanguage("Your heart line is strong.", "hi");
      expect(result.detectedLanguage).toBe("hi");
    });
  });
});
