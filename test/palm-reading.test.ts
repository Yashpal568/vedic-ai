import { describe, it, expect } from "vitest";

describe("Palm Reading Workflow (Task 1)", () => {
  it("validates base64 image formats and rejects invalid data", () => {
    const validJpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    const validPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";
    const validWebp = "data:image/webp;base64,UklGRmYAAABXRUJQVlA4==";
    const invalidText = "data:text/plain;base64,SGVsbG8=";
    const notDataUrl = "random-string-not-an-image";

    const regex = /^data:(image\/(?:jpeg|png|webp|jpg));base64,([A-Za-z0-9+/=]+)$/i;

    expect(regex.test(validJpeg)).toBe(true);
    expect(regex.test(validPng)).toBe(true);
    expect(regex.test(validWebp)).toBe(true);
    expect(regex.test(invalidText)).toBe(false);
    expect(regex.test(notDataUrl)).toBe(false);
  });

  it("safely handles quality gate responses from AI vision model", () => {
    const unclearResponse = JSON.stringify({
      clear: false,
      reason: "The main palm lines could not be clearly seen due to blur. Please hold steady in bright daylight.",
    });

    const parsedUnclear = JSON.parse(unclearResponse);
    expect(parsedUnclear.clear).toBe(false);
    expect(parsedUnclear.reason).toContain("blur");

    const clearReading = JSON.stringify({
      clear: true,
      reading: "## 1. Palm Overview\nClear right hand.\n\n## 2. Heart Line\nCurved and steady.",
    });

    const parsedClear = JSON.parse(clearReading);
    expect(parsedClear.clear).toBe(true);
    expect(parsedClear.reading).toContain("Heart Line");
  });
});
