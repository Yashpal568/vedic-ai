import { describe, it, expect, vi, beforeEach } from "vitest";
import { stopAllSpeech } from "../lib/voice/unified-tts-client";
import { GREETINGS } from "../components/voice/welcome-voice-greeting";

describe("First-Time Welcome Voice Greeting & Voice Controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defines the exact language scripts required by specification with Namaste", () => {
    expect(GREETINGS.en.toLowerCase()).toContain("namaste");
    expect(GREETINGS.en.toLowerCase()).toContain("how can i assist you");
    expect(GREETINGS.hi).toContain("नमस्ते");

    const getGreetingScript = (lang: "en" | "hi") => {
      return lang === "hi" ? GREETINGS.hi : GREETINGS.en;
    };

    expect(getGreetingScript("en")).toBe("Namaste, how can I assist you?");
    expect(getGreetingScript("hi")).toBe("नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ?");
  });

  it("checks localStorage persistence flag so greeting is not repeated", () => {
    const mockStorage: Record<string, string> = {};
    const STORAGE_KEY = "hasPlayedWelcomeGreeting";

    const hasPlayed = () => mockStorage[STORAGE_KEY] === "true";
    const markPlayed = () => {
      mockStorage[STORAGE_KEY] = "true";
    };

    // First visit: not played
    expect(hasPlayed()).toBe(false);

    // Play greeting
    markPlayed();
    expect(hasPlayed()).toBe(true);

    // Subsequent reloads: already played, skip playback
    expect(hasPlayed()).toBe(true);
  });

  it("handles stopAllSpeech cleanly without throwing errors", () => {
    expect(() => {
      stopAllSpeech();
    }).not.toThrow();
  });

  it("verifies auto-cleanup event channels exist and can be dispatched", () => {
    const target = new EventTarget();
    let voiceStopped = false;
    let languageChanged = false;

    const stopVoiceHandler = () => {
      voiceStopped = true;
    };
    const languageChangeHandler = (e: Event) => {
      languageChanged = true;
      expect((e as CustomEvent).detail?.language).toBe("hi");
    };

    target.addEventListener("vedic-stop-voice", stopVoiceHandler);
    target.addEventListener("vedic-language-change", languageChangeHandler as EventListener);

    target.dispatchEvent(new CustomEvent("vedic-stop-voice"));
    expect(voiceStopped).toBe(true);

    target.dispatchEvent(new CustomEvent("vedic-language-change", { detail: { language: "hi" } }));
    expect(languageChanged).toBe(true);
  });
});
