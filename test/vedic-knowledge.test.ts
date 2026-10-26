import { describe, expect, it } from "vitest";
import { retrieveVedicKnowledge } from "../lib/vedic-knowledge";

describe("retrieveVedicKnowledge", () => {
  it("retrieves career guidance for a career question", () => {
    const result = retrieveVedicKnowledge("Mera career aur job kaisa rahega?");
    expect(result).toContain("Career and vocation analysis");
    expect(result).toContain("10th bhava");
  });

  it("retrieves dasha notes for Vimshottari questions", () => {
    const result = retrieveVedicKnowledge("Explain Vimshottari mahadasha and antardasha");
    expect(result).toContain("Vimshottari dasha reasoning");
    expect(result).toContain("120-year dasha system");
  });

  it("retrieves ethical guardrails for medical questions", () => {
    const result = retrieveVedicKnowledge("Can astrology tell me about illness and health?");
    expect(result).toContain("Ethical and high-stakes responses");
    expect(result).toContain("Never predict death");
  });

  it("returns an empty string when there is no useful query", () => {
    expect(retrieveVedicKnowledge("")).toBe("");
    expect(retrieveVedicKnowledge("a")).toBe("");
  });

  it("limits the number of returned notes", () => {
    const result = retrieveVedicKnowledge("career marriage dasha nakshatra health", 2);
    expect((result.match(/\[Reference:/g) || []).length).toBe(2);
  });
});
