import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  translateAssistantChatMessage,
  getCachedChatTranslation,
} from "@/lib/i18n/chat-translator";
import { computeReportHash, isDevanagariText } from "@/lib/i18n/report-translator";

describe("Chat Message Reactive Localization & Translation", () => {
  const greetingEn =
    "Hi there! 👋 Welcome to Vedic AI — I can help you explore what your birth chart says about personality, career, relationships, Mahadashas, or even today's Panchang. Feel free to ask a question or share your birth details so we can calculate your chart together.";

  const greetingHi =
    "नमस्ते! 👋 वैदिक एआई (Vedic AI) में आपका स्वागत है — मैं यह जानने में आपकी सहायता कर सकता हूँ कि आपकी जन्म कुंडली आपके व्यक्तित्व, करियर, संबंधों, महादशाओं या आज के पंचांग के बारे में क्या कहती है। बेझिझक कोई प्रश्न पूछें या अपने जन्म का विवरण साझा करें ताकि हम आपकी कुंडली की गणना कर सकें।";

  it("identifies Devanagari script accurately", () => {
    expect(isDevanagariText(greetingHi)).toBe(true);
    expect(isDevanagariText(greetingEn)).toBe(false);
  });

  it("translates canonical English greeting to Hindi immediately", async () => {
    const translated = await translateAssistantChatMessage(greetingEn, "hi");
    expect(isDevanagariText(translated)).toBe(true);
    expect(translated).toContain("वैदिक एआई");
    expect(translated).toContain("जन्म कुंडली");
  });

  it("translates canonical Hindi greeting to English immediately", async () => {
    const translated = await translateAssistantChatMessage(greetingHi, "en");
    expect(isDevanagariText(translated)).toBe(false);
    expect(translated).toContain("Welcome to Vedic AI");
  });

  it("returns content unchanged if already in the target language", async () => {
    const alreadyHi = await translateAssistantChatMessage(greetingHi, "hi");
    expect(alreadyHi).toBe(greetingHi);

    const alreadyEn = await translateAssistantChatMessage(greetingEn, "en");
    expect(alreadyEn).toBe(greetingEn);
  });

  it("translates 7-section markdown headings between English and Hindi", async () => {
    const sectionTextEn = [
      "### 1. Your Question",
      "Career inquiry.",
      "### 2. Simple Answer",
      "Jupiter in 10th indicates positive growth.",
      "### 3. What Your Kundli Shows",
      "Tula lagna with Jupiter in Cancer.",
    ].join("\n\n");

    const translatedHi = await translateAssistantChatMessage(sectionTextEn, "hi");
    expect(translatedHi).toContain("### 1. आपका प्रश्न");
    expect(translatedHi).toContain("### 2. संक्षेप में उत्तर");
    expect(translatedHi).toContain("### 3. आपकी कुंडली क्या दर्शाती है");

    // Translating back to English restores the English headers
    const restoredEn = await translateAssistantChatMessage(translatedHi, "en");
    expect(restoredEn).toContain("### 1. Your Question");
    expect(restoredEn).toContain("### 2. Simple Answer");
    expect(restoredEn).toContain("### 3. What Your Kundli Shows");
  });

  it("caches translated responses for zero-latency switching", async () => {
    const customText = "Mars placed in the 4th house in Capricorn gives strong discipline and resilience.";
    const hash = computeReportHash(customText);

    expect(getCachedChatTranslation(hash, "hi")).toBeNull();

    const translated = await translateAssistantChatMessage(customText, "hi");
    expect(getCachedChatTranslation(hash, "hi")).toBe(translated);

    // Subsequent retrieval uses cache
    const secondCall = await translateAssistantChatMessage(customText, "hi");
    expect(secondCall).toBe(translated);
  });

  it("verifies PC topbar is not hidden with display: none in globals.css", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf-8");
    expect(css).not.toMatch(/\.app-shell\s*>\s*\.main-panel\s*>\s*\.topbar\s*\{\s*display:\s*none\s*!important/);
    expect(css).toMatch(/\.app-shell\s*>\s*\.main-panel\s*>\s*\.topbar\s*\{[^}]*display:\s*flex\s*!important/);
  });
});
