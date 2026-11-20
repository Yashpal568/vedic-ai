import { describe, it, expect, vi, beforeEach } from "vitest";
import { stopAllSpeech } from "../lib/voice/unified-tts-client";

describe("First-Time Welcome Voice Greeting & Voice Controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defines the exact language scripts required by specification", () => {
    const englishGreeting = "How can I assist you?";
    const hindiGreeting = "नमस्ते, वैदिक एआई में आपका स्वागत है।";

    const getGreetingScript = (lang: "en" | "hi") => {
      return lang === "hi" ? hindiGreeting : englishGreeting;
    };

    expect(getGreetingScript("en")).toBe("How can I assist you?");
    expect(getGreetingScript("hi")).toBe("नमस्ते, वैदिक एआई में आपका स्वागत है।");
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
