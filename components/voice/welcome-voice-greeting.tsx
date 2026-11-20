"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { speakUnified } from "@/lib/voice/unified-tts-client";

const STORAGE_KEY = "hasPlayedWelcomeGreeting";

export default function WelcomeVoiceGreeting() {
  const { language } = useLanguage();
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if the greeting was already played in this browser
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "true") {
        return;
      }
    } catch {
      // If localStorage is unavailable, proceed safely
    }

    let hasCleanedUp = false;
    let played = false;

    const removeListeners = () => {
      window.removeEventListener("click", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };

    const markPlayed = () => {
      if (played) return;
      played = true;
      try {
        window.localStorage.setItem(STORAGE_KEY, "true");
      } catch {}
      removeListeners();
    };

    const triggerGreeting = async () => {
      if (hasCleanedUp || played) return;
      try {
        if (window.localStorage.getItem(STORAGE_KEY) === "true") {
          markPlayed();
          return;
        }
      } catch {}

      const currentLang = languageRef.current === "hi" ? "hi" : "en";
      const greetingText =
        currentLang === "hi"
          ? "नमस्ते, वैदिक एआई में आपका स्वागत है।"
          : "How can I assist you?";

      try {
        await speakUnified({
          text: greetingText,
          language: currentLang,
          speed: 1.0,
          onStart: () => {
            markPlayed();
          },
        });
      } catch (err) {
        // Autoplay blocked by browser policy, interaction listener will trigger on first user touch/click
        console.info("[welcome-voice] Autoplay blocked, waiting for user interaction:", err);
      }
    };

    const onFirstInteraction = () => {
      if (played || hasCleanedUp) return;
      markPlayed();

      const currentLang = languageRef.current === "hi" ? "hi" : "en";
      const greetingText =
        currentLang === "hi"
          ? "नमस्ते, वैदिक एआई में आपका स्वागत है।"
          : "How can I assist you?";

      void speakUnified({
        text: greetingText,
        language: currentLang,
        speed: 1.0,
      }).catch((e) => {
        console.warn("[welcome-voice] Greeting playback error on interaction:", e);
      });
    };

    // Attach interaction listener immediately to catch the very first touch/click
    window.addEventListener("click", onFirstInteraction, { once: true, passive: true });
    window.addEventListener("touchstart", onFirstInteraction, { once: true, passive: true });
    window.addEventListener("pointerdown", onFirstInteraction, { once: true, passive: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true, passive: true });

    // Also attempt autoplay after a short hydration delay
    const timer = setTimeout(() => {
      void triggerGreeting();
    }, 600);

    return () => {
      hasCleanedUp = true;
      clearTimeout(timer);
      removeListeners();
    };
  }, []);

  return null;
}
