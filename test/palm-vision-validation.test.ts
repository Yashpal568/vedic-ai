import { describe, expect, it } from "vitest";
import { sanitizePalmVisionEvidence } from "../lib/palm-vision-validation";

const observations = {
  distinctiveFeatures: [
    "The heart crease curves upward toward the index-middle finger gap.",
    "The head crease begins separately from the life crease near the thumb web.",
    "A short secondary crease crosses the lower central palm diagonally.",
    "The life crease makes a broad arc around the thenar pad.",
    "The fate crease stops before reaching the centre finger base.",
  ],
};

describe("Palm vision evidence validation", () => {
  it("retains five concrete observations and a valid four-point trace", () => {
    const result = sanitizePalmVisionEvidence(observations, {
      heartLine: { visible: true, clarity: "clear", points: [
        { x: 100, y: 200 }, { x: 220, y: 210 }, { x: 340, y: 260 }, { x: 450, y: 300 },
      ] },
    });
    expect(result.distinctiveFeatures).toHaveLength(5);
    expect(result.hasTraceableLine).toBe(true);
    expect(result.detectedLines.heartLine.visible).toBe(true);
    expect(result.detectedLines.headLine.points).toEqual([]);
  });

  it("rejects traces with too few points, non-finite values, or coordinates outside 0..1000", () => {
    const result = sanitizePalmVisionEvidence(observations, {
      heartLine: { visible: true, points: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }] },
      headLine: { visible: true, points: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }, { x: 7, y: 8 }, { x: 1001, y: 9 }] },
      lifeLine: { visible: true, points: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }, { x: Number.NaN, y: 8 }] },
    });
    expect(result.hasTraceableLine).toBe(false);
    expect(result.detectedLines.heartLine.visible).toBe(false);
    expect(result.detectedLines.headLine.visible).toBe(false);
    expect(result.detectedLines.lifeLine.visible).toBe(false);
  });

  it("does not count generic or short strings as image-specific evidence", () => {
    const result = sanitizePalmVisionEvidence({
      distinctiveFeatures: ["nice hand", "clear lines", "looks good", "beautiful palm", "good photo"],
    }, {});
    expect(result.distinctiveFeatures).toHaveLength(0);
    expect(result.hasTraceableLine).toBe(false);
  });
});
