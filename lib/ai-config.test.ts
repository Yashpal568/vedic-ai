import { describe, expect, it } from "vitest";
import { getConfiguredAiProvider } from "./ai-config";

describe("configured AI provider selection", () => {
  it("uses the selected provider when its key is present", () => {
    expect(getConfiguredAiProvider({ AI_PROVIDER: "openai", OPENAI_API_KEY: "key-openai", GEMINI_API_KEY: "key-gemini" })).toBe("openai");
  });

  it("falls back to an available provider when the selected provider key is missing", () => {
    expect(getConfiguredAiProvider({ AI_PROVIDER: "gemini", GROQ_API_KEY: "key-groq" })).toBe("groq");
    expect(getConfiguredAiProvider({ AI_PROVIDER: "groq", OPENAI_API_KEY: "key-openai" })).toBe("openai");
  });

  it("uses the documented default order when no provider is selected", () => {
    expect(getConfiguredAiProvider({ GEMINI_API_KEY: "key-gemini", GROQ_API_KEY: "key-groq" })).toBe("gemini");
  });

  it("returns null when no provider key is configured", () => {
    expect(getConfiguredAiProvider({ AI_PROVIDER: "gemini" })).toBeNull();
  });
});
