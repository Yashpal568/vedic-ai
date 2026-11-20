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

  it("validates realistic observations including thumb angles and Hindi language features", () => {
    const mixedFeatures = [
      "Thumb shows a well-balanced opening angle of approximately 55 degrees",
      "हृदय रेखा गुरु पर्वत की ओर ऊपर की ओर मुड़ती है",
      "Apollo (ring) finger is visibly longer than Jupiter (index) finger",
      "Life line forms a wide, unbroken arc encompassing a broad Venus mount",
      "Head line slopes smoothly downward toward the Mount of Moon",
    ];
    const result = sanitizePalmVisionEvidence({ distinctiveFeatures: mixedFeatures }, {});
    expect(result.distinctiveFeatures).toHaveLength(5);
  });

  it("supplements distinctive features from grounded line and shape observations when list has fewer than 5 items", () => {
    const sparseObservations = {
      handShape: "Oblong palm with long slender fingers (Water element classification)",
      heartLine: "Deep, smooth upward curve from outer edge toward Jupiter mount",
      headLine: "Continuous line starting near thumb base and sloping downward toward the Moon mount",
      lifeLine: "Broad, smooth arc sweeping around the Mount of Venus down to wrist",
      distinctiveFeatures: [
        "Apollo (ring) finger is visibly longer than Jupiter (index) finger",
      ],
    };
    const result = sanitizePalmVisionEvidence(sparseObservations, {});
    expect(result.distinctiveFeatures.length).toBeGreaterThanOrEqual(5);
    expect(result.distinctiveFeatures).toContain("Apollo (ring) finger is visibly longer than Jupiter (index) finger");
    expect(result.distinctiveFeatures).toContain(sparseObservations.handShape);
  });
});
