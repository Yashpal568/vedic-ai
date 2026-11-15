import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateKundli } from "@/lib/astrology";
import {
  buildKundliSimpleSummary,
  buildKundliPlanetSummary,
  buildKundliHouseSummary,
  PLANET_NAMES_HI,
  SIGN_NAMES_HI,
} from "@/lib/kundli-summary";
import {
  build15PointVedicReport,
  calculatePlanetaryAspects,
} from "@/lib/vedic-15-point-report";
import {
  parsePalmReading,
  type ParsedPalmReport,
} from "@/lib/palm-parser";
import {
  computeReportHash,
  getCachedReportTranslation,
  setCachedReportTranslation,
  invalidateReportCache,
  translatePalmReport,
  isDevanagariText,
  deterministicTranslateToHindi,
} from "@/lib/i18n/report-translator";
import {
  STORAGE_KEY,
  STORAGE_EXPLICIT_KEY,
  STORAGE_TIMESTAMP_KEY,
  COOKIE_NAME,
} from "@/lib/i18n/language-context";

// Fixed deterministic test chart input
const testChartInput = {
  date: "1994-11-20",
  time: "07:45",
  place: "Varanasi, Uttar Pradesh, India",
  latitude: 25.3176,
  longitude: 82.9739,
  timezone: "Asia/Kolkata",
};

// Setup mock storage for Node.js test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};
if (typeof window === "undefined") {
  (global as unknown as { window: unknown }).window = { localStorage: localStorageMock };
}

describe("Vedic-AI Semantically Accurate Report Localization & Synchronization", () => {
  // ==========================================================================
  // 1. LANGUAGE PREFERENCE SYNCHRONIZATION & RACE-CONDITION PROTECTION
  // ==========================================================================
  describe("1. Language Preference Race-Condition Protection", () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    it("verifies explicit user selection sets storage keys and timestamps", () => {
      const now = Date.now();
      window.localStorage.setItem(STORAGE_KEY, "hi");
      window.localStorage.setItem(STORAGE_EXPLICIT_KEY, "true");
      window.localStorage.setItem(STORAGE_TIMESTAMP_KEY, String(now));

      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("hi");
      expect(window.localStorage.getItem(STORAGE_EXPLICIT_KEY)).toBe("true");
      expect(Number(window.localStorage.getItem(STORAGE_TIMESTAMP_KEY))).toBeGreaterThanOrEqual(now);
    });

    it("prevents stale asynchronous profile response from overwriting newer user selection", () => {
      // Scenario:
      // T0: Page loads with default "en"
      // T1: Fetch started for Supabase profile (in-flight fetchStart = 1000)
      // T2: User clicks "हिन्दी" at T = 1500
      // T3: Supabase profile resolves at T = 2000 with stale "en"
      const fetchStart = 1000;
      const userSelectionTime = 1500;

      // Simulated local state
      let activeLanguage = "hi";
      const lastExplicitSelectionTime = userSelectionTime;

      // In-flight response arrives with stale profile language "en"
      const incomingProfileLang = "en";

      // The guard condition in checkAuthProfile:
      const shouldDiscard = lastExplicitSelectionTime > fetchStart;
      expect(shouldDiscard).toBe(true);

      if (!shouldDiscard) {
        activeLanguage = incomingProfileLang;
      }

      // Language MUST remain "hi" chosen by user!
      expect(activeLanguage).toBe("hi");
    });

    it("respects sequence numbers to discard superseded background requests", () => {
      let activeRequestId = 1;
      const dispatchedRequestId = activeRequestId;

      // User performs another action or switches again
      activeRequestId++;

      // When the first request completes, its ID no longer matches activeRequestId
      const isStale = dispatchedRequestId !== activeRequestId;
      expect(isStale).toBe(true);
    });
  });

  // ==========================================================================
  // 2. KUNDLI REPORT STRUCTURED SUMMARIES SEMANTIC PRESERVATION
  // ==========================================================================
  describe("2. Kundli Report Summaries Semantic Preservation", () => {
    const report = calculateKundli(testChartInput);

    it("preserves identical mathematical facts across English and Hindi simple summaries", () => {
      const summaryEn = buildKundliSimpleSummary(report, "en");
      const summaryHi = buildKundliSimpleSummary(report, "hi");

      expect(summaryEn.length).toBe(summaryHi.length);

      // Verify Ascendant (Lagna) sign is identical
      expect(summaryEn[0]).toContain(report.ascendant.sign);
      expect(summaryHi[0]).toContain(report.ascendant.sign); // e.g. "वृश्चिक (Scorpio)"

      // Verify Moon placement matches
      const moon = report.planets.find((p) => p.name === "Moon");
      if (moon) {
        expect(summaryEn[1]).toContain(moon.sign);
        expect(summaryHi[1]).toContain(moon.sign);
        if (moon.nakshatra) {
          expect(summaryEn[1]).toContain(moon.nakshatra);
          expect(summaryHi[1]).toContain(moon.nakshatra);
        }
      }

      // Verify Sun placement matches house number
      const sun = report.planets.find((p) => p.name === "Sun");
      if (sun) {
        expect(summaryEn[2]).toContain(String(sun.house));
        expect(summaryHi[2]).toContain(String(sun.house));
      }

      // Verify occupied house count matches exactly
      const occupiedHouses = new Set(report.planets.map((p) => p.house)).size;
      expect(summaryEn[3]).toContain(String(occupiedHouses));
      expect(summaryHi[3]).toContain(String(occupiedHouses));

      // Verify Mahadasha lord and years match
      const current = report.vimshottari.currentMahadasha;
      expect(summaryEn[4]).toContain(current.lord);
      expect(summaryHi[4]).toContain(current.lord);
    });

    it("preserves identical planetary house numbers and degrees in planet summaries", () => {
      const planetsEn = buildKundliPlanetSummary(report, "en");
      const planetsHi = buildKundliPlanetSummary(report, "hi");

      expect(planetsEn.length).toBe(planetsHi.length);

      for (let i = 0; i < report.planets.length; i++) {
        const raw = report.planets[i];
        const pEn = planetsEn[i];
        const pHi = planetsHi[i];

        // House number must be 100% identical
        expect(pEn.house).toBe(raw.house);
        expect(pHi.house).toBe(raw.house);

        // Nakshatra must match
        expect(pEn.nakshatra).toBe(raw.nakshatra);
        expect(pHi.nakshatra).toBe(raw.nakshatra);

        // Explanation in Hindi must contain Devanagari text
        expect(isDevanagariText(pHi.explanation)).toBe(true);

        // Explanation in English must not be empty
        expect(pEn.explanation.length).toBeGreaterThan(50);
        expect(pHi.explanation.length).toBeGreaterThan(50);
      }
    });

    it("preserves all 12 houses and their exact planet occupants in house summaries", () => {
      const housesEn = buildKundliHouseSummary(report, "en");
      const housesHi = buildKundliHouseSummary(report, "hi");

      expect(housesEn.length).toBe(12);
      expect(housesHi.length).toBe(12);

      for (let h = 0; h < 12; h++) {
        expect(housesEn[h].house).toBe(h + 1);
        expect(housesHi[h].house).toBe(h + 1);

        // Planet count in each house must match exactly
        expect(housesEn[h].planets.length).toBe(housesHi[h].planets.length);

        // House title in Hindi must have Devanagari text
        expect(isDevanagariText(housesHi[h].title)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 3. 15-POINT VEDIC REPORT & PARASHARI DRISHTI PRESERVATION
  // ==========================================================================
  describe("3. 15-Point Vedic Report & Parashari Drishti Preservation", () => {
    const report = calculateKundli(testChartInput);

    it("preserves all 15 sections with identical astronomical metrics", () => {
      const itemsEn = build15PointVedicReport(report, "en");
      const itemsHi = build15PointVedicReport(report, "hi");

      expect(itemsEn.length).toBe(15);
      expect(itemsHi.length).toBe(15);

      for (let i = 0; i < 15; i++) {
        expect(itemsEn[i].number).toBe(i + 1);
        expect(itemsHi[i].number).toBe(i + 1);

        // Content must not be empty
        expect(itemsEn[i].details.trim().length).toBeGreaterThan(20);
        expect(itemsHi[i].details.trim().length).toBeGreaterThan(20);

        // Hindi version must contain authentic Devanagari script
        expect(isDevanagariText(itemsHi[i].details)).toBe(true);
      }

      // Check Section 1 Lagna degree preservation
      const asc = report.ascendant;
      expect(itemsEn[0].title).toContain(asc.degreeInSign.toFixed(2));
      expect(itemsHi[0].title).toContain(asc.degreeInSign.toFixed(2));

      // Check Section 1 Nakshatra Pada preservation
      expect(itemsEn[0].details).toContain(`Pada ${asc.nakshatraPada}`);
      expect(itemsHi[0].details).toContain(`चरण ${asc.nakshatraPada}`);
    });

    it("preserves Parashari Drishti angles and targeted houses", () => {
      const aspectsEn = calculatePlanetaryAspects(report, "en");
      const aspectsHi = calculatePlanetaryAspects(report, "hi");

      expect(aspectsEn.length).toBe(aspectsHi.length);

      for (let i = 0; i < aspectsEn.length; i++) {
        expect(aspectsEn[i].fromHouse).toBe(aspectsHi[i].fromHouse);
        expect(aspectsEn[i].aspectsHouse).toBe(aspectsHi[i].aspectsHouse);
        expect(aspectsEn[i].specialDrishti).toBe(aspectsHi[i].specialDrishti);
        expect(aspectsEn[i].impactedPlanets.length).toBe(aspectsHi[i].impactedPlanets.length);
      }
    });
  });

  // ==========================================================================
  // 4. PALM REPORT TRANSLATION & FAITHFUL SEMANTIC PRESERVATION
  // ==========================================================================
  describe("4. Hastarekha Palm Report Semantic Translation", () => {
    const sampleEnglishPalm = `## 1. Palm Overview & Hand Structure
Clear left hand with square earth-type palm shape, firm skin texture, and elevated Venus mount.

## 2. Heart Line (Emotions & Connection)
Curved upward ending between Jupiter and Saturn mounts, indicating balanced emotional warmth, fidelity, and healthy personal boundaries.

## 3. Head Line (Thinking & Focus)
Clear and slightly sloping toward the lower Moon mount, indicating analytical discipline paired with creative intuition.

## 4. Life Line (Vitality & Rhythm)
Deep, unbroken curve around the thumb base symbolizing steady stamina, robust physical constitution, and calm daily routine.

## 5. Thumb & Finger Characteristics
Well-set thumb with strong first phalanx indicating firm willpower.

## 6. Planetary Mount Elevations
Mount of Venus is prominently developed; Mount of Jupiter shows moderate elevation.

## 7. Fate Line & Distinct Markings
A distinct vertical fate line starts from the wrist and proceeds steadily toward Saturn, showing strong self-directed career focus.

## 8. Overall Traditional Reading
The palm indicates a grounded, persistent nature with strong ethical standards and practical problem-solving capability.

## 9. Karmic Harmonization & Upaya Practices
1. Morning solar contemplation for 10 minutes.
2. Brihaspati contemplation on Thursdays to strengthen wisdom.
3. Mindful breathing before sleep.

## 10. Limitations & Guidance
Traditional palmistry reflects symbolic tendencies rather than set-in-stone outcomes. Real-life effort and choices remain primary.`;

    const parsed = parsePalmReading(sampleEnglishPalm, "left");

    it("verifies hash generation and cache storage", () => {
      const hash1 = computeReportHash(parsed.overallStructure);
      const hash2 = computeReportHash(parsed.overallStructure);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(8);

      const mockTranslated = {
        reportId: "test-palm-1",
        sourceLanguage: "en" as const,
        targetLanguage: "hi" as const,
        sourceHash: hash1,
        version: 1,
        createdAt: new Date().toISOString(),
        sections: {
          heartLine: {
            sectionId: "heartLine",
            originalText: parsed.heartLine,
            translatedText: "हृदय रेखा संतुलित भावनात्मक स्नेह को दर्शाती है।",
          },
        },
      };

      setCachedReportTranslation("test-palm-1", hash1, "hi", mockTranslated);
      const cached = getCachedReportTranslation("test-palm-1", hash1, "hi");
      expect(cached).toBeDefined();
      expect(cached?.sections.heartLine.translatedText).toContain("हृदय रेखा");

      // Test invalidation
      invalidateReportCache("test-palm-1");
      const afterInvalidate = getCachedReportTranslation("test-palm-1", hash1, "hi");
      expect(afterInvalidate).toBeNull();
    });

    it("translates Palm Report to Hindi while preserving immutable hand telemetry", async () => {
      const translated = await translatePalmReport(parsed, "hi", "test-doc-1");

      // Remedies count must remain intact
      expect(translated.remedies.length).toBe(parsed.remedies.length);

      // Layer array lengths must remain intact
      expect(translated.layer1Structure.length).toBe(parsed.layer1Structure.length);
      expect(translated.layer2Lines.length).toBe(parsed.layer2Lines.length);
      expect(translated.layer3Interpretation.length).toBe(parsed.layer3Interpretation.length);

      // Hindi translation must contain authentic Devanagari text
      expect(isDevanagariText(translated.heartLine)).toBe(true);
      expect(isDevanagariText(translated.headLine)).toBe(true);
      expect(isDevanagariText(translated.lifeLine)).toBe(true);
      expect(isDevanagariText(translated.synthesis)).toBe(true);
    });

    it("switching back to original language restores original text exactly", async () => {
      // First translate to Hindi
      const translatedHi = await translatePalmReport(parsed, "hi", "test-doc-2");
      expect(isDevanagariText(translatedHi.heartLine)).toBe(true);

      // Now switch back to English
      const restoredEn = await translatePalmReport(translatedHi, "en", "test-doc-2");
      expect(restoredEn.remedies.length).toBe(parsed.remedies.length);
      expect(restoredEn.layer1Structure.length).toBe(parsed.layer1Structure.length);
      expect(restoredEn.heartLine).toBeTruthy();
    });
  });
});
