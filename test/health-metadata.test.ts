import { afterEach, describe, expect, it } from "vitest";
import { GET } from "../app/api/health/route";

const keys = ["VERCEL_ENV", "AI_PROVIDER", "GEMINI_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY", "SWISS_EPHEMERIS_API_URL"];
const original = Object.fromEntries(keys.map((key) => [key, process.env[key])) as Record<string, string | undefined>;

afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

describe("production health metadata", () => {
  it("reports the deployment stage and configured integrations without exposing credentials", async () => {
    process.env.VERCEL_ENV = "production";
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "dummy-unit-test-key";
    process.env.GROQ_API_KEY = "";
    process.env.OPENAI_API_KEY = "";
    process.env.SWISS_EPHEMERIS_API_URL = "https://vedic-ai-swiss-ephemeris-dvq8.onrender.com";

    const response = await GET();
    const data = await response.json();
    expect(data.stage).toBe("production");
    expect(data.integrations.aiConfigured).toBe(true);
    expect(data.integrations.aiProvider).toBe("gemini");
    expect(data.integrations.kundliEngineConfigured).toBe(true);
    expect(data.integrations.swissEphemerisHost).toBe("vedic-ai-swiss-ephemeris-dvq8.onrender.com");
    expect(data.integrations.palmVisionConfigured).toBe(true);
    expect(data.integrations.serverTTSConfigured).toBe(true);
    expect(JSON.stringify(data)).not.toContain("dummy-unit-test-key");
  });
});
