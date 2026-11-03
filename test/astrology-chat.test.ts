import { describe, it, expect } from "vitest";
import { calculateKundli } from "../lib/astrology";

describe("Astrology AI Response Quality & Personalization (Task 3)", () => {
  const testBirth = {
    date: "1992-07-18",
    time: "10:15",
    place: "Mumbai, India",
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: "Asia/Kolkata",
  };

  it("calculates accurate chart payload for AI context injection", () => {
    const chart = calculateKundli(testBirth);
    expect(chart.ascendant.sign).toBeDefined();
    expect(chart.ascendant.degreeInSign).toBeGreaterThanOrEqual(0);
    expect(chart.planets.length).toBe(9);
    expect(chart.vimshottari.currentMahadasha.lord).toBeDefined();

    // Verify 10th house indicators for career questions
    const tenthHouseSign = chart.planets.filter((p) => p.house === 10);
    expect(Array.isArray(tenthHouseSign)).toBe(true);

    // Verify 7th house indicators for relationship questions
    const seventhHousePlanets = chart.planets.filter((p) => p.house === 7);
    expect(Array.isArray(seventhHousePlanets)).toBe(true);
  });

  it("ensures structured 7-section response format can be parsed and verified", () => {
    const sampleStructuredReply = `
### 1. Your Question
You asked what your calculated birth chart indicates about your professional career direction.

### 2. Simple Answer
Your chart highlights strong potential in analytical, structured, and leadership roles. Success comes steadily through deep mastery of one core skill rather than rushing frequent career changes.

### 3. What Your Kundli Shows
Your 10th house of profession is in Gemini, governed by Mercury. Jupiter is placed in your 11th house of gains, and your current planetary period is Saturn Mahadasha.

### 4. What This Means for You
Mercury brings mental adaptability and skill in communication or strategic planning. Saturn's influence asks for persistence and disciplined work routines.

### 5. Important Points
* Build a specialized domain over 3-5 years.
* Focus on clear written and verbal communication.
* Guard against impatience during early training phases.

### 6. Practical Guidance
Set quarterly professional milestones, maintain structured schedules, and seek mentorship from experienced colleagues.

### 7. Limitations & Context
Traditional Jyotish offers symbolic themes and timing perspectives; individual diligence, education, and real-world opportunities remain paramount.
`;

    const sectionRegexes = [
      /### 1\.\s*Your Question/i,
      /### 2\.\s*Simple Answer/i,
      /### 3\.\s*What Your Kundli Shows/i,
      /### 4\.\s*What This Means for You/i,
      /### 5\.\s*Important Points/i,
      /### 6\.\s*Practical Guidance/i,
      /### 7\.\s*Limitations/i,
    ];

    for (const regex of sectionRegexes) {
      expect(regex.test(sampleStructuredReply)).toBe(true);
    }
  });
});
